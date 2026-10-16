-- Universidade dos Negócios: schema inicial (MVP produtor + área de membros)

create type public.app_role as enum ('aluno', 'produtor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  role public.app_role not null default 'aluno',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  produtor_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  slug text not null unique,
  descricao text,
  capa_url text,
  preco_centavos integer not null default 0,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  titulo text not null,
  ordem integer not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  titulo text not null,
  video_url text,
  conteudo text,
  ordem integer not null default 0
);

create table public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  concluida_em timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- cria o perfil automaticamente no cadastro
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_produtor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('produtor','admin'));
$$;

create function public.owns_product(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.products where id = pid and produtor_id = auth.uid());
$$;

create function public.has_access(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.owns_product(pid)
      or exists (select 1 from public.enrollments where product_id = pid and user_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- profiles: cada um vê e edita o seu (role não é editável pelo cliente)
create policy "perfil: ler o proprio" on public.profiles for select using (id = auth.uid());
create policy "perfil: editar o proprio" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- products: publicados são públicos; produtor gerencia os seus
create policy "produto: ver publicados ou proprios" on public.products for select
  using (publicado or produtor_id = auth.uid());
create policy "produto: produtor cria" on public.products for insert
  with check (produtor_id = auth.uid() and public.is_produtor());
create policy "produto: produtor edita" on public.products for update using (produtor_id = auth.uid());
create policy "produto: produtor apaga" on public.products for delete using (produtor_id = auth.uid());

-- modules / lessons: só quem tem acesso (aluno matriculado ou dono)
create policy "modulo: ler com acesso" on public.modules for select using (public.has_access(product_id));
create policy "modulo: dono gerencia" on public.modules for all
  using (public.owns_product(product_id)) with check (public.owns_product(product_id));

create policy "aula: ler com acesso" on public.lessons for select
  using (public.has_access((select product_id from public.modules where id = module_id)));
create policy "aula: dono gerencia" on public.lessons for all
  using (public.owns_product((select product_id from public.modules where id = module_id)))
  with check (public.owns_product((select product_id from public.modules where id = module_id)));

-- enrollments: aluno vê as suas; matrícula manual pelo produtor (pagamento entra depois)
create policy "matricula: ver a propria ou do meu produto" on public.enrollments for select
  using (user_id = auth.uid() or public.owns_product(product_id));
create policy "matricula: produtor matricula" on public.enrollments for insert
  with check (public.owns_product(product_id));

-- progresso
create policy "progresso: ver o proprio" on public.lesson_progress for select using (user_id = auth.uid());
create policy "progresso: marcar o proprio" on public.lesson_progress for insert
  with check (user_id = auth.uid()
    and public.has_access((select m.product_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = lesson_id)));
create policy "progresso: desmarcar o proprio" on public.lesson_progress for delete using (user_id = auth.uid());

-- matrícula manual por e-mail (somente o dono do produto); pagamentos virão depois
create function public.enroll_by_email(p_product uuid, p_email text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if not public.owns_product(p_product) then
    raise exception 'sem permissão';
  end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then return false; end if;
  insert into public.enrollments (user_id, product_id) values (uid, p_product) on conflict do nothing;
  return true;
end $$;
revoke execute on function public.enroll_by_email(uuid, text) from public, anon;
grant execute on function public.enroll_by_email(uuid, text) to authenticated;
