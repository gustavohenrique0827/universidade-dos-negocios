-- Fase 3: painel completo (financeiro, saques, reembolso, order bump, alunos)

-- ===== Produtos: categoria, garantia, parcelamento, order bump =====
alter table public.products
  add column categoria text,
  add column garantia_dias integer not null default 7 check (garantia_dias between 0 and 30),
  add column parcelas_max integer not null default 12 check (parcelas_max between 1 and 12),
  add column bump_titulo text,
  add column bump_descricao text,
  add column bump_preco_centavos integer check (bump_preco_centavos >= 0);

-- ===== Pedidos: dados do comprador (o produtor não lê profiles de terceiros) =====
alter table public.orders
  add column comprador_nome text,
  add column comprador_email text,
  add column metodo text not null default 'pix' check (metodo in ('pix', 'cartao', 'boleto')),
  add column parcelas integer not null default 1 check (parcelas between 1 and 12),
  add column bump_aceito boolean not null default false,
  add column bump_valor_centavos integer not null default 0,
  add column reembolsado_em timestamptz;

-- ===== Saques =====
create type public.withdrawal_status as enum ('solicitado', 'pago');

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  valor_centavos integer not null check (valor_centavos > 0),
  status public.withdrawal_status not null default 'solicitado',
  created_at timestamptz not null default now()
);
alter table public.withdrawals enable row level security;
create policy "saque: ver o proprio" on public.withdrawals for select using (user_id = auth.uid());

-- ===== Virar produtor (marketplace aberto) =====
create function public.become_producer() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  update public.profiles set role = 'produtor' where id = auth.uid() and role = 'aluno';
end $$;
grant execute on function public.become_producer() to authenticated;

-- ===== Pedido (substitui a versão da fase 2): método, parcelas e order bump =====
drop function public.create_order(uuid, text, text);
create function public.create_order(
  p_product uuid, p_cupom text default null, p_ref text default null,
  p_metodo text default 'pix', p_parcelas integer default 1, p_bump boolean default false
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  prod public.products;
  cup public.coupons;
  aff public.affiliate_links;
  valor integer;
  bump integer := 0;
  oid uuid;
  v_nome text;
  v_email text;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if p_metodo not in ('pix', 'cartao', 'boleto') then raise exception 'método de pagamento inválido'; end if;
  select * into prod from public.products where id = p_product and publicado;
  if not found then raise exception 'produto indisponível'; end if;
  if exists (select 1 from public.enrollments where user_id = auth.uid() and product_id = p_product) then
    raise exception 'você já tem acesso a este produto';
  end if;
  if p_parcelas < 1 or p_parcelas > prod.parcelas_max or (p_metodo <> 'cartao' and p_parcelas <> 1) then
    raise exception 'parcelamento inválido';
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
  if p_bump and prod.bump_preco_centavos is not null then bump := prod.bump_preco_centavos; end if;

  if p_ref is not null and p_ref <> '' then
    select * into aff from public.affiliate_links where codigo = p_ref and product_id = p_product;
    if found and aff.user_id = auth.uid() then aff := null; end if;
  end if;

  select coalesce(pr.nome, 'Aluno') into v_nome from public.profiles pr where pr.id = auth.uid();
  select u.email into v_email from auth.users u where u.id = auth.uid();

  insert into public.orders (product_id, comprador_id, affiliate_link_id, coupon_id, valor_centavos,
    comprador_nome, comprador_email, metodo, parcelas, bump_aceito, bump_valor_centavos)
  values (p_product, auth.uid(), aff.id, cup.id, valor + bump,
    v_nome, v_email, p_metodo, p_parcelas, bump > 0, bump)
  returning id into oid;

  if valor + bump = 0 then perform public.settle_order(oid); end if;
  return oid;
end $$;
grant execute on function public.create_order(uuid, text, text, text, integer, boolean) to authenticated;

-- ===== Reembolso (dono do produto) =====
create function public.refund_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order for update;
  if not found or not public.owns_product(o.product_id) then raise exception 'sem permissão'; end if;
  if o.status <> 'pago' then raise exception 'só pedidos pagos podem ser reembolsados'; end if;
  update public.orders set status = 'reembolsado', reembolsado_em = now() where id = p_order;
  delete from public.commissions where order_id = p_order;
  delete from public.enrollments where user_id = o.comprador_id and product_id = o.product_id;
end $$;
revoke execute on function public.refund_order(uuid) from public, anon;
grant execute on function public.refund_order(uuid) to authenticated;

-- ===== Financeiro =====
-- taxa da plataforma: 9,9% sobre cada venda paga; valor fica "a liberar" durante a garantia do produto
create function public.producer_balance() returns jsonb
language sql stable security definer set search_path = '' as $$
  with vendas as (
    select o.id, o.valor_centavos, o.paid_at, p.garantia_dias,
           floor(o.valor_centavos * 0.901)::integer - coalesce((select c.valor_centavos from public.commissions c where c.order_id = o.id), 0) as liquido
    from public.orders o join public.products p on p.id = o.product_id
    where p.produtor_id = auth.uid() and o.status = 'pago'
  ), saques as (
    select coalesce(sum(valor_centavos), 0)::integer as total from public.withdrawals where user_id = auth.uid()
  )
  select jsonb_build_object(
    'disponivel', coalesce((select sum(liquido) from vendas where paid_at <= now() - make_interval(days => garantia_dias)), 0)::integer - (select total from saques),
    'a_liberar', coalesce((select sum(liquido) from vendas where paid_at > now() - make_interval(days => garantia_dias)), 0)::integer,
    'sacado', (select total from saques)
  );
$$;
grant execute on function public.producer_balance() to authenticated;

create function public.request_withdrawal(p_valor integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare disp integer; wid uuid;
begin
  if not public.is_produtor() then raise exception 'sem permissão'; end if;
  if p_valor < 5000 then raise exception 'o saque mínimo é R$ 50,00'; end if;
  -- serializa saques do mesmo usuário
  perform 1 from public.profiles where id = auth.uid() for update;
  disp := (public.producer_balance()->>'disponivel')::integer;
  if p_valor > disp then raise exception 'saldo disponível insuficiente'; end if;
  insert into public.withdrawals (user_id, valor_centavos) values (auth.uid(), p_valor) returning id into wid;
  return wid;
end $$;
grant execute on function public.request_withdrawal(integer) to authenticated;

-- ===== Alunos do produto, com progresso =====
create function public.product_students(p_product uuid)
returns table (user_id uuid, nome text, email text, matriculado_em timestamptz, progresso_pct integer)
language plpgsql stable security definer set search_path = '' as $$
declare total integer;
begin
  if not public.owns_product(p_product) then raise exception 'sem permissão'; end if;
  select count(*) into total from public.lessons l join public.modules m on m.id = l.module_id where m.product_id = p_product;
  return query
    select e.user_id, coalesce(pr.nome, 'Aluno'), u.email::text, e.created_at,
      case when total = 0 then 0 else (
        select count(*)::integer * 100 / total from public.lesson_progress lp
        join public.lessons l on l.id = lp.lesson_id join public.modules m on m.id = l.module_id
        where lp.user_id = e.user_id and m.product_id = p_product) end
    from public.enrollments e
    join public.profiles pr on pr.id = e.user_id
    join auth.users u on u.id = e.user_id
    where e.product_id = p_product order by e.created_at desc;
end $$;
revoke execute on function public.product_students(uuid) from public, anon;
grant execute on function public.product_students(uuid) to authenticated;

-- ===== Afiliados do produtor (links, vendas, comissões) =====
create function public.my_affiliates()
returns table (afiliado_id uuid, nome text, product_id uuid, titulo text, codigo text, vendas integer, comissao_centavos integer, pendente_centavos integer)
language sql stable security definer set search_path = '' as $$
  select l.user_id, coalesce(pr.nome, 'Afiliado'), l.product_id, p.titulo, l.codigo,
    (select count(*)::integer from public.orders o where o.affiliate_link_id = l.id and o.status = 'pago'),
    coalesce((select sum(c.valor_centavos) from public.commissions c join public.orders o on o.id = c.order_id where o.affiliate_link_id = l.id), 0)::integer,
    coalesce((select sum(c.valor_centavos) from public.commissions c join public.orders o on o.id = c.order_id where o.affiliate_link_id = l.id and c.status = 'pendente'), 0)::integer
  from public.affiliate_links l
  join public.products p on p.id = l.product_id and p.produtor_id = auth.uid()
  join public.profiles pr on pr.id = l.user_id
$$;
grant execute on function public.my_affiliates() to authenticated;

-- ===== Marketplace de afiliação (substitui a versão da fase 2, agora com capa e categoria) =====
drop function public.affiliate_catalog();
create function public.affiliate_catalog()
returns table (id uuid, titulo text, slug text, capa_url text, categoria text, preco_centavos integer, comissao_afiliado_pct integer)
language sql stable security definer set search_path = '' as $$
  select id, titulo, slug, capa_url, categoria, preco_centavos, comissao_afiliado_pct
  from public.products where publicado and comissao_afiliado_pct > 0 and produtor_id <> auth.uid();
$$;
grant execute on function public.affiliate_catalog() to authenticated;

-- ===== Desempenho dos meus links como afiliado =====
create function public.affiliate_stats()
returns table (codigo text, product_id uuid, titulo text, slug text, vendas integer, comissao_centavos integer, pendente_centavos integer)
language sql stable security definer set search_path = '' as $$
  select l.codigo, l.product_id, p.titulo, p.slug,
    (select count(*)::integer from public.orders o where o.affiliate_link_id = l.id and o.status = 'pago'),
    coalesce((select sum(c.valor_centavos) from public.commissions c join public.orders o on o.id = c.order_id where o.affiliate_link_id = l.id), 0)::integer,
    coalesce((select sum(c.valor_centavos) from public.commissions c join public.orders o on o.id = c.order_id where o.affiliate_link_id = l.id and c.status = 'pendente'), 0)::integer
  from public.affiliate_links l join public.products p on p.id = l.product_id
  where l.user_id = auth.uid();
$$;
grant execute on function public.affiliate_stats() to authenticated;
