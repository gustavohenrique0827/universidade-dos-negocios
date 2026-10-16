/**
 * Modo demonstração: imita o subconjunto do supabase-js usado pelo app, com dados em memória.
 * Ativado só com VITE_DEMO=true (npm run demo). Serve para visualizar a plataforma sem backend.
 */
type Row = Record<string, any>
type Result = { data: any; error: { message: string } | null }

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const NOMES = ['Ana Souza','Bruno Lima','Camila Rocha','Diego Alves','Eduarda Nunes','Felipe Costa','Gabriela Dias','Henrique Melo','Isabela Prado','João Pedro Reis','Karina Freitas','Lucas Barros','Mariana Teixeira','Nicolas Duarte','Olívia Cardoso','Paulo Henrique','Quésia Moura','Rafaela Gomes','Samuel Ribeiro','Tatiane Pinto','Ulisses Faria','Vanessa Lopes','Wagner Matos','Yasmin Campos','Thiago Nogueira']
const U = { prod: 'u-produtor', aluno: 'u-aluno', afil: 'u-afiliado', prod2: 'u-produtor2' }
const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

const users: Row[] = [
  { id: U.prod, email: 'produtor@demo.com', password: 'demo1234', nome: 'Marina Produtora', role: 'produtor' },
  { id: U.aluno, email: 'aluno@demo.com', password: 'demo1234', nome: 'Carlos Aluno', role: 'aluno' },
  { id: U.afil, email: 'afiliado@demo.com', password: 'demo1234', nome: 'Bia Afiliada', role: 'aluno' },
  { id: U.prod2, email: 'rafael@demo.com', password: 'demo1234', nome: 'Rafael Mentor', role: 'produtor' },
  ...NOMES.map((nome, i) => ({ id: `b${i}`, email: `${nome.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(/ /g, '.')}@exemplo.com`, password: '#', nome, role: 'aluno' })),
]

const prod = (o: Row): Row => ({ descricao_longa: null, capa_url: null, garantia_dias: 7, parcelas_max: 12, bump_titulo: null, bump_descricao: null, bump_preco_centavos: null, categoria: null, created_at: now(), ...o })

const db: Record<string, Row[]> = {
  profiles: users.map(({ id, nome, role }) => ({ id, nome, role })),
  products: [
    prod({ id: 'p1', produtor_id: U.prod, titulo: 'Negócios Fora da Curva', slug: 'negocios-fora-da-curva', descricao: 'Do zero ao primeiro milhão: o método passo a passo.', descricao_longa: 'Neste curso você aprende a validar uma ideia, vender antes de construir e escalar com caixa saudável.\n\nInclui planilhas, modelos de contrato e acesso à comunidade.', preco_centavos: 49700, publicado: true, comissao_afiliado_pct: 30, categoria: 'Empreendedorismo', bump_titulo: 'Planilha de Fluxo de Caixa', bump_descricao: 'Modelo pronto para controlar entradas e saídas desde o primeiro dia.', bump_preco_centavos: 2700 }),
    prod({ id: 'p2', produtor_id: U.prod, titulo: 'Vendas High Ticket', slug: 'vendas-high-ticket', descricao: 'Feche contratos de alto valor com previsibilidade.', preco_centavos: 99700, publicado: true, comissao_afiliado_pct: 40, categoria: 'Vendas' }),
    prod({ id: 'p3', produtor_id: U.prod, titulo: 'Aula Gratuita: Primeiros Passos', slug: 'primeiros-passos', descricao: 'Comece por aqui. Sem custo.', preco_centavos: 0, publicado: true, categoria: 'Empreendedorismo' }),
    prod({ id: 'p4', produtor_id: U.prod, titulo: 'Gestão Financeira (rascunho)', slug: 'gestao-financeira', descricao: 'Ainda em produção.', preco_centavos: 29700, publicado: false, categoria: 'Finanças' }),
    prod({ id: 'p5', produtor_id: U.prod2, titulo: 'Marketing Digital na Prática', slug: 'marketing-digital-na-pratica', descricao: 'Tráfego, copy e funil: monte sua primeira campanha lucrativa.', preco_centavos: 19700, publicado: true, comissao_afiliado_pct: 50, categoria: 'Marketing' }),
    prod({ id: 'p6', produtor_id: U.prod2, titulo: 'Mentoria em Grupo: Escala', slug: 'mentoria-escala', descricao: 'Encontros quinzenais para empresas faturando 6 dígitos.', preco_centavos: 199700, publicado: true, comissao_afiliado_pct: 0, categoria: 'Negócios', parcelas_max: 12 }),
  ],
  modules: [
    { id: 'm1', product_id: 'p1', titulo: 'Módulo 1 · Validação', ordem: 0 },
    { id: 'm2', product_id: 'p1', titulo: 'Módulo 2 · Primeiras vendas', ordem: 1 },
    { id: 'm2b', product_id: 'p1', titulo: 'Módulo 3 · Escala', ordem: 2 },
    { id: 'm3', product_id: 'p3', titulo: 'Introdução', ordem: 0 },
    { id: 'm4', product_id: 'p2', titulo: 'Fundamentos', ordem: 0 },
    { id: 'm5', product_id: 'p5', titulo: 'Tráfego pago', ordem: 0 },
  ],
  lessons: [
    { id: 'l1', module_id: 'm1', titulo: 'Como escolher um problema que paga', video_url: VIDEO, conteudo: 'Anote três problemas que você já resolveu para outras pessoas.', ordem: 0 },
    { id: 'l2', module_id: 'm1', titulo: 'Validando sem gastar um real', video_url: VIDEO, conteudo: 'Exercício: converse com 5 potenciais clientes esta semana.', ordem: 1 },
    { id: 'l3', module_id: 'm2', titulo: 'Sua primeira oferta', video_url: VIDEO, conteudo: null, ordem: 0 },
    { id: 'l3b', module_id: 'm2', titulo: 'Precificação sem medo', video_url: VIDEO, conteudo: null, ordem: 1 },
    { id: 'l3c', module_id: 'm2b', titulo: 'Contratando o primeiro time', video_url: VIDEO, conteudo: null, ordem: 0 },
    { id: 'l4', module_id: 'm3', titulo: 'Bem-vindo', video_url: VIDEO, conteudo: null, ordem: 0 },
    { id: 'l5', module_id: 'm4', titulo: 'Anatomia de uma venda de alto valor', video_url: VIDEO, conteudo: null, ordem: 0 },
    { id: 'l6', module_id: 'm5', titulo: 'Sua primeira campanha', video_url: VIDEO, conteudo: null, ordem: 0 },
  ],
  enrollments: [
    { user_id: U.aluno, product_id: 'p1', created_at: now() },
    { user_id: U.aluno, product_id: 'p3', created_at: now() },
  ],
  lesson_progress: [
    { user_id: U.aluno, lesson_id: 'l1', concluida_em: now() },
    { user_id: U.aluno, lesson_id: 'l2', concluida_em: now() },
  ],
  coupons: [
    { id: 'c1', product_id: 'p1', codigo: 'BEMVINDO20', percentual: 20, usos_max: null, usos: 3, ativo: true },
    { id: 'c2', product_id: 'p2', codigo: 'BLACK30', percentual: 30, usos_max: 50, usos: 12, ativo: true },
  ],
  affiliate_links: [
    { id: 'a1', user_id: U.afil, product_id: 'p1', codigo: 'bia2026', created_at: now() },
    { id: 'a2', user_id: U.afil, product_id: 'p2', codigo: 'bia-ht', created_at: now() },
    { id: 'a3', user_id: 'b3', product_id: 'p1', codigo: 'diego10', created_at: now() },
    { id: 'a4', user_id: 'b9', product_id: 'p2', codigo: 'joao-ht', created_at: now() },
  ],
  orders: [], commissions: [], certificates: [], withdrawals: [],
  activities: [], activity_questions: [], activity_submissions: [],
  comments: [
    { id: 'k1', lesson_id: 'l1', user_id: U.aluno, autor_nome: 'Carlos Aluno', texto: 'Ótima aula! Já listei meus três problemas.', created_at: now() },
    { id: 'k2', lesson_id: 'l1', user_id: U.prod, autor_nome: 'Marina Produtora', texto: 'Que bom, Carlos! Compartilhe sua lista na próxima aula.', created_at: now() },
  ],
}

// histórico de vendas de 90 dias para os gráficos e relatórios terem o que mostrar
;(function seedHistorico() {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const venda = db.products.filter((p) => p.publicado && p.preco_centavos > 0)
  const metodos = ['pix', 'pix', 'pix', 'cartao', 'cartao', 'boleto']
  for (let i = 0; i < 110; i++) {
    const p = venda[Math.floor(rnd() * venda.length)]
    const dias = Math.floor(Math.pow(rnd(), 0.8) * 90)
    const criado = new Date(Date.now() - dias * 86400000 - rnd() * 40000000)
    const buyer = users[4 + Math.floor(rnd() * NOMES.length)]
    const r = rnd()
    const status = dias < 1 && r < 0.3 ? 'pendente' : r < 0.08 ? 'cancelado' : r < 0.14 ? 'reembolsado' : r < 0.2 && dias < 5 ? 'pendente' : 'pago'
    const link = db.affiliate_links.find((l) => l.product_id === p.id && rnd() < 0.6)
    const bump = p.bump_preco_centavos && rnd() < 0.35 ? p.bump_preco_centavos : 0
    const metodo = metodos[Math.floor(rnd() * metodos.length)]
    const valor = Math.round((p.preco_centavos * (rnd() < 0.15 ? 0.8 : 1))) + bump
    const o: Row = { id: uid(), product_id: p.id, comprador_id: buyer.id, comprador_nome: buyer.nome, comprador_email: buyer.email, affiliate_link_id: link?.id ?? null, coupon_id: null, valor_centavos: valor, status, metodo, parcelas: metodo === 'cartao' ? 1 + Math.floor(rnd() * 6) : 1, bump_aceito: bump > 0, bump_valor_centavos: bump, created_at: criado.toISOString(), paid_at: status === 'pago' || status === 'reembolsado' ? new Date(criado.getTime() + 600000).toISOString() : null, reembolsado_em: status === 'reembolsado' ? new Date(criado.getTime() + 3 * 86400000).toISOString() : null }
    db.orders.push(o)
    if (status === 'pago') {
      if (!db.enrollments.some((e) => e.user_id === buyer.id && e.product_id === p.id)) db.enrollments.push({ user_id: buyer.id, product_id: p.id, created_at: o.paid_at })
      if (link && p.comissao_afiliado_pct > 0) db.commissions.push({ id: uid(), order_id: o.id, afiliado_id: link.user_id, valor_centavos: Math.floor((valor * p.comissao_afiliado_pct) / 100), status: dias > 20 ? 'paga' : 'pendente' })
    }
  }
  db.orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  db.withdrawals.push({ id: uid(), user_id: U.prod, valor_centavos: 150000, status: 'pago', created_at: new Date(Date.now() - 30 * 86400000).toISOString() })
  // progresso variado para a tabela de alunos
  for (const e of db.enrollments.filter((e) => e.product_id === 'p1' && e.user_id.startsWith('b'))) {
    const n = Math.floor(rnd() * 6); db.lesson_progress.push(...['l1', 'l2', 'l3', 'l3b', 'l3c'].slice(0, n).map((l) => ({ user_id: e.user_id, lesson_id: l, concluida_em: now() })))
  }
})()

const blobs: Record<string, string> = {}
let me: string | null = null
type Listener = (e: string, s: any) => void
const listeners = new Set<Listener>()
const sessionOf = (id: string | null) => (id ? { user: { id, email: users.find((u) => u.id === id)?.email } } : null)
const notify = () => listeners.forEach((l) => l(me ? 'SIGNED_IN' : 'SIGNED_OUT', sessionOf(me)))

const ownsProduct = (pid: string) => db.products.some((p) => p.id === pid && p.produtor_id === me)
const hasAccess = (pid: string) => ownsProduct(pid) || db.enrollments.some((e) => e.product_id === pid && e.user_id === me)
const productOfLesson = (lid: string) => db.modules.find((m) => m.id === db.lessons.find((l) => l.id === lid)?.module_id)?.product_id
const productOfLessonId = (lid: string) => db.modules.find((m) => m.id === db.lessons.find((l) => l.id === lid)?.module_id)?.product_id
const productOfActivity = (aid: string) => productOfLessonId(db.activities.find((a) => a.id === aid)?.lesson_id)
const productOfOrder = (oid: string) => db.orders.find((o) => o.id === oid)?.product_id

// emula as políticas de RLS do schema real
const visible: Record<string, (r: Row) => boolean> = {
  profiles: (r) => r.id === me,
  products: (r) => r.publicado || r.produtor_id === me,
  modules: (r) => hasAccess(r.product_id),
  lessons: (r) => hasAccess(db.modules.find((m) => m.id === r.module_id)?.product_id),
  enrollments: (r) => r.user_id === me || ownsProduct(r.product_id),
  lesson_progress: (r) => r.user_id === me,
  coupons: (r) => ownsProduct(r.product_id),
  affiliate_links: (r) => r.user_id === me,
  orders: (r) => r.comprador_id === me || ownsProduct(r.product_id),
  commissions: (r) => r.afiliado_id === me || ownsProduct(productOfOrder(r.order_id)),
  certificates: (r) => r.user_id === me,
  comments: (r) => hasAccess(productOfLesson(r.lesson_id)),
  withdrawals: (r) => r.user_id === me,
  activities: (r) => hasAccess(productOfLessonId(r.lesson_id)),
  activity_questions: (r) => ownsProduct(productOfActivity(r.activity_id)),
  activity_submissions: (r) => r.user_id === me || ownsProduct(productOfActivity(r.activity_id)),
}

const embeds: Record<string, { table: string; fk: string; many: boolean }> = {
  'enrollments.products': { table: 'products', fk: 'product_id', many: false },
  'orders.products': { table: 'products', fk: 'product_id', many: false },
  'modules.lessons': { table: 'lessons', fk: 'module_id', many: true },
}

function splitTop(s: string) {
  const out: string[] = []; let d = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') d++; if (ch === ')') d--
    if (ch === ',' && d === 0) { out.push(cur.trim()); cur = '' } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim()); return out
}

function project(table: string, row: Row, cols: string): Row {
  const parts = splitTop(cols)
  const out: Row = parts.includes('*') ? { ...row } : {}
  for (const part of parts) {
    const m = part.match(/^(\w+)\((.*)\)$/s)
    if (!m) { if (part !== '*') out[part] = row[part]; continue }
    const rel = embeds[`${table}.${m[1]}`]
    if (!rel) continue
    const all = db[rel.table].filter(visible[rel.table] ?? (() => true))
    if (rel.many) out[m[1]] = all.filter((r) => r[rel.fk] === row.id).map((r) => project(rel.table, r, m[2]))
    else { const t = db[rel.table].find((r) => r.id === row[rel.fk]); out[m[1]] = t ? project(rel.table, t, m[2]) : null }
  }
  return out
}

const defaults: Record<string, () => Row> = {
  products: () => ({ id: uid(), publicado: false, preco_centavos: 0, comissao_afiliado_pct: 0, descricao: null, descricao_longa: null, capa_url: null, categoria: null, garantia_dias: 7, parcelas_max: 12, bump_titulo: null, bump_descricao: null, bump_preco_centavos: null, created_at: now() }),
  modules: () => ({ id: uid(), ordem: 0 }),
  lessons: () => ({ id: uid(), video_url: null, conteudo: null, ordem: 0 }),
  coupons: () => ({ id: uid(), usos: 0, usos_max: null, ativo: true }),
  affiliate_links: () => ({ id: uid(), created_at: now() }),
  lesson_progress: () => ({ concluida_em: now() }),
  activities: () => ({ id: uid(), descricao: null, nota_minima: 70, obrigatoria: false, tentativas_max: null, ordem: 0, created_at: now() }),
  activity_questions: () => ({ id: uid(), opcoes: [], correta: [], explicacao: null, pontos: 1, ordem: 0 }),
  comments: () => ({ id: uid(), user_id: me, created_at: now(), autor_nome: db.profiles.find((p) => p.id === me)?.nome ?? 'Aluno' }),
}

class Query implements PromiseLike<Result> {
  private cols = '*'; private filters: ((r: Row) => boolean)[] = []; private sort: [string, boolean] | null = null
  private mode: 'many' | 'single' | 'maybe' = 'many'; private action: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: Row | Row[] = {}
  private table: string
  constructor(table: string) { this.table = table }
  select(cols = '*') { this.cols = cols; return this }
  insert(p: Row | Row[]) { this.action = 'insert'; this.payload = p; return this }
  update(p: Row) { this.action = 'update'; this.payload = p; return this }
  delete() { this.action = 'delete'; return this }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this }
  in(c: string, v: any[]) { this.filters.push((r) => v.includes(r[c])); return this }
  order_(c: string, asc: boolean) { this.sort = [c, asc]; return this }
  single() { this.mode = 'single'; return this }
  maybeSingle() { this.mode = 'maybe'; return this }
  then<T1, T2>(ok?: (v: Result) => T1 | PromiseLike<T1>, bad?: (e: any) => T2 | PromiseLike<T2>) {
    return new Promise<Result>((res) => setTimeout(() => res(this.run()), 120)).then(ok, bad)
  }
  private run(): Result {
    const t = db[this.table]; const ok = (data: any): Result => ({ data, error: null })
    const err = (message: string): Result => ({ data: null, error: { message } })
    if (this.action === 'insert') {
      if (!me) return err('não autenticado')
      if (Array.isArray(this.payload)) {
        const novos = (this.payload as Row[]).map((x) => ({ ...(defaults[this.table]?.() ?? {}), ...x }))
        if (this.table === 'activity_questions' && novos.some((n) => !ownsProduct(productOfActivity(n.activity_id)))) return err('new row violates row-level security policy for table "activity_questions"')
        t.push(...novos); return ok(novos)
      }
      const row = { ...(defaults[this.table]?.() ?? {}), ...this.payload }
      if (this.table === 'activities' && !ownsProduct(productOfLessonId(row.lesson_id))) return err('new row violates row-level security policy for table "activities"')
      if (this.table === 'activity_questions' && !ownsProduct(productOfActivity(row.activity_id))) return err('new row violates row-level security policy for table "activity_questions"')
      if (this.table === 'activity_submissions') return err('new row violates row-level security policy for table "activity_submissions"')
      if (this.table === 'products' && row.produtor_id !== me) return err('new row violates row-level security policy')
      if (this.table === 'products' && db.profiles.find((p) => p.id === me)?.role === 'aluno') return err('new row violates row-level security policy for table "products"')
      if (this.table === 'products' && t.some((p) => p.slug === row.slug)) return err('slug já existe')
      t.push(row); return ok([row])
    }
    const rows = t.filter((r) => (visible[this.table]?.(r) ?? true) && this.filters.every((f) => f(r)))
    if (this.action === 'update') {
      const canEdit = (r: Row) => this.table === 'products' ? r.produtor_id === me : this.table === 'commissions' ? ownsProduct(productOfOrder(r.order_id)) : true
      const dono = (r: Row) => this.table === 'activities' ? ownsProduct(productOfLessonId(r.lesson_id)) : this.table === 'activity_questions' ? ownsProduct(productOfActivity(r.activity_id)) : this.table === 'activity_submissions' ? false : canEdit(r)
      rows.filter(dono).forEach((r) => Object.assign(r, this.payload)); return ok(null)
    }
    if (this.action === 'delete') {
      for (const r of rows) {
        if (this.table === 'activities' && !ownsProduct(productOfLessonId(r.lesson_id))) continue
        if (this.table === 'activity_questions' && !ownsProduct(productOfActivity(r.activity_id))) continue
        const i = t.indexOf(r); if (i < 0) continue; t.splice(i, 1)
        if (this.table === 'products') db.modules.filter((m) => m.product_id === r.id).forEach((m) => this.cascade('modules', m))
        if (this.table === 'modules') this.cascade('modules', r, true)
      }
      limparOrfaos()
      return ok(null)
    }
    let out = rows
    if (this.sort) { const [c, asc] = this.sort; out = [...out].sort((a, b) => (a[c] > b[c] ? 1 : -1) * (asc ? 1 : -1)) }
    const data = out.map((r) => project(this.table, r, this.cols))
    if (this.mode === 'many') return ok(data)
    if (this.mode === 'single') return data[0] ? ok(data[0]) : err('nenhuma linha encontrada')
    return ok(data[0] ?? null)
  }
  private cascade(_t: string, m: Row, selfAlreadyRemoved = false) {
    db.lessons = db.lessons.filter((l) => l.module_id !== m.id)
    if (!selfAlreadyRemoved) db.modules = db.modules.filter((x) => x.id !== m.id)
  }
}
// `order` precisa ser método com a assinatura do supabase-js
;(Query.prototype as any).order = function (this: Query, c: string, o?: { ascending?: boolean }) { return this.order_(c, o?.ascending !== false) }

const rpcs: Record<string, (a: Row) => any> = {
  public_curriculum: ({ p_slug }) => {
    const p = db.products.find((x) => x.slug === p_slug && x.publicado); if (!p) return []
    return db.modules.filter((m) => m.product_id === p.id).sort((a, b) => a.ordem - b.ordem).map((m) => ({
      titulo: m.titulo, aulas: db.lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.ordem - b.ordem).map((l) => l.titulo),
    }))
  },
  validate_coupon: ({ p_product, p_codigo }) => db.coupons.find((c) => c.product_id === p_product && c.codigo.toLowerCase() === String(p_codigo).toLowerCase() && c.ativo)?.percentual ?? 0,
  affiliate_catalog: () => db.products.filter((p) => p.publicado && p.comissao_afiliado_pct > 0 && p.produtor_id !== me),
  affiliate_stats: () => db.affiliate_links.filter((l) => l.user_id === me).map((l) => {
    const orders = db.orders.filter((o) => o.affiliate_link_id === l.id && o.status === 'pago')
    const cs = db.commissions.filter((c) => orders.some((o) => o.id === c.order_id))
    const p = db.products.find((x) => x.id === l.product_id)
    return { codigo: l.codigo, product_id: l.product_id, titulo: p?.titulo, slug: p?.slug, vendas: orders.length, comissao_centavos: cs.reduce((n, c) => n + c.valor_centavos, 0), pendente_centavos: cs.filter((c) => c.status === 'pendente').reduce((n, c) => n + c.valor_centavos, 0) }
  }),
  // somente demonstração: simula a aprovação do pagamento pelo gateway
  demo_pay_order: ({ p_order }) => { const o = db.orders.find((x) => x.id === p_order && x.comprador_id === me); if (o) settle(o) },
  create_order: ({ p_product, p_cupom, p_ref, p_metodo = 'pix', p_parcelas = 1, p_bump = false }) => {
    const p = db.products.find((x) => x.id === p_product && x.publicado); if (!p) throw new Error('produto indisponível')
    if (db.enrollments.some((e) => e.user_id === me && e.product_id === p.id)) throw new Error('você já tem acesso a este produto')
    if (p_parcelas < 1 || p_parcelas > p.parcelas_max || (p_metodo !== 'cartao' && p_parcelas !== 1)) throw new Error('parcelamento inválido')
    let valor = p.preco_centavos; let cup: Row | undefined
    if (p_cupom) { cup = db.coupons.find((c) => c.product_id === p.id && c.codigo.toLowerCase() === p_cupom.toLowerCase() && c.ativo); if (!cup) throw new Error('cupom inválido'); valor -= Math.floor((valor * cup.percentual) / 100); cup.usos++ }
    const bump = p_bump && p.bump_preco_centavos != null ? p.bump_preco_centavos : 0
    const aff = p_ref ? db.affiliate_links.find((l) => l.codigo === p_ref && l.product_id === p.id && l.user_id !== me) : undefined
    const u = users.find((x) => x.id === me)!
    const o = { id: uid(), product_id: p.id, comprador_id: me, comprador_nome: u.nome, comprador_email: u.email, affiliate_link_id: aff?.id ?? null, coupon_id: cup?.id ?? null, valor_centavos: valor + bump, status: 'pendente', metodo: p_metodo, parcelas: p_parcelas, bump_aceito: bump > 0, bump_valor_centavos: bump, created_at: now(), paid_at: null, reembolsado_em: null }
    db.orders.unshift(o); if (valor + bump === 0) settle(o); return o.id
  },
  become_producer: () => { const pr = db.profiles.find((x) => x.id === me); if (pr && pr.role === 'aluno') pr.role = 'produtor' },
  refund_order: ({ p_order }) => {
    const o = db.orders.find((x) => x.id === p_order); if (!o || !ownsProduct(o.product_id)) throw new Error('sem permissão')
    if (o.status !== 'pago') throw new Error('só pedidos pagos podem ser reembolsados')
    o.status = 'reembolsado'; o.reembolsado_em = now()
    db.commissions = db.commissions.filter((c) => c.order_id !== o.id)
    db.enrollments = db.enrollments.filter((e) => !(e.user_id === o.comprador_id && e.product_id === o.product_id))
  },
  producer_balance: () => {
    const mine = db.orders.filter((o) => o.status === 'pago' && db.products.find((p) => p.id === o.product_id)?.produtor_id === me)
    let disponivel = 0, aLiberar = 0
    for (const o of mine) {
      const g = db.products.find((p) => p.id === o.product_id)!.garantia_dias
      const liquido = Math.floor(o.valor_centavos * 0.901) - (db.commissions.find((c) => c.order_id === o.id)?.valor_centavos ?? 0)
      if (new Date(o.paid_at).getTime() <= Date.now() - g * 86400000) disponivel += liquido; else aLiberar += liquido
    }
    const sacado = db.withdrawals.filter((w) => w.user_id === me).reduce((n, w) => n + w.valor_centavos, 0)
    return { disponivel: disponivel - sacado, a_liberar: aLiberar, sacado }
  },
  request_withdrawal: ({ p_valor }) => {
    if (db.profiles.find((x) => x.id === me)?.role === 'aluno') throw new Error('sem permissão')
    if (p_valor < 5000) throw new Error('o saque mínimo é R$ 50,00')
    if (p_valor > rpcs.producer_balance({}).disponivel) throw new Error('saldo disponível insuficiente')
    const w = { id: uid(), user_id: me, valor_centavos: p_valor, status: 'solicitado', created_at: now() }; db.withdrawals.unshift(w); return w.id
  },
  product_students: ({ p_product }) => {
    if (!ownsProduct(p_product)) throw new Error('sem permissão')
    const aulas = db.lessons.filter((l) => db.modules.find((m) => m.id === l.module_id)?.product_id === p_product)
    return db.enrollments.filter((e) => e.product_id === p_product).map((e) => {
      const u = users.find((x) => x.id === e.user_id)!
      const feitas = aulas.filter((l) => db.lesson_progress.some((lp) => lp.user_id === e.user_id && lp.lesson_id === l.id)).length
      return { user_id: e.user_id, nome: u.nome, email: u.email, matriculado_em: e.created_at, progresso_pct: aulas.length ? Math.floor((feitas * 100) / aulas.length) : 0 }
    }).sort((a, b) => (a.matriculado_em < b.matriculado_em ? 1 : -1))
  },
  my_affiliates: () => db.affiliate_links.filter((l) => ownsProduct(l.product_id)).map((l) => {
    const orders = db.orders.filter((o) => o.affiliate_link_id === l.id && o.status === 'pago')
    const cs = db.commissions.filter((c) => orders.some((o) => o.id === c.order_id))
    return { afiliado_id: l.user_id, nome: users.find((u) => u.id === l.user_id)?.nome, product_id: l.product_id, titulo: db.products.find((p) => p.id === l.product_id)?.titulo, codigo: l.codigo, vendas: orders.length, comissao_centavos: cs.reduce((n, c) => n + c.valor_centavos, 0), pendente_centavos: cs.filter((c) => c.status === 'pendente').reduce((n, c) => n + c.valor_centavos, 0) }
  }),
  confirm_order: ({ p_order }) => { const o = db.orders.find((x) => x.id === p_order); if (!o || !ownsProduct(o.product_id)) throw new Error('sem permissão'); settle(o) },
  cancel_order: ({ p_order }) => { const o = db.orders.find((x) => x.id === p_order); if (!o || !ownsProduct(o.product_id)) throw new Error('sem permissão'); if (o.status === 'pendente') o.status = 'cancelado' },
  enroll_by_email: ({ p_product, p_email }) => {
    if (!ownsProduct(p_product)) throw new Error('sem permissão')
    const u = users.find((x) => x.email.toLowerCase() === String(p_email).toLowerCase()); if (!u) return false
    if (!db.enrollments.some((e) => e.user_id === u.id && e.product_id === p_product)) db.enrollments.push({ user_id: u.id, product_id: p_product, created_at: now() })
    return true
  },
  issue_certificate: ({ p_product }) => {
    const lessons = db.lessons.filter((l) => db.modules.find((m) => m.id === l.module_id)?.product_id === p_product)
    if (!lessons.length || !lessons.every((l) => db.lesson_progress.some((p) => p.user_id === me && p.lesson_id === l.id))) throw new Error('conclua todas as aulas para emitir o certificado')
    const pendentes = db.activities.some((a) => a.obrigatoria && productOfActivity(a.id) === p_product && !db.activity_submissions.some((s) => s.activity_id === a.id && s.user_id === me && s.aprovado))
    if (pendentes) throw new Error('conclua com aprovação as atividades obrigatórias para emitir o certificado')
    let c = db.certificates.find((x) => x.user_id === me && x.product_id === p_product)
    if (!c) { c = { codigo: uid().slice(0, 16).replace(/-/g, ''), user_id: me, product_id: p_product, nome_aluno: db.profiles.find((p) => p.id === me)?.nome, titulo_curso: db.products.find((p) => p.id === p_product)?.titulo, emitido_em: now() }; db.certificates.push(c) }
    return c.codigo
  },
  activity_for_student: ({ p_activity }) => {
    const a = db.activities.find((x) => x.id === p_activity)
    if (!a || !hasAccess(productOfActivity(p_activity))) throw new Error('sem acesso')
    return {
      id: a.id, titulo: a.titulo, descricao: a.descricao, nota_minima: a.nota_minima, obrigatoria: a.obrigatoria, tentativas_max: a.tentativas_max,
      tentativas_usadas: db.activity_submissions.filter((x) => x.activity_id === a.id && x.user_id === me).length,
      perguntas: db.activity_questions.filter((q) => q.activity_id === a.id).sort((x, y) => x.ordem - y.ordem).map((q) => ({ id: q.id, tipo: q.tipo, enunciado: q.enunciado, opcoes: q.opcoes, pontos: q.pontos })),
    }
  },
  submit_activity: ({ p_activity, p_respostas }) => {
    const a = db.activities.find((x) => x.id === p_activity)
    if (!me || !a || !hasAccess(productOfActivity(p_activity))) throw new Error('sem acesso')
    const usadas = db.activity_submissions.filter((x) => x.activity_id === a.id && x.user_id === me).length
    if (a.tentativas_max != null && usadas >= a.tentativas_max) throw new Error('você já usou todas as tentativas desta atividade')
    let total = 0, auto = 0, temTexto = false; const detalhes: Row[] = []
    for (const q of db.activity_questions.filter((x) => x.activity_id === a.id).sort((x, y) => x.ordem - y.ordem)) {
      total += q.pontos
      if (q.tipo === 'texto') { temTexto = true; detalhes.push({ pergunta_id: q.id, correta: null, explicacao: q.explicacao }); continue }
      const ok = conjunto(p_respostas?.[q.id]) === conjunto(q.correta)
      if (ok) auto += q.pontos
      detalhes.push({ pergunta_id: q.id, correta: ok, esperado: q.correta, explicacao: q.explicacao })
    }
    if (total === 0) throw new Error('esta atividade ainda não tem perguntas')
    const status = temTexto ? 'pendente' : 'corrigida'
    const nota = temTexto ? null : Math.round((auto * 100) / total)
    const aprovado = temTexto ? null : (nota as number) >= a.nota_minima
    const s = { id: uid(), activity_id: a.id, user_id: me, respostas: p_respostas, pontos_auto: auto, pontos_manual: null, pontos_total: total, status, nota, aprovado, feedback: null, tentativa: usadas + 1, created_at: now(), corrigida_em: temTexto ? null : now() }
    db.activity_submissions.push(s)
    return { submission_id: s.id, status, nota, aprovado, tentativa: usadas + 1, detalhes }
  },
  grade_submission: ({ p_submission, p_pontos, p_feedback }) => {
    const s = db.activity_submissions.find((x) => x.id === p_submission)
    if (!s || !ownsProduct(productOfActivity(s.activity_id))) throw new Error('sem permissão')
    const a = db.activities.find((x) => x.id === s.activity_id)!
    const max = db.activity_questions.filter((q) => q.activity_id === a.id && q.tipo === 'texto').reduce((n, q) => n + q.pontos, 0)
    if (p_pontos < 0 || p_pontos > max) throw new Error(`os pontos devem ficar entre 0 e ${max}`)
    const nota = Math.round(((s.pontos_auto + p_pontos) * 100) / s.pontos_total)
    Object.assign(s, { pontos_manual: p_pontos, nota, aprovado: nota >= a.nota_minima, feedback: p_feedback || null, status: 'corrigida', corrigida_em: now() })
  },
  activity_submissions_owner: ({ p_product }) => {
    if (!ownsProduct(p_product)) throw new Error('sem permissão')
    return db.activity_submissions.filter((s) => productOfActivity(s.activity_id) === p_product).map((s): Row => {
      const u = users.find((x) => x.id === s.user_id)
      return { ...s, atividade: db.activities.find((a) => a.id === s.activity_id)?.titulo, nome: u?.nome, email: u?.email }
    }).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  },
  verify_certificate: ({ p_codigo }) => { const c = db.certificates.find((x) => x.codigo === p_codigo); return c ? { codigo: c.codigo, nome_aluno: c.nome_aluno, titulo_curso: c.titulo_curso, emitido_em: c.emitido_em } : null },
}

/** Remove o que dependia de linhas apagadas (equivale ao ON DELETE CASCADE do banco). */
function limparOrfaos() {
  db.activities = db.activities.filter((a) => db.lessons.some((l) => l.id === a.lesson_id))
  db.activity_questions = db.activity_questions.filter((q) => db.activities.some((a) => a.id === q.activity_id))
  db.activity_submissions = db.activity_submissions.filter((x) => db.activities.some((a) => a.id === x.activity_id))
  db.comments = db.comments.filter((c) => db.lessons.some((l) => l.id === c.lesson_id))
}

const conjunto = (v: unknown) => (Array.isArray(v) ? [...v].map(String).sort().join('|') : '')

function settle(o: Row) {
  if (o.status === 'pago') return
  o.status = 'pago'; o.paid_at = now()
  if (!db.enrollments.some((e) => e.user_id === o.comprador_id && e.product_id === o.product_id)) db.enrollments.push({ user_id: o.comprador_id, product_id: o.product_id, created_at: now() })
  const link = db.affiliate_links.find((l) => l.id === o.affiliate_link_id); const p = db.products.find((x) => x.id === o.product_id)
  if (link && p && p.comissao_afiliado_pct > 0 && o.valor_centavos > 0) db.commissions.push({ id: uid(), order_id: o.id, afiliado_id: link.user_id, valor_centavos: Math.floor((o.valor_centavos * p.comissao_afiliado_pct) / 100), status: 'pendente' })
}

export function createDemoClient() {
  return {
    from: (t: string) => new Query(t),
    rpc: (name: string, args: Row = {}) => new Promise<Result>((res) => setTimeout(() => {
      try { res({ data: rpcs[name](args), error: null }) } catch (e: any) { res({ data: null, error: { message: e.message } }) }
    }, 120)),
    auth: {
      getSession: async () => ({ data: { session: sessionOf(me) } }),
      onAuthStateChange: (cb: Listener) => { listeners.add(cb); return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } } },
      signInWithPassword: async ({ email, password }: Row) => {
        const u = users.find((x) => x.email.toLowerCase() === String(email).toLowerCase() && x.password === password)
        if (!u) return { error: { message: 'E-mail ou senha incorretos.' } }
        me = u.id; notify(); return { error: null }
      },
      signUp: async ({ email, password, options }: Row) => {
        if (users.some((x) => x.email.toLowerCase() === String(email).toLowerCase())) return { error: { message: 'Este e-mail já está cadastrado.' } }
        const id = uid(); users.push({ id, email, password, nome: options?.data?.nome, role: 'aluno' })
        db.profiles.push({ id, nome: options?.data?.nome ?? email.split('@')[0], role: 'aluno' }); me = id; notify(); return { error: null }
      },
      updateUser: async ({ password }: Row) => { const u = users.find((x) => x.id === me); if (u && password) u.password = password; return { error: null } },
      signOut: async () => { me = null; notify() },
    },
    storage: {
      from: () => ({
        upload: async (path: string, file: File) => { blobs[path] = URL.createObjectURL(file); return { error: null } },
        getPublicUrl: (path: string) => ({ data: { publicUrl: blobs[path] ?? '' } }),
        createSignedUrl: async () => ({ data: { signedUrl: VIDEO } }),
      }),
    },
  }
}

// atividades de exemplo (quiz com correção automática e uma reflexão com pergunta aberta)
;(function seedAtividades() {
  const op = (...t: string[]) => t.map((texto, i) => ({ id: String.fromCharCode(97 + i), texto }))
  db.activities.push(
    { id: 'at1', lesson_id: 'l1', titulo: 'Quiz: escolhendo o problema certo', descricao: 'Confira se você pegou os conceitos da aula. Precisa de 70% para ser aprovado.', nota_minima: 70, obrigatoria: true, tentativas_max: 3, ordem: 0, created_at: now() },
    { id: 'at2', lesson_id: 'l2', titulo: 'Reflexão: sua validação', descricao: 'Aplique o método ao seu negócio e conte o que descobriu.', nota_minima: 60, obrigatoria: false, tentativas_max: null, ordem: 0, created_at: now() },
  )
  db.activity_questions.push(
    { id: 'qa1', activity_id: 'at1', tipo: 'unica', enunciado: 'Qual é o melhor critério para escolher um problema a resolver?', opcoes: op('O que eu acho mais interessante', 'O que as pessoas já pagam para resolver', 'O que os concorrentes ignoram', 'O que exige menos esforço'), correta: ['b'], explicacao: 'Dinheiro já circulando indica dor real e disposição de pagar.', pontos: 1, ordem: 0 },
    { id: 'qa2', activity_id: 'at1', tipo: 'multipla', enunciado: 'Marque todas as formas de validar uma ideia sem gastar dinheiro:', opcoes: op('Conversar com potenciais clientes', 'Montar uma loja completa antes de vender', 'Pré-vender com uma página simples', 'Contratar uma agência'), correta: ['a', 'c'], explicacao: 'Validar é aprender antes de investir: conversas e pré-venda custam quase nada.', pontos: 1, ordem: 1 },
    { id: 'qa3', activity_id: 'at1', tipo: 'vf', enunciado: 'É possível vender antes de o produto estar pronto.', opcoes: [{ id: 'v', texto: 'Verdadeiro' }, { id: 'f', texto: 'Falso' }], correta: ['v'], explicacao: 'A pré-venda prova demanda e financia o desenvolvimento.', pontos: 1, ordem: 2 },
    { id: 'qb1', activity_id: 'at2', tipo: 'unica', enunciado: 'Você já conversou com clientes em potencial?', opcoes: op('Sim', 'Ainda não'), correta: ['a'], explicacao: null, pontos: 2, ordem: 0 },
    { id: 'qb2', activity_id: 'at2', tipo: 'texto', enunciado: 'Descreva o que você descobriu ao conversar com pelo menos 3 pessoas. O que mais te surpreendeu?', opcoes: [], correta: [], explicacao: 'Procure padrões: o que se repetiu nas conversas?', pontos: 8, ordem: 1 },
  )
  const alunos = db.enrollments.filter((e) => e.product_id === 'p1' && e.user_id.startsWith('b')).map((e) => e.user_id)
  const envio = (activity_id: string, user_id: string, respostas: Row, extra: Row) => db.activity_submissions.push({ id: uid(), activity_id, user_id, respostas, pontos_auto: 0, pontos_manual: null, pontos_total: 3, status: 'corrigida', nota: null, aprovado: null, feedback: null, tentativa: 1, created_at: now(), corrigida_em: now(), ...extra })
  if (alunos[0]) envio('at1', alunos[0], { qa1: ['b'], qa2: ['a', 'c'], qa3: ['v'] }, { pontos_auto: 3, nota: 100, aprovado: true })
  if (alunos[1]) envio('at1', alunos[1], { qa1: ['a'], qa2: ['a'], qa3: ['v'] }, { pontos_auto: 1, nota: 33, aprovado: false })
  if (alunos[2]) envio('at1', alunos[2], { qa1: ['b'], qa2: ['a', 'c'], qa3: ['f'] }, { pontos_auto: 2, nota: 67, aprovado: false })
  const reflexao = (uid_: string, texto: string) => envio('at2', uid_, { qb1: ['a'], qb2: texto }, { pontos_auto: 2, pontos_total: 10, status: 'pendente', corrigida_em: null })
  if (alunos[0]) reflexao(alunos[0], 'Conversei com 5 donos de pequenas lojas. O que mais me surpreendeu foi que todos reclamavam do mesmo problema: perder tempo conferindo estoque na planilha. Nenhum usava um sistema pago.')
  if (alunos[3]) reflexao(alunos[3], 'Falei com 3 pessoas e percebi que o preço importa menos do que a rapidez no atendimento.')
})()

