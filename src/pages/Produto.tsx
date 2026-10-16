import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { LinkBotao } from '../components/Botao'
import Capa from '../components/Capa'
import CartaoCurso, { type CursoCard } from '../components/CartaoCurso'
import { TelaCarregando } from '../components/Esqueleto'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabase'
import { useTitulo } from '../lib/titulo'
import { brl, guardarRef } from '../lib/util'

type Produto = {
  id: string; titulo: string; descricao: string | null; descricao_longa: string | null; capa_url: string | null; categoria: string | null
  preco_centavos: number; garantia_dias: number; parcelas_max: number
}
type Modulo = { titulo: string; aulas: string[] }

const FAQ = [
  ['Como recebo o acesso?', 'Logo após a confirmação do pagamento, o curso aparece em “Meus cursos”, na sua conta.'],
  ['Por quanto tempo tenho acesso?', 'O acesso é vitalício, incluindo as atualizações do conteúdo.'],
  ['Posso assistir pelo celular?', 'Sim. A plataforma funciona em qualquer dispositivo com internet.'],
  ['E se eu não gostar?', 'Você pode pedir o reembolso dentro do prazo de garantia, sem burocracia.'],
]

function Acordeao({ titulo, lateral, aberto, onAlternar, children }: { titulo: ReactNode; lateral?: ReactNode; aberto: boolean; onAlternar: () => void; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <button onClick={onAlternar} aria-expanded={aberto} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold transition hover:bg-wash/60">
        <span className="min-w-0">{titulo}</span>
        <span className="flex shrink-0 items-center gap-3 text-sm font-normal text-muted">{lateral}<Icon nome="baixo" tamanho={16} className={`transition ${aberto ? 'rotate-180' : ''}`} /></span>
      </button>
      {aberto && <div className="border-t border-line">{children}</div>}
    </div>
  )
}

export default function Produto() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const [p, setP] = useState<Produto | null | undefined>(undefined)
  const [curriculo, setCurriculo] = useState<Modulo[]>([])
  const [relacionados, setRelacionados] = useState<CursoCard[]>([])
  const [modulosAbertos, setModulosAbertos] = useState<Set<number>>(new Set([0]))
  const [faqAberta, setFaqAberta] = useState<number | null>(null)

  useEffect(() => {
    const ref = params.get('ref')
    if (ref && slug) guardarRef(slug, ref)
  }, [params, slug])

  useEffect(() => {
    setP(undefined); setModulosAbertos(new Set([0]))
    supabase.from('products').select('id, titulo, descricao, descricao_longa, capa_url, categoria, preco_centavos, garantia_dias, parcelas_max').eq('slug', slug!).eq('publicado', true).maybeSingle().then(({ data }) => setP(data))
    supabase.rpc('public_curriculum', { p_slug: slug }).then(({ data }) => setCurriculo((data ?? []) as Modulo[]))
  }, [slug])

  useEffect(() => {
    if (!p) return
    supabase.from('products').select('id, titulo, slug, descricao, capa_url, preco_centavos, categoria, parcelas_max').eq('publicado', true).then(({ data }) => {
      const outros = ((data ?? []) as CursoCard[]).filter((x) => x.id !== p.id)
      outros.sort((a, b) => Number(b.categoria === p.categoria) - Number(a.categoria === p.categoria))
      setRelacionados(outros.slice(0, 3))
    })
  }, [p])

  useTitulo(p?.titulo)
  const aulas = useMemo(() => curriculo.reduce((n, m) => n + m.aulas.length, 0), [curriculo])
  if (p === undefined) return <TelaCarregando />
  if (p === null) return <p className="p-8 text-muted">Produto não encontrado. <Link to="/loja" className="text-brand">Ver todos os cursos</Link></p>

  const gratis = p.preco_centavos === 0
  const parcela = Math.ceil(p.preco_centavos / p.parcelas_max)
  const todosAbertos = modulosAbertos.size === curriculo.length && curriculo.length > 0
  const alternarModulo = (i: number) => setModulosAbertos((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const migalhas = [{ rotulo: 'Cursos', para: '/loja' }, ...(p.categoria ? [{ rotulo: p.categoria, para: '/loja' }] : []), { rotulo: p.titulo }]
  const acao = gratis ? 'Começar agora' : 'Comprar agora'

  const recebe: { icone: 'play' | 'diploma' | 'grupo' | 'infinito'; titulo: string; texto: string }[] = [
    { icone: 'play', titulo: aulas ? `${aulas} ${aulas === 1 ? 'aula' : 'aulas'} em vídeo` : 'Aulas em vídeo', texto: curriculo.length ? `Organizadas em ${curriculo.length} ${curriculo.length === 1 ? 'módulo' : 'módulos'} para você seguir em ordem.` : 'Conteúdo organizado em módulos.' },
    { icone: 'diploma', titulo: 'Certificado de conclusão', texto: 'Emita o seu certificado ao terminar todas as aulas.' },
    { icone: 'grupo', titulo: 'Comunidade em cada aula', texto: 'Tire dúvidas e troque ideias com outros alunos.' },
    { icone: 'infinito', titulo: 'Acesso vitalício', texto: 'Estude no seu ritmo, no computador ou no celular.' },
  ]

  return (
    <div className="relative overflow-hidden pb-24 lg:pb-0">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-x-12 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-12">
        <div className="min-w-0">
          <div className="max-sm:hidden"><Breadcrumbs itens={migalhas} /></div>
          <Link to="/loja" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink sm:hidden"><Icon nome="voltar" tamanho={14} /> Todos os cursos</Link>
          <h1 className="mt-5 text-4xl leading-[1.05] sm:text-5xl">{p.titulo}</h1>
          {p.descricao && <p className="mt-4 max-w-2xl text-lg text-muted">{p.descricao}</p>}
          <ul className="mt-6 flex flex-wrap gap-2 text-sm">
            {[...(curriculo.length ? [`${curriculo.length} ${curriculo.length === 1 ? 'módulo' : 'módulos'}`, `${aulas} ${aulas === 1 ? 'aula' : 'aulas'}`] : []), 'Acesso vitalício', 'Certificado', ...(p.garantia_dias > 0 ? [`Garantia de ${p.garantia_dias} dias`] : [])].map((t) => (
              <li key={t} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-ink/85">{t}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkBotao para={`/checkout/${slug}`} tamanho="g" className="max-lg:hidden">{acao} <Icon nome="avancar" tamanho={16} /></LinkBotao>
            {curriculo.length > 0 && <a href="#conteudo-curso" className="rounded-lg py-3 text-sm font-semibold text-muted hover:text-ink lg:px-4">Ver o conteúdo</a>}
          </div>

          <section aria-label="O que você recebe" className="mt-14">
            <h2 className="text-2xl sm:text-3xl">O que você recebe</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {recebe.map((r) => (
                <li key={r.titulo} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><Icon nome={r.icone} tamanho={20} /></span>
                  <div><h3 className="text-base">{r.titulo}</h3><p className="mt-1 text-sm text-muted">{r.texto}</p></div>
                </li>
              ))}
            </ul>
          </section>

          {p.descricao_longa && (
            <section aria-label="Sobre o curso" className="mt-14">
              <h2 className="text-2xl sm:text-3xl">Sobre o curso</h2>
              <div className="mt-4 max-w-2xl space-y-4 whitespace-pre-line text-[17px] leading-relaxed text-ink/85">{p.descricao_longa}</div>
            </section>
          )}

          <section id="conteudo-curso" aria-label="Conteúdo do curso" className="mt-14 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-2xl sm:text-3xl">Conteúdo do curso</h2>{curriculo.length > 0 && <p className="mt-1 text-sm text-muted">{curriculo.length} {curriculo.length === 1 ? 'módulo' : 'módulos'} · {aulas} {aulas === 1 ? 'aula' : 'aulas'}</p>}</div>
              {curriculo.length > 1 && <button onClick={() => setModulosAbertos(todosAbertos ? new Set() : new Set(curriculo.map((_, i) => i)))} className="text-sm font-semibold text-brand hover:underline">{todosAbertos ? 'Recolher tudo' : 'Expandir tudo'}</button>}
            </div>
            <div className="mt-5 space-y-3">
              {curriculo.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">O conteúdo deste curso será publicado em breve.</p>}
              {(() => { let n = 0; return curriculo.map((m, i) => (
                <Acordeao key={`${m.titulo}-${i}`} aberto={modulosAbertos.has(i)} onAlternar={() => alternarModulo(i)} titulo={m.titulo} lateral={`${m.aulas.length} ${m.aulas.length === 1 ? 'aula' : 'aulas'}`}>
                  <ol className="divide-y divide-line text-sm">
                    {m.aulas.map((a, j) => <li key={j} className="flex items-center gap-3 px-5 py-3 text-ink/85"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-wash font-mono text-[11px] text-muted">{++n}</span>{a}</li>)}
                  </ol>
                </Acordeao>
              )) })()}
            </div>
          </section>

          {p.garantia_dias > 0 && (
            <section aria-label="Garantia" className="mt-14 flex gap-5 rounded-2xl border border-ok/30 bg-ok/5 p-6">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ok/15 text-ok"><Icon nome="escudo" tamanho={26} /></span>
              <div><h2 className="text-xl">Garantia incondicional de {p.garantia_dias} dias</h2><p className="mt-1 text-sm text-ink/80">Compre sem risco. Se o curso não for para você, peça o reembolso dentro de {p.garantia_dias} dias e devolvemos o valor pago.</p></div>
            </section>
          )}

          <section aria-label="Perguntas frequentes" className="mt-14">
            <h2 className="text-2xl sm:text-3xl">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">
              {FAQ.map(([q, a], i) => (
                <Acordeao key={q} titulo={q} aberto={faqAberta === i} onAlternar={() => setFaqAberta(faqAberta === i ? null : i)}><p className="px-5 py-4 text-sm leading-relaxed text-ink/80">{a}</p></Acordeao>
              ))}
            </div>
          </section>
        </div>

        <aside className="mt-10 lg:mt-0 lg:row-span-2" aria-label="Comprar">
          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/20 lg:sticky lg:top-24">
            <Capa url={p.capa_url} titulo={p.titulo} />
            <div className="space-y-4 p-6">
              <div>
                <p className="font-mono text-4xl font-medium">{gratis ? 'Grátis' : brl(p.preco_centavos)}</p>
                {!gratis && p.parcelas_max > 1 && <p className="mt-1 text-sm text-muted">ou {p.parcelas_max}x de <strong className="font-mono text-ink">{brl(parcela)}</strong> no cartão</p>}
              </div>
              <LinkBotao para={`/checkout/${slug}`} tamanho="g" larga>{acao}</LinkBotao>
              <ul className="space-y-2.5 border-t border-line pt-4 text-sm text-ink/85">
                {['Acesso imediato após a aprovação', 'Certificado de conclusão', 'Comunidade para tirar dúvidas', ...(p.garantia_dias > 0 ? [`Garantia de ${p.garantia_dias} dias`] : [])].map((t) => <li key={t} className="flex items-start gap-2.5"><Icon nome="check" tamanho={16} className="mt-0.5 shrink-0 text-ok" />{t}</li>)}
              </ul>
              <p className="flex items-center justify-center gap-1.5 border-t border-line pt-4 text-xs text-muted"><Icon nome="cadeado" tamanho={13} /> Pagamento seguro por Pix, cartão ou boleto</p>
            </div>
          </div>
        </aside>

        {relacionados.length > 0 && (
          <section aria-label="Você também pode gostar" className="mt-16 lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl">Você também pode gostar</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">{relacionados.map((r) => <li key={r.id}><CartaoCurso p={r} /></li>)}</ul>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0"><p className="font-mono text-xl font-medium">{gratis ? 'Grátis' : brl(p.preco_centavos)}</p>{!gratis && p.parcelas_max > 1 && <p className="truncate text-xs text-muted">ou {p.parcelas_max}x de {brl(parcela)}</p>}</div>
        <LinkBotao para={`/checkout/${slug}`} tamanho="g">{acao}</LinkBotao>
      </div>
    </div>
  )
}
