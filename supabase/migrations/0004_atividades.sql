-- Fase 4: atividades interativas (quiz e perguntas abertas) com correção automática e manual

create type public.question_type as enum ('unica', 'multipla', 'vf', 'texto');
create type public.submission_status as enum ('corrigida', 'pendente');

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  titulo text not null,
  descricao text,
  nota_minima integer not null default 70 check (nota_minima between 0 and 100),
  obrigatoria boolean not null default false,
  tentativas_max integer check (tentativas_max is null or tentativas_max >= 1),
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.activity_questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  tipo public.question_type not null,
  enunciado text not null,
  opcoes jsonb not null default '[]'::jsonb,   -- [{ "id": "a", "texto": "..." }]
  correta jsonb not null default '[]'::jsonb,  -- ["a"] (ids das opções corretas); vf usa ["v"] ou ["f"]
  explicacao text,
  pontos integer not null default 1 check (pontos between 1 and 100),
  ordem integer not null default 0
);

create table public.activity_submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  respostas jsonb not null,
  pontos_auto integer not null default 0,
  pontos_manual integer,
  pontos_total integer not null,
  status public.submission_status not null,
  nota integer,
  aprovado boolean,
  feedback text,
  tentativa integer not null,
  created_at timestamptz not null default now(),
  corrigida_em timestamptz
);
create index on public.activity_submissions (activity_id, user_id);

-- produto a que a atividade pertence
create function public.activity_product(p_activity uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.product_id from public.activities a
  join public.lessons l on l.id = a.lesson_id join public.modules m on m.id = l.module_id
  where a.id = p_activity;
$$;

-- produto a que a aula pertence (as políticas de activities usam a aula: a própria linha ainda não existe num INSERT ... RETURNING)
create function public.lesson_product(p_lesson uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.product_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = p_lesson;
$$;

alter table public.activities enable row level security;
alter table public.activity_questions enable row level security;
alter table public.activity_submissions enable row level security;

-- atividades: visíveis para quem tem acesso ao curso; o dono gerencia
create policy "atividade: ler com acesso" on public.activities for select
  using (public.has_access(public.lesson_product(lesson_id)));
create policy "atividade: dono gerencia" on public.activities for all
  using (public.owns_product(public.lesson_product(lesson_id)))
  with check (public.owns_product(public.lesson_product(lesson_id)));

-- perguntas contêm o gabarito: só o dono lê. O aluno usa activity_for_student().
create policy "pergunta: dono gerencia" on public.activity_questions for all
  using (public.owns_product(public.activity_product(activity_id)))
  with check (public.owns_product(public.activity_product(activity_id)));

-- envios: o aluno vê os seus; o dono vê os do seu produto. Gravação só pelas funções abaixo.
create policy "envio: ver o proprio ou do meu produto" on public.activity_submissions for select
  using (user_id = auth.uid() or public.owns_product(public.activity_product(activity_id)));

-- Atividade para o aluno responder: sem gabarito nem explicações
create function public.activity_for_student(p_activity uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare a public.activities; usadas integer;
begin
  select * into a from public.activities where id = p_activity;
  if not found or not public.has_access(public.activity_product(p_activity)) then raise exception 'sem acesso'; end if;
  select count(*) into usadas from public.activity_submissions where activity_id = p_activity and user_id = auth.uid();
  return jsonb_build_object(
    'id', a.id, 'titulo', a.titulo, 'descricao', a.descricao, 'nota_minima', a.nota_minima,
    'obrigatoria', a.obrigatoria, 'tentativas_max', a.tentativas_max, 'tentativas_usadas', usadas,
    'perguntas', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'tipo', q.tipo, 'enunciado', q.enunciado, 'opcoes', q.opcoes, 'pontos', q.pontos) order by q.ordem)
                           from public.activity_questions q where q.activity_id = p_activity), '[]'::jsonb));
end $$;
grant execute on function public.activity_for_student(uuid) to authenticated;

-- Envia respostas: corrige automaticamente as de marcar; dissertativas ficam pendentes de revisão.
-- p_respostas: { "<id da pergunta>": ["a", "c"] }  ou  { "<id>": "texto livre" }
create function public.submit_activity(p_activity uuid, p_respostas jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a public.activities; q public.activity_questions;
  usadas integer; total integer := 0; auto integer := 0; tem_texto boolean := false;
  resp jsonb; dadas text[]; certas text[]; ok boolean;
  detalhes jsonb := '[]'::jsonb; sid uuid; v_nota integer; v_aprovado boolean; v_status public.submission_status;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into a from public.activities where id = p_activity;
  if not found or not public.has_access(public.activity_product(p_activity)) then raise exception 'sem acesso'; end if;
  select count(*) into usadas from public.activity_submissions where activity_id = p_activity and user_id = auth.uid();
  if a.tentativas_max is not null and usadas >= a.tentativas_max then raise exception 'você já usou todas as tentativas desta atividade'; end if;

  for q in select * from public.activity_questions where activity_id = p_activity order by ordem loop
    total := total + q.pontos;
    resp := p_respostas -> q.id::text;
    if q.tipo = 'texto' then
      tem_texto := true;
      detalhes := detalhes || jsonb_build_object('pergunta_id', q.id, 'correta', null, 'explicacao', q.explicacao);
    else
      if resp is null or jsonb_typeof(resp) <> 'array' then dadas := '{}';
      else select coalesce(array_agg(x order by x), '{}') into dadas from jsonb_array_elements_text(resp) x; end if;
      select coalesce(array_agg(x order by x), '{}') into certas from jsonb_array_elements_text(q.correta) x;
      ok := dadas = certas;
      if ok then auto := auto + q.pontos; end if;
      detalhes := detalhes || jsonb_build_object('pergunta_id', q.id, 'correta', ok, 'esperado', q.correta, 'explicacao', q.explicacao);
    end if;
  end loop;
  if total = 0 then raise exception 'esta atividade ainda não tem perguntas'; end if;

  if tem_texto then v_status := 'pendente'; v_nota := null; v_aprovado := null;
  else v_status := 'corrigida'; v_nota := round(auto * 100.0 / total); v_aprovado := v_nota >= a.nota_minima; end if;

  insert into public.activity_submissions (activity_id, user_id, respostas, pontos_auto, pontos_total, status, nota, aprovado, tentativa, corrigida_em)
  values (p_activity, auth.uid(), p_respostas, auto, total, v_status, v_nota, v_aprovado, usadas + 1, case when v_status = 'corrigida' then now() end)
  returning id into sid;

  return jsonb_build_object('submission_id', sid, 'status', v_status, 'nota', v_nota, 'aprovado', v_aprovado, 'tentativa', usadas + 1, 'detalhes', detalhes);
end $$;
grant execute on function public.submit_activity(uuid, jsonb) to authenticated;

-- Produtor corrige as perguntas abertas: informa os pontos concedidos nelas e um comentário
create function public.grade_submission(p_submission uuid, p_pontos integer, p_feedback text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.activity_submissions; a public.activities; max_manual integer; v_nota integer;
begin
  select * into s from public.activity_submissions where id = p_submission for update;
  if not found or not public.owns_product(public.activity_product(s.activity_id)) then raise exception 'sem permissão'; end if;
  select * into a from public.activities where id = s.activity_id;
  select coalesce(sum(pontos), 0) into max_manual from public.activity_questions where activity_id = s.activity_id and tipo = 'texto';
  if p_pontos < 0 or p_pontos > max_manual then raise exception 'os pontos devem ficar entre 0 e %', max_manual; end if;
  v_nota := round((s.pontos_auto + p_pontos) * 100.0 / s.pontos_total);
  update public.activity_submissions
    set pontos_manual = p_pontos, nota = v_nota, aprovado = v_nota >= a.nota_minima, feedback = nullif(p_feedback, ''),
        status = 'corrigida', corrigida_em = now()
    where id = p_submission;
end $$;
revoke execute on function public.grade_submission(uuid, integer, text) from public, anon;
grant execute on function public.grade_submission(uuid, integer, text) to authenticated;

-- Envios dos alunos para o produtor (com nome e e-mail, que ele não lê direto de profiles)
create function public.activity_submissions_owner(p_product uuid)
returns table (id uuid, activity_id uuid, atividade text, user_id uuid, nome text, email text, status text, nota integer, aprovado boolean,
               pontos_auto integer, pontos_manual integer, pontos_total integer, respostas jsonb, feedback text, tentativa integer, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.owns_product(p_product) then raise exception 'sem permissão'; end if;
  return query
    select s.id, s.activity_id, a.titulo, s.user_id, coalesce(pr.nome, 'Aluno'), u.email::text, s.status::text, s.nota, s.aprovado,
           s.pontos_auto, s.pontos_manual, s.pontos_total, s.respostas, s.feedback, s.tentativa, s.created_at
    from public.activity_submissions s
    join public.activities a on a.id = s.activity_id
    join public.lessons l on l.id = a.lesson_id join public.modules m on m.id = l.module_id
    join public.profiles pr on pr.id = s.user_id
    join auth.users u on u.id = s.user_id
    where m.product_id = p_product order by s.created_at desc;
end $$;
revoke execute on function public.activity_submissions_owner(uuid) from public, anon;
grant execute on function public.activity_submissions_owner(uuid) to authenticated;

-- Certificado: exige as atividades marcadas como obrigatórias (substitui a versão da fase 2)
create or replace function public.issue_certificate(p_product uuid) returns text
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
  if exists (
    select 1 from public.activities a join public.lessons l on l.id = a.lesson_id join public.modules m on m.id = l.module_id
    where m.product_id = p_product and a.obrigatoria
      and not exists (select 1 from public.activity_submissions s where s.activity_id = a.id and s.user_id = auth.uid() and s.aprovado)
  ) then raise exception 'conclua com aprovação as atividades obrigatórias para emitir o certificado'; end if;
  select codigo into cod from public.certificates where user_id = auth.uid() and product_id = p_product;
  if cod is not null then return cod; end if;
  select coalesce(pr.nome, 'Aluno') into v_nome from public.profiles pr where pr.id = auth.uid();
  select pd.titulo into v_titulo from public.products pd where pd.id = p_product;
  insert into public.certificates (user_id, product_id, nome_aluno, titulo_curso)
  values (auth.uid(), p_product, v_nome, v_titulo) returning codigo into cod;
  return cod;
end $$;
