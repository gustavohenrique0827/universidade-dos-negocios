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
  id: string; titulo: string; slug: string; descricao: string | null; capa_url: string | null
  preco_centavos: number; categoria: string | null; parcelas_max: number; created_at: string
}
type Ordem = 'recentes' | 'menor' | 'maior' | 'az'

const ORDENS: [Ordem, string][] = [['recentes', 'Mais recentes'], ['menor', 'Menor preço'], ['maior', 'Maior preço'], ['az', 'Nome (A–Z)']]

const BENEFICIOS: { icone: 'cadeado' | 'infinito' | 'diploma'; titulo: string; texto: string }[] = [
  { icone: 'cadeado', titulo: 'Pague como preferir', texto: 'Pix, cartão em até 12x ou boleto, com compra segura.' },
  { icone: 'infinito', titulo: 'Estude no seu ritmo', texto: 'Acesso vitalício às aulas, no computador ou no celular.' },
  { icone: 'diploma', titulo: 'Certificado de conclusão', texto: 'Ao terminar o curso, você emite o seu certificado.' },
]

export default function Loja() {
  useTitulo('Cursos')
  const [itens, setItens] = useState<Produto[] | null>(null)
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [gratis, setGratis] = useState(false)
  const catalogo = useRef<HTMLElement>(null)

  useEffect(() => {
    supabase.from('products').select('id, titulo, slug, descricao, capa_url, preco_centavos, categoria, parcelas_max, created_at').eq('publicado', true).order('created_at', { ascending: false })
      .then(({ data }) => setItens((data ?? []) as Produto[]))
  }, [])

  const categorias = useMemo(() => {
    const n = new Map<string, number>()
    for (const p of itens ?? []) if (p.categoria) n.set(p.categoria, (n.get(p.categoria) ?? 0) + 1)
    return [...n.entries()].sort((a, b) => b[1] - a[1])
  }, [itens])

  const destaque = useMemo(() => (itens ?? []).find((p) => p.preco_centavos > 0 && p.capa_url) ?? (itens ?? []).find((p) => p.preco_centavos > 0) ?? (itens ?? [])[0], [itens])

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const r = (itens ?? []).filter((p) => (!q || `${p.titulo} ${p.descricao ?? ''} ${p.categoria ?? ''}`.toLowerCase().includes(q)) && (!cat || p.categoria === cat) && (!gratis || p.preco_centavos === 0))
    const cmp: Record<Ordem, (a: Produto, b: Produto) => number> = {
      recentes: (a, b) => (a.created_at < b.created_at ? 1 : -1), menor: (a, b) => a.preco_centavos - b.preco_centavos,
      maior: (a, b) => b.preco_centavos - a.preco_centavos, az: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
    }
    return [...r].sort(cmp[ordem])
  }, [itens, busca, cat, gratis, ordem])

  const filtrando = !!(busca || cat || gratis)
  const limpar = () => { setBusca(''); setCat(''); setGratis(false) }
  const irParaCatalogo = () => catalogo.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const chip = (ativo: boolean) => `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${ativo ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-muted hover:border-brand hover:text-ink'}`

  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-brand/10 blur-3xl" />
        <svg aria-hidden viewBox="0 0 800 300" className="pointer-events-none absolute -bottom-6 left-1/2 w-[1100px] max-w-none -translate-x-1/2 opacity-60"><path d="M0 290 C 200 290, 260 40, 400 40 S 600 290, 800 290" fill="none" className="stroke-line" strokeWidth="2" /></svg>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brand">Cursos e infoprodutos</p>
            <h1 className="mt-4 text-4xl leading-[1.04] sm:text-6xl">Negócios fora da curva se aprendem com quem já saiu dela.</h1>
            <p className="mt-5 max-w-lg text-lg text-muted">Aulas práticas de empreendedores que constroem, vendem e escalam. Escolha um curso e comece hoje.</p>
            <form role="search" onSubmit={(e) => { e.preventDefault(); irParaCatalogo() }} className="mt-8 flex max-w-xl gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lg shadow-black/10 focus-within:border-brand">
              <label className="relative flex-1"><span className="sr-only">Buscar curso</span>
                <Icon nome="busca" tamanho={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="O que você quer aprender?" className="w-full bg-transparent py-3 pl-10 pr-3 outline-none placeholder:text-muted/70" /></label>
              <button className="rounded-xl bg-brand px-6 font-semibold text-on-brand hover:bg-brand-dark">Buscar</button>
            </form>
            {itens && itens.length > 0 && (
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
                <div><dt className="text-muted">Cursos disponíveis</dt><dd className="font-mono text-2xl font-medium">{itens.length}</dd></div>
                <div><dt className="text-muted">Categorias</dt><dd className="font-mono text-2xl font-medium">{categorias.length}</dd></div>
                <div><dt className="text-muted">Para começar</dt><dd className="font-mono text-2xl font-medium">{itens.filter((p) => p.preco_centavos === 0).length} grátis</dd></div>
              </dl>
            )}
          </div>

          {destaque && (
            <Link to={`/p/${destaque.slug}`} className="group relative block overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/20 transition hover:border-brand">
              <span className="absolute left-4 top-4 z-10 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-brand">Em destaque</span>
              <Capa url={destaque.capa_url} titulo={destaque.titulo} className="transition duration-300 group-hover:scale-[1.02]" />
              <div className="p-6">
                {destaque.categoria && <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{destaque.categoria}</p>}
                <h2 className="mt-1 text-2xl leading-snug">{destaque.titulo}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{destaque.descricao}</p>
                <div className="mt-5 flex items-end justify-between gap-3"><Preco p={destaque} grande /><span className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand">Ver curso <Icon nome="avancar" tamanho={15} /></span></div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section ref={catalogo} id="cursos" aria-label="Catálogo de cursos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-3xl">Todos os cursos</h2><p className="mt-1 text-sm text-muted" aria-live="polite">{itens === null ? 'Carregando cursos…' : `${lista.length} ${lista.length === 1 ? 'curso encontrado' : 'cursos encontrados'}`}</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">Ordenar por
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className={`${campo} !w-auto py-2 text-ink`}>{ORDENS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtros">
          <button onClick={() => setCat('')} aria-pressed={!cat} className={chip(!cat)}>Todos</button>
          {categorias.map(([c, n]) => <button key={c} onClick={() => setCat(cat === c ? '' : c)} aria-pressed={cat === c} className={chip(cat === c)}>{c} <span className="ml-1 font-mono text-xs opacity-70">{n}</span></button>)}
          <span className="mx-1 hidden w-px bg-line sm:block" aria-hidden />
          <button onClick={() => setGratis(!gratis)} aria-pressed={gratis} className={chip(gratis)}>Só gratuitos</button>
          {filtrando && <button onClick={limpar} className="px-2 text-sm font-medium text-brand hover:underline">Limpar filtros</button>}
        </div>

        <div className="mt-8">
          {itens === null ? <EsqueletoGrade n={6} /> : lista.length === 0 ? (
            <Vazio titulo={filtrando ? 'Nenhum curso encontrado' : 'Os primeiros cursos chegam em breve'} texto={filtrando ? 'Nenhum curso combina com esses filtros. Tente outra palavra ou limpe os filtros.' : 'Ainda não há cursos publicados. Volte em breve ou publique o seu.'}
              acao={filtrando ? <button onClick={limpar} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand hover:bg-brand-dark">Limpar filtros</button> : <LinkBotao para="/painel/produtos">Publicar um curso</LinkBotao>} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">{lista.map((p) => <li key={p.id}><CartaoCurso p={p} /></li>)}</ul>
          )}
        </div>
      </section>

      <section aria-label="Vantagens" className="border-y border-line bg-surface">
        <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><Icon nome={b.icone} tamanho={20} /></span>
              <div><h3 className="text-lg">{b.titulo}</h3><p className="mt-1 text-sm text-muted">{b.texto}</p></div></li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 sm:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl"><p className="font-mono text-xs uppercase tracking-widest text-brand">Para produtores</p>
              <h2 className="mt-2 text-3xl sm:text-4xl">Tem conhecimento que gera resultado?</h2>
              <p className="mt-3 text-muted">Publique seu curso, venda por Pix, cartão e boleto e deixe afiliados divulgarem por você. A taxa incide só sobre o que você vender.</p></div>
            <LinkBotao para="/painel" tamanho="g">Quero vender na plataforma</LinkBotao>
          </div>
        </div>
      </section>
    </main>
  )
}
