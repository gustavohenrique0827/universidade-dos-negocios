-- Fase 2: vitrine, pedidos, cupons, afiliados, certificados, comunidade, storage

alter table public.products
  add column comissao_afiliado_pct integer not null default 0 check (comissao_afiliado_pct between 0 and 90),
  add column descricao_longa text;

-- ===== Cupons =====
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  codigo text not null,
  percentual integer not null check (percentual between 1 and 100),
  usos_max integer,
  usos integer not null default 0,
  ativo boolean not null default true,
  unique (product_id, codigo)
);

-- ===== Afiliados =====
create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  codigo text not null unique,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ===== Pedidos =====
create type public.order_status as enum ('pendente', 'pago', 'cancelado', 'reembolsado');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  comprador_id uuid not null references public.profiles(id) on delete restrict,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  valor_centavos integer not null,
  status public.order_status not null default 'pendente',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create type public.commission_status as enum ('pendente', 'paga');

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  afiliado_id uuid not null references public.profiles(id) on delete cascade,
  valor_centavos integer not null,
  status public.commission_status not null default 'pendente'
);

-- ===== Certificados =====
create table public.certificates (
  codigo text primary key default encode(gen_random_bytes(8), 'hex'),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  nome_aluno text not null,
  titulo_curso text not null,
  emitido_em timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ===== Comunidade (comentários por aula) =====
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  autor_nome text not null default '',
  texto text not null check (length(texto) between 1 and 2000),
  created_at timestamptz not null default now()
);

create function public.fill_comment_author() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select coalesce(nome, 'Aluno') into new.autor_nome from public.profiles where id = new.user_id;
  return new;
end $$;
create trigger comments_author before insert on public.comments
  for each row execute function public.fill_comment_author();

alter table public.coupons enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.orders enable row level security;
alter table public.commissions enable row level security;
alter table public.certificates enable row level security;
alter table public.comments enable row level security;

-- cupons: só o dono do produto (validação pelo comprador é via RPC)
create policy "cupom: dono gerencia" on public.coupons for all
  using (public.owns_product(product_id)) with check (public.owns_product(product_id));

-- afiliado vê e cria os próprios links; produto precisa pagar comissão
create policy "link: ver o proprio" on public.affiliate_links for select using (user_id = auth.uid());
create policy "link: criar o proprio" on public.affiliate_links for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.products p where p.id = product_id and p.publicado and p.comissao_afiliado_pct > 0 and p.produtor_id <> auth.uid())
);

-- pedidos: comprador e dono do produto leem; criação/alteração só por RPC
create policy "pedido: ver" on public.orders for select
  using (comprador_id = auth.uid() or public.owns_product(product_id));

create policy "comissao: ver" on public.commissions for select
  using (afiliado_id = auth.uid()
    or public.owns_product((select product_id from public.orders where id = order_id)));
create policy "comissao: dono marca paga" on public.commissions for update
  using (public.owns_product((select product_id from public.orders where id = order_id)));

create policy "certificado: ver o proprio" on public.certificates for select using (user_id = auth.uid());

create policy "comentario: ler com acesso" on public.comments for select
  using (public.has_access((select m.product_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = lesson_id)));
create policy "comentario: comentar" on public.comments for insert
  with check (user_id = auth.uid()
    and public.has_access((select m.product_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = lesson_id)));
create policy "comentario: apagar o proprio ou dono" on public.comments for delete
  using (user_id = auth.uid()
    or public.owns_product((select m.product_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = lesson_id)));

-- ===== RPCs =====

-- Currículo público (só títulos) para a página de vendas
create function public.public_curriculum(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'titulo', m.titulo,
    'aulas', (select coalesce(jsonb_agg(l.titulo order by l.ordem), '[]'::jsonb) from public.lessons l where l.module_id = m.id)
  ) order by m.ordem), '[]'::jsonb)
  from public.modules m join public.products p on p.id = m.product_id
  where p.slug = p_slug and p.publicado;
$$;
grant execute on function public.public_curriculum(text) to anon, authenticated;

-- Valida cupom: devolve percentual (0 se inválido)
create function public.validate_coupon(p_product uuid, p_codigo text) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select percentual from public.coupons
    where product_id = p_product and lower(codigo) = lower(p_codigo) and ativo
      and (usos_max is null or usos < usos_max)), 0);
$$;
grant execute on function public.validate_coupon(uuid, text) to authenticated;

-- Cria pedido: preço calculado no servidor. Grátis => matrícula imediata.
create function public.create_order(p_product uuid, p_cupom text default null, p_ref text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  prod public.products;
  cup public.coupons;
  aff public.affiliate_links;
  valor integer;
  oid uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into prod from public.products where id = p_product and publicado;
  if not found then raise exception 'produto indisponível'; end if;
  if exists (select 1 from public.enrollments where user_id = auth.uid() and product_id = p_product) then
    raise exception 'você já tem acesso a este produto';
  end if;
  valor := prod.preco_centavos;

  if p_cupom is not null and p_cupom <> '' then
    select * into cup from public.coupons
      where product_id = p_product and lower(codigo) = lower(p_cupom) and ativo
        and (usos_max is null or usos < usos_max) for update;
    if not found then raise exception 'cupom inválido'; end if;
    valor := valor - (valor * cup.percentual / 100);
    update public.coupons set usos = usos + 1 where id = cup.id;
  end if;

  if p_ref is not null and p_ref <> '' then
    select * into aff from public.affiliate_links where codigo = p_ref and product_id = p_product;
    if found and aff.user_id = auth.uid() then aff := null; end if;
  end if;

  insert into public.orders (product_id, comprador_id, affiliate_link_id, coupon_id, valor_centavos)
  values (p_product, auth.uid(), aff.id, cup.id, valor) returning id into oid;

  if valor = 0 then perform public.settle_order(oid); end if;
  return oid;
end $$;
grant execute on function public.create_order(uuid, text, text) to authenticated;

-- Liquida pedido: matricula e gera comissão (uso interno + confirm_order)
create function public.settle_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  pct integer;
  aff uuid;
begin
  select * into o from public.orders where id = p_order for update;
  if o.status = 'pago' then return; end if;
  update public.orders set status = 'pago', paid_at = now() where id = p_order;
  insert into public.enrollments (user_id, product_id) values (o.comprador_id, o.product_id) on conflict do nothing;
  if o.affiliate_link_id is not null and o.valor_centavos > 0 then
    select comissao_afiliado_pct into pct from public.products where id = o.product_id;
    select user_id into aff from public.affiliate_links where id = o.affiliate_link_id;
    if pct > 0 and aff is not null then
      insert into public.commissions (order_id, afiliado_id, valor_centavos)
      values (p_order, aff, o.valor_centavos * pct / 100) on conflict do nothing;
    end if;
  end if;
end $$;
revoke execute on function public.settle_order(uuid) from public, anon, authenticated;

-- Dono confirma pagamento (Pix/transferência manual até integrar gateway)
create function public.confirm_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  select product_id into pid from public.orders where id = p_order;
  if pid is null or not public.owns_product(pid) then raise exception 'sem permissão'; end if;
  perform public.settle_order(p_order);
end $$;
revoke execute on function public.confirm_order(uuid) from public, anon;
grant execute on function public.confirm_order(uuid) to authenticated;

create function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  select product_id into pid from public.orders where id = p_order;
  if pid is null or not public.owns_product(pid) then raise exception 'sem permissão'; end if;
  update public.orders set status = 'cancelado' where id = p_order and status = 'pendente';
end $$;
revoke execute on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

-- Certificado: só com 100% das aulas concluídas
create function public.issue_certificate(p_product uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  total integer; feitas integer; cod text; v_nome text; v_titulo text;
begin
  if auth.uid() is null or not exists (select 1 from public.enrollments where user_id = auth.uid() and product_id = p_product) then
    raise exception 'sem matrícula';
  end if;
  select count(*) into total from public.lessons l join public.modules m on m.id = l.module_id where m.product_id = p_product;
  select count(*) into feitas from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id join public.modules m on m.id = l.module_id
    where m.product_id = p_product and lp.user_id = auth.uid();
  if total = 0 or feitas < total then raise exception 'conclua todas as aulas para emitir o certificado'; end if;
  select codigo into cod from public.certificates where user_id = auth.uid() and product_id = p_product;
  if cod is not null then return cod; end if;
  select coalesce(pr.nome, 'Aluno') into v_nome from public.profiles pr where pr.id = auth.uid();
  select pd.titulo into v_titulo from public.products pd where pd.id = p_product;
  insert into public.certificates (user_id, product_id, nome_aluno, titulo_curso)
  values (auth.uid(), p_product, v_nome, v_titulo) returning codigo into cod;
  return cod;
end $$;
grant execute on function public.issue_certificate(uuid) to authenticated;

-- Verificação pública de certificado
create function public.verify_certificate(p_codigo text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(c) - 'user_id' - 'product_id' from public.certificates c where codigo = p_codigo;
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Quem sou eu como afiliado: nome do produto + link
create function public.affiliate_catalog() returns table (id uuid, titulo text, slug text, preco_centavos integer, comissao_afiliado_pct integer)
language sql stable security definer set search_path = '' as $$
  select id, titulo, slug, preco_centavos, comissao_afiliado_pct
  from public.products where publicado and comissao_afiliado_pct > 0;
$$;
grant execute on function public.affiliate_catalog() to authenticated;

-- ===== Storage =====
insert into storage.buckets (id, name, public) values ('capas', 'capas', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('aulas', 'aulas', false) on conflict do nothing;

-- caminho: <product_id>/<arquivo>
create policy "capas: leitura publica" on storage.objects for select using (bucket_id = 'capas');
create policy "capas: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'capas' and public.owns_product(((storage.foldername(name))[1])::uuid));
create policy "capas: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'capas' and public.owns_product(((storage.foldername(name))[1])::uuid));

create policy "aulas: acesso le" on storage.objects for select to authenticated
  using (bucket_id = 'aulas' and public.has_access(((storage.foldername(name))[1])::uuid));
create policy "aulas: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'aulas' and public.owns_product(((storage.foldername(name))[1])::uuid));
create policy "aulas: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'aulas' and public.owns_product(((storage.foldername(name))[1])::uuid));
