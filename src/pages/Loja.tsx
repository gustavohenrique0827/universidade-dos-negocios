import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LinkBotao } from '../components/Botao'
import Capa from '../components/Capa'
import CartaoCurso, { Preco } from '../components/CartaoCurso'
import { EsqueletoGrade } from '../components/Esqueleto'
import Icon from '../components/Icon'
import { Vazio } from '../components/Ui'
import { supabase } from '../lib/supabase'
import { useTitulo } from '../lib/titulo'
import { campo } from '../lib/util'

type Produto = {
  id: string
  titulo: string
  slug: string
  descricao: string | null
  capa_url: string | null
  preco_centavos: number
  categoria: string | null
  parcelas_max: number
  created_at: string
}
type Ordem = 'recentes' | 'menor' | 'maior' | 'az'

const ORDENS: [Ordem, string][] = [
  ['recentes', 'Mais recentes'],
  ['menor', 'Menor preço'],
  ['maior', 'Maior preço'],
  ['az', 'Nome (A–Z)'],
]

const BENEFICIOS: { icone: 'cadeado' | 'infinito' | 'diploma'; titulo: string; texto: string; destaque?: string }[] = [
  {
    icone: 'cadeado',
    titulo: 'Pagamento Seguro & Flexível',
    texto: 'Pix imediato com liberação em segundos, cartão em até 12x ou boleto bancário protegido.',
    destaque: 'Segurança bancária'
  },
  {
    icone: 'infinito',
    titulo: 'Acesso Vitalício & Multiplataforma',
    texto: 'Assista no seu tempo pelo computador, tablet ou celular. Conteúdo atualizado constantemente.',
    destaque: 'No seu ritmo'
  },
  {
    icone: 'diploma',
    titulo: 'Certificado Autêntico',
    texto: 'Conclua as aulas e emita seu certificado digital verificável publicamente para comprovar sua qualificação.',
    destaque: 'Comprovação real'
  },
]

export default function Loja() {
  useTitulo('Cursos e Formações')
  const [itens, setItens] = useState<Produto[] | null>(null)
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [gratis, setGratis] = useState(false)
  const catalogo = useRef<HTMLElement>(null)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, titulo, slug, descricao, capa_url, preco_centavos, categoria, parcelas_max, created_at')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setItens((data ?? []) as Produto[]))
  }, [])

  const categorias = useMemo(() => {
    const n = new Map<string, number>()
    for (const p of itens ?? []) if (p.categoria) n.set(p.categoria, (n.get(p.categoria) ?? 0) + 1)
    return [...n.entries()].sort((a, b) => b[1] - a[1])
  }, [itens])

  const destaque = useMemo(
    () => (itens ?? []).find((p) => p.preco_centavos > 0 && p.capa_url) ?? (itens ?? []).find((p) => p.preco_centavos > 0) ?? (itens ?? [])[0],
    [itens]
  )

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const r = (itens ?? []).filter(
      (p) =>
        (!q || `${p.titulo} ${p.descricao ?? ''} ${p.categoria ?? ''}`.toLowerCase().includes(q)) &&
        (!cat || p.categoria === cat) &&
        (!gratis || p.preco_centavos === 0)
    )
    const cmp: Record<Ordem, (a: Produto, b: Produto) => number> = {
      recentes: (a, b) => (a.created_at < b.created_at ? 1 : -1),
      menor: (a, b) => a.preco_centavos - b.preco_centavos,
      maior: (a, b) => b.preco_centavos - a.preco_centavos,
      az: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
    }
    return [...r].sort(cmp[ordem])
  }, [itens, busca, cat, gratis, ordem])

  const filtrando = !!(busca || cat || gratis)
  const limpar = () => {
    setBusca('')
    setCat('')
    setGratis(false)
  }
  const irParaCatalogo = () => catalogo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const chip = (ativo: boolean) =>
    `rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
      ativo
        ? 'border-brand bg-gradient-to-r from-brand to-brand-dark text-on-brand shadow-md shadow-brand/25'
        : 'border-line/80 bg-surface/80 text-muted hover:border-brand/40 hover:bg-wash hover:text-ink'
    }`

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line/70 pb-16 pt-10 sm:pb-24 sm:pt-16">
        <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 size-[36rem] rounded-full bg-brand/5 blur-[120px]" />
        <svg
          aria-hidden
          viewBox="0 0 800 300"
          className="pointer-events-none absolute -bottom-6 left-1/2 w-[1100px] max-w-none -translate-x-1/2 opacity-30"
        >
          <path d="M0 290 C 200 290, 260 40, 400 40 S 600 290, 800 290" fill="none" className="stroke-line" strokeWidth="2" />
        </svg>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand backdrop-blur-md">
              <span className="size-2 rounded-full bg-brand animate-pulse-subtle" />
              Educação para quem constrói o futuro
            </div>

            <h1 className="mt-5 text-4xl leading-[1.05] tracking-tight sm:text-6xl text-ink">
              Negócios fora da curva se aprendem com{' '}
              <span className="text-gradient-brand">quem já construiu.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-muted sm:text-lg leading-relaxed">
              Metodologias práticas e estratégias validadas por empreendedores reais. Sem teorias vazias: aprenda, aplique e escale seu negócio.
            </p>

            {/* Modern Search bar */}
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                irParaCatalogo()
              }}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-line/90 bg-surface/90 p-2 shadow-2xl shadow-black/30 backdrop-blur-md focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15 transition-all"
            >
              <label className="relative flex-1">
                <span className="sr-only">Buscar curso</span>
                <Icon nome="busca" tamanho={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="O que você quer construir hoje?"
                  className="w-full bg-transparent py-2.5 pl-11 pr-3 text-sm text-ink outline-none placeholder:text-muted/60"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-bold text-on-brand shadow-md shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                Buscar
              </button>
            </form>

            {/* Quick Metrics */}
            {itens && itens.length > 0 && (
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-line/60 pt-6">
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-ink">{itens.length}</div>
                  <div className="mt-0.5 text-xs text-muted font-medium">Cursos ativos</div>
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-ink">{categorias.length}</div>
                  <div className="mt-0.5 text-xs text-muted font-medium">Categorias</div>
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-brand">100%</div>
                  <div className="mt-0.5 text-xs text-muted font-medium">Prático & direto</div>
                </div>
              </div>
            )}
          </div>

          {/* Featured Course Card */}
          {destaque && (
            <div className="relative">
              <div aria-hidden className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand/30 to-purple-600/30 blur-xl opacity-60" />
              <Link
                to={`/p/${destaque.slug}`}
                className="group relative block overflow-hidden rounded-3xl border border-brand/40 bg-surface/90 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-brand hover:-translate-y-1"
              >
                <div className="relative">
                  <span className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-brand/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-on-brand shadow-lg backdrop-blur-md">
                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                    Destaque da Plataforma
                  </span>
                  <Capa url={destaque.capa_url} titulo={destaque.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
                </div>

                <div className="p-6 sm:p-7">
                  {destaque.categoria && (
                    <p className="font-mono text-xs uppercase tracking-widest text-brand font-semibold">
                      {destaque.categoria}
                    </p>
                  )}
                  <h2 className="mt-1.5 text-2xl font-bold leading-snug text-ink sm:text-3xl group-hover:text-brand transition-colors">
                    {destaque.titulo}
                  </h2>
                  <p className="mt-2.5 line-clamp-2 text-sm text-muted leading-relaxed">
                    {destaque.descricao}
                  </p>

                  <div className="mt-6 flex items-end justify-between gap-4 border-t border-line/60 pt-4">
                    <Preco p={destaque} grande />
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-bold text-on-brand shadow-lg shadow-brand/25 transition-all group-hover:shadow-brand/40 group-hover:scale-105">
                      Ver detalhes <Icon nome="avancar" tamanho={16} />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section ref={catalogo} id="cursos" aria-label="Catálogo de cursos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line/60 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-ink">Catálogo de Cursos</h2>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {itens === null ? 'Carregando cursos…' : `${lista.length} ${lista.length === 1 ? 'curso disponível' : 'cursos disponíveis'}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Ordenar por
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className={`${campo} !py-1.5 !px-3 font-normal capitalize text-ink`}
              >
                {ORDENS.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filtros">
          <button onClick={() => setCat('')} aria-pressed={!cat} className={chip(!cat)}>
            Todos
          </button>
          {categorias.map(([c, n]) => (
            <button key={c} onClick={() => setCat(cat === c ? '' : c)} aria-pressed={cat === c} className={chip(cat === c)}>
              {c} <span className="ml-1.5 font-mono text-[11px] opacity-75">({n})</span>
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-line/80 sm:block" aria-hidden />
          <button onClick={() => setGratis(!gratis)} aria-pressed={gratis} className={chip(gratis)}>
            Gratuitos
          </button>
          {filtrando && (
            <button
              onClick={limpar}
              className="ml-2 text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Course Cards Grid */}
        <div className="mt-8">
          {itens === null ? (
            <EsqueletoGrade n={6} />
          ) : lista.length === 0 ? (
            <Vazio
              titulo={filtrando ? 'Nenhum curso encontrado' : 'Os primeiros cursos chegam em breve'}
              texto={
                filtrando
                  ? 'Nenhum curso combina com esses filtros. Tente outra palavra-chave ou limpe os filtros para ver tudo.'
                  : 'Ainda não há cursos publicados nesta categoria. Volte em breve ou publique o seu conteúdo.'
              }
              acao={
                filtrando ? (
                  <button
                    onClick={limpar}
                    className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-bold text-on-brand shadow-lg shadow-brand/20 hover:shadow-brand/35 transition-all"
                  >
                    Limpar filtros
                  </button>
                ) : (
                  <LinkBotao para="/painel/produtos">Publicar um curso</LinkBotao>
                )
              }
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((p) => (
                <li key={p.id}>
                  <CartaoCurso p={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Bento-grid Benefits Section */}
      <section aria-label="Por que a Universidade dos Negócios" className="border-y border-line/70 bg-surface/50 py-16 sm:py-20 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand">Padrão de Excelência</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-ink">Criado para acelerar sua jornada</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div
                key={b.titulo}
                className="group relative overflow-hidden rounded-2xl border border-line/80 bg-surface/90 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-brand/40 hover:-translate-y-1"
              >
                <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-brand/5 blur-2xl group-hover:bg-brand/15 transition-all" />
                <div className="flex items-center justify-between mb-5">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-brand border border-brand/20 shadow-inner">
                    <Icon nome={b.icone} tamanho={22} />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted bg-wash/60 px-2.5 py-1 rounded-full border border-line/60">
                    {b.destaque}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors">{b.titulo}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{b.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Producer Call-to-action Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand/40 bg-gradient-to-br from-surface via-surface to-brand/10 p-8 shadow-2xl sm:p-14">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 border border-brand/30 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand font-bold">
                Para Criadores & Produtores
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-5xl tracking-tight leading-[1.08]">
                Tem conhecimento que gera resultado?
              </h2>
              <p className="mt-4 text-muted sm:text-lg leading-relaxed">
                Publique seu treinamento, conte com checkout de alta conversão por Pix, cartão e boleto, e recrute afiliados para escalar suas vendas.
              </p>
            </div>
            <LinkBotao para="/painel" tamanho="g" className="shadow-xl shadow-brand/30">
              Quero vender na plataforma
            </LinkBotao>
          </div>
        </div>
      </section>
    </main>
  )
}
