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
    <div className={`overflow-hidden rounded-2xl border transition-all duration-200 ${aberto ? 'border-brand/40 bg-surface/90 shadow-md shadow-brand/5' : 'border-line/70 bg-surface/50 hover:border-line hover:bg-surface/80'}`}>
      <button
        onClick={onAlternar}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold transition sm:px-6"
      >
        <span className="min-w-0 text-base text-ink">{titulo}</span>
        <span className="flex shrink-0 items-center gap-3 text-sm font-normal text-muted">
          {lateral}
          <span className={`grid size-7 place-items-center rounded-full bg-wash transition-transform duration-200 ${aberto ? 'rotate-180 bg-brand/15 text-brand' : 'text-muted'}`}>
            <Icon nome="baixo" tamanho={14} />
          </span>
        </span>
      </button>
      {aberto && (
        <div className="border-t border-line/60 bg-paper/40">
          {children}
        </div>
      )}
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
  const alternarModulo = (i: number) => setModulosAbertos((s) => {
    const n = new Set(s)
    if (n.has(i)) n.delete(i)
    else n.add(i)
    return n
  })
  const migalhas = [{ rotulo: 'Cursos', para: '/loja' }, ...(p.categoria ? [{ rotulo: p.categoria, para: '/loja' }] : []), { rotulo: p.titulo }]
  const acao = gratis ? 'Começar agora' : 'Comprar agora'

  const recebe: { icone: 'play' | 'diploma' | 'grupo' | 'infinito'; titulo: string; texto: string }[] = [
    { icone: 'play', titulo: aulas ? `${aulas} ${aulas === 1 ? 'aula' : 'aulas'} em vídeo` : 'Aulas em vídeo', texto: curriculo.length ? `Organizadas em ${curriculo.length} ${curriculo.length === 1 ? 'módulo' : 'módulos'} passo a passo para você dominar na prática.` : 'Conteúdo completo organizado em módulos.' },
    { icone: 'diploma', titulo: 'Certificado oficial com autenticidade', texto: 'Emita seu certificado verificado por QR Code ao concluir 100% das aulas.' },
    { icone: 'grupo', titulo: 'Comunidade exclusiva em cada aula', texto: 'Tire dúvidas diretamente com a equipe e faça networking com outros alunos.' },
    { icone: 'infinito', titulo: 'Acesso vitalício e atualizações', texto: 'Assista quantas vezes quiser no computador, tablet ou celular, sem expiração.' },
  ]

  return (
    <div className="relative overflow-hidden pb-24 lg:pb-16">
      {/* Luz ambiente de fundo */}
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[38rem] rounded-full bg-brand/10 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-[40%] size-[32rem] rounded-full bg-brand/5 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl gap-x-12 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_390px] lg:py-12">
        <div className="min-w-0">
          <div className="max-sm:hidden"><Breadcrumbs itens={migalhas} /></div>
          <Link to="/loja" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink sm:hidden">
            <Icon nome="voltar" tamanho={14} /> Todos os cursos
          </Link>

          {p.categoria && (
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-brand">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" />
              {p.categoria}
            </span>
          )}

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {p.titulo}
          </h1>

          {p.descricao && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              {p.descricao}
            </p>
          )}

          <ul className="mt-6 flex flex-wrap gap-2 text-xs font-medium sm:text-sm">
            {[...(curriculo.length ? [`${curriculo.length} ${curriculo.length === 1 ? 'módulo' : 'módulos'}`, `${aulas} ${aulas === 1 ? 'aula' : 'aulas'}`] : []), 'Acesso vitalício', 'Certificado incluso', ...(p.garantia_dias > 0 ? [`Garantia de ${p.garantia_dias} dias`] : [])].map((t) => (
              <li key={t} className="rounded-full border border-line/70 bg-surface/70 px-3.5 py-1.5 text-ink/85 backdrop-blur-sm shadow-xs">
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LinkBotao para={`/checkout/${slug}`} tamanho="g" className="max-lg:hidden shadow-lg shadow-brand/20">
              {acao} <Icon nome="avancar" tamanho={16} />
            </LinkBotao>
            {curriculo.length > 0 && (
              <a href="#conteudo-curso" className="inline-flex items-center gap-2 rounded-xl border border-line/70 bg-surface/60 px-4 py-3 text-sm font-semibold text-muted backdrop-blur-sm transition hover:border-brand/40 hover:text-ink">
                Ver o conteúdo <Icon nome="baixo" tamanho={14} />
              </a>
            )}
          </div>

          {/* O que você recebe */}
          <section aria-label="O que você recebe" className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">O que você recebe</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {recebe.map((r) => (
                <li key={r.titulo} className="group relative overflow-hidden rounded-2xl border border-line/70 bg-surface/60 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface/90 hover:shadow-lg hover:shadow-brand/5">
                  <div className="flex gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand shadow-xs transition-transform duration-200 group-hover:scale-105">
                      <Icon nome={r.icone} tamanho={22} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-ink">{r.titulo}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{r.texto}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Sobre o curso */}
          {p.descricao_longa && (
            <section aria-label="Sobre o curso" className="mt-14">
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Sobre o curso</h2>
              <div className="prose prose-invert mt-4 max-w-2xl space-y-4 whitespace-pre-line rounded-2xl border border-line/60 bg-surface/40 p-6 text-[16px] leading-relaxed text-ink/85 backdrop-blur-xs">
                {p.descricao_longa}
              </div>
            </section>
          )}

          {/* Conteúdo programático */}
          <section id="conteudo-curso" aria-label="Conteúdo do curso" className="mt-14 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Conteúdo do curso</h2>
                {curriculo.length > 0 && (
                  <p className="mt-1 text-sm text-muted">
                    {curriculo.length} {curriculo.length === 1 ? 'módulo' : 'módulos'} · {aulas} {aulas === 1 ? 'aula' : 'aulas'} no total
                  </p>
                )}
              </div>
              {curriculo.length > 1 && (
                <button
                  onClick={() => setModulosAbertos(todosAbertos ? new Set() : new Set(curriculo.map((_, i) => i)))}
                  className="rounded-lg border border-line/60 bg-surface/50 px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand/40 hover:bg-brand/10"
                >
                  {todosAbertos ? 'Recolher todos' : 'Expandir todos'}
                </button>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {curriculo.length === 0 && (
                <div className="rounded-2xl border border-dashed border-line/80 bg-surface/40 p-8 text-center text-sm text-muted">
                  O conteúdo deste curso será publicado em breve.
                </div>
              )}
              {(() => {
                let n = 0
                return curriculo.map((m, i) => (
                  <Acordeao
                    key={`${m.titulo}-${i}`}
                    aberto={modulosAbertos.has(i)}
                    onAlternar={() => alternarModulo(i)}
                    titulo={<span className="font-semibold text-ink">{i + 1}. {m.titulo}</span>}
                    lateral={<span className="rounded-full bg-wash px-2.5 py-0.5 font-mono text-xs font-medium text-muted">{m.aulas.length} {m.aulas.length === 1 ? 'aula' : 'aulas'}</span>}
                  >
                    <ol className="divide-y divide-line/50 text-sm">
                      {m.aulas.map((a, j) => (
                        <li key={j} className="flex items-center gap-3 px-5 py-3.5 text-ink/85 transition hover:bg-wash/40 sm:px-6">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-wash font-mono text-[11px] font-semibold text-muted">
                            {++n}
                          </span>
                          <span className="flex-1 font-medium">{a}</span>
                          <Icon nome="play" tamanho={13} className="text-muted/60" />
                        </li>
                      ))}
                    </ol>
                  </Acordeao>
                ))
              })()}
            </div>
          </section>

          {/* Garantia incondicional */}
          {p.garantia_dias > 0 && (
            <section aria-label="Garantia" className="relative mt-14 overflow-hidden rounded-3xl border border-ok/35 bg-gradient-to-br from-ok/10 via-surface/80 to-surface/40 p-6 sm:p-7 backdrop-blur-md shadow-lg shadow-ok/5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-ok/20 text-ok shadow-inner ring-1 ring-ok/30">
                  <Icon nome="escudo" tamanho={30} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-ink sm:text-2xl">
                      Garantia incondicional de {p.garantia_dias} dias
                    </h2>
                    <span className="rounded-full bg-ok/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-ok">
                      100% sem risco
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">
                    Inscreva-se com tranquilidade. Se dentro de {p.garantia_dias} dias você achar que o curso não é para você, basta solicitar com um clique e devolveremos 100% do seu dinheiro, sem perguntas e sem letras miúdas.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* FAQ */}
          <section aria-label="Perguntas frequentes" className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">
              {FAQ.map(([q, a], i) => (
                <Acordeao
                  key={q}
                  titulo={q}
                  aberto={faqAberta === i}
                  onAlternar={() => setFaqAberta(faqAberta === i ? null : i)}
                >
                  <p className="px-5 py-4 text-sm leading-relaxed text-ink/80 sm:px-6">{a}</p>
                </Acordeao>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Sticky de Compra */}
        <aside className="mt-10 lg:mt-0 lg:row-span-2" aria-label="Comprar">
          <div className="overflow-hidden rounded-3xl border border-line/80 bg-surface/85 shadow-2xl shadow-black/25 backdrop-blur-xl lg:sticky lg:top-24">
            <div className="relative">
              <Capa url={p.capa_url} titulo={p.titulo} />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-40 pointer-events-none" />
            </div>

            <div className="space-y-5 p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted">Investimento</span>
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand">Acesso Vitalício</span>
                </div>
                <p className="mt-1 font-mono text-4xl font-extrabold tracking-tight text-ink">
                  {gratis ? 'Grátis' : brl(p.preco_centavos)}
                </p>
                {!gratis && p.parcelas_max > 1 && (
                  <p className="mt-1 text-sm text-muted">
                    ou {p.parcelas_max}x de <strong className="font-mono text-ink">{brl(parcela)}</strong> no cartão
                  </p>
                )}
              </div>

              <LinkBotao para={`/checkout/${slug}`} tamanho="g" larga className="shadow-lg shadow-brand/25">
                {acao} <Icon nome="avancar" tamanho={16} />
              </LinkBotao>

              <ul className="space-y-3 border-t border-line/60 pt-5 text-sm text-ink/85">
                {[
                  'Acesso imediato após aprovação',
                  'Certificado oficial com autenticidade',
                  'Comunidade para dúvidas e networking',
                  ...(p.garantia_dias > 0 ? [`Garantia incondicional de ${p.garantia_dias} dias`] : []),
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
                      <Icon nome="check" tamanho={13} />
                    </span>
                    <span className="text-sm font-medium">{t}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-line/50 bg-paper/50 p-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
                  <Icon nome="cadeado" tamanho={13} className="text-ok" />
                  Pagamento 100% seguro via Pix, Cartão ou Boleto
                </p>
              </div>
            </div>
          </div>
        </aside>

        {relacionados.length > 0 && (
          <section aria-label="Você também pode gostar" className="mt-16 lg:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Você também pode gostar</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {relacionados.map((r) => (
                <li key={r.id}>
                  <CartaoCurso p={r} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Dock mobile inferior com blur */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line/80 bg-paper/85 px-4 py-3 backdrop-blur-xl shadow-2xl lg:hidden">
        <div className="min-w-0">
          <p className="font-mono text-xl font-bold text-ink">{gratis ? 'Grátis' : brl(p.preco_centavos)}</p>
          {!gratis && p.parcelas_max > 1 && (
            <p className="truncate text-xs text-muted">ou {p.parcelas_max}x de {brl(parcela)}</p>
          )}
        </div>
        <LinkBotao para={`/checkout/${slug}`} tamanho="g" className="shadow-md shadow-brand/20">
          {acao}
        </LinkBotao>
      </div>
    </div>
  )
}
