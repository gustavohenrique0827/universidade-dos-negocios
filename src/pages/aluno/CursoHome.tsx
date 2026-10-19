import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Capa from '../../components/Capa'
import { TelaCarregando } from '../../components/Esqueleto'
import { SeloEstado } from '../../components/atividades/Selos'
import Icon from '../../components/Icon'
import { useTitulo } from '../../lib/titulo'
import { carregarCursos, type CursoEstudo } from '../../lib/estudo'
import { supabase } from '../../lib/supabase'

export default function CursoHome() {
  const { id } = useParams()
  const [curso, setCurso] = useState<CursoEstudo | null | undefined>(undefined)
  const [aba, setAba] = useState(0)
  const [certificado, setCertificado] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  async function carregar() {
    const c = (await carregarCursos()).find((x) => x.id === id) ?? null
    setCurso(c)
    const { data } = await supabase.from('certificates').select('codigo').eq('product_id', id!).maybeSingle()
    setCertificado(data?.codigo ?? null)
  }
  useEffect(() => { carregar() }, [id])

  useTitulo(curso?.titulo)
  if (curso === undefined) return <TelaCarregando escuro />
  if (curso === null) return <p className="p-8 pt-28 text-muted">Você não tem acesso a este curso. <Link to="/loja" className="text-brand">Ver cursos</Link></p>

  const modulo = curso.modulos[aba] ?? curso.modulos[0]
  const alvo = curso.proximo ?? curso.episodios[0]

  async function emitir() {
    const { data, error } = await supabase.rpc('issue_certificate', { p_product: id })
    if (error) setErro(error.message); else setCertificado(data)
  }

  return (
    <main className="pb-20">
      <section className="relative isolate flex min-h-[60vh] items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Capa url={curso.capa_url} titulo={curso.titulo} className="!aspect-auto h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/85 to-paper/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-black/60" />
          <div aria-hidden className="pointer-events-none absolute -left-20 top-20 size-[32rem] rounded-full bg-brand/15 blur-[120px]" />
        </div>

        <div className="w-full max-w-4xl px-4 pb-12 pt-32 sm:px-8">
          {curso.categoria && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-brand backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" />
              {curso.categoria}
            </span>
          )}

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {curso.titulo}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink/75">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Icon nome="livro" tamanho={15} className="text-brand" />
              {curso.modulos.length} {curso.modulos.length === 1 ? 'módulo' : 'módulos'}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Icon nome="play" tamanho={15} className="text-brand" />
              {curso.episodios.length} {curso.episodios.length === 1 ? 'episódio' : 'episódios'}
            </span>
            <span>·</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-wash">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-500" style={{ width: `${curso.pct}%` }} />
              </div>
              <span className="font-mono text-xs font-bold text-brand">{curso.pct}%</span>
            </div>
          </div>

          {curso.descricao && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
              {curso.descricao}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {alvo && (
              <Link
                to={`/curso/${curso.id}/aula/${alvo.id}`}
                className="inline-flex items-center gap-2.5 rounded-xl bg-brand px-8 py-3.5 text-base font-bold text-on-brand shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl active:scale-[0.98]"
              >
                <Icon nome="play" tamanho={18} />
                {curso.ultimoEm && curso.proximo ? `Continuar · Ep. ${curso.proximo.n}` : curso.pct === 100 ? 'Rever do início' : 'Começar a assistir'}
              </Link>
            )}

            {certificado ? (
              <Link
                to={`/certificado/${certificado}`}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-6 py-3.5 text-base font-bold text-amber-300 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-amber-500/25"
              >
                <Icon nome="diploma" tamanho={18} /> Ver certificado
              </Link>
            ) : (
              curso.pct === 100 && curso.obrigatoriasPendentes.length === 0 && (
                <button
                  onClick={emitir}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-base font-bold text-black shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5"
                >
                  <Icon nome="diploma" tamanho={18} /> Emitir certificado
                </button>
              )
            )}
          </div>

          {curso.pct === 100 && curso.obrigatoriasPendentes.length > 0 && !certificado && (
            <div role="status" className="mt-6 max-w-xl rounded-2xl border border-outlier/40 bg-outlier/10 p-5 text-sm backdrop-blur-md">
              <p className="font-bold text-outlier">Falta pouco para o seu certificado!</p>
              <p className="mt-1.5 leading-relaxed text-ink/80">
                Conclua com aprovação {curso.obrigatoriasPendentes.length === 1 ? 'a atividade obrigatória pendente' : `as ${curso.obrigatoriasPendentes.length} atividades obrigatórias pendentes`}:{' '}
                {curso.obrigatoriasPendentes.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && ', '}
                    <Link to={`/curso/${curso.id}/atividade/${a.id}`} className="font-semibold text-brand underline decoration-brand/50 hover:decoration-brand">
                      {a.titulo}
                    </Link>
                  </span>
                ))}.
              </p>
            </div>
          )}

          {erro && <p role="alert" className="mt-3 text-sm font-medium text-bad">{erro}</p>}
        </div>
      </section>

      {/* Lista de episódios */}
      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Conteúdo do Curso</h2>
            <p className="mt-1 text-sm text-muted">Acompanhe seu avanço e continue de onde parou</p>
          </div>

          {curso.modulos.length > 1 && (
            <div role="tablist" aria-label="Módulos" className="flex flex-wrap gap-1.5 rounded-2xl border border-line/70 bg-surface/60 p-1.5 backdrop-blur-md">
              {curso.modulos.map((m, i) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={aba === i}
                  onClick={() => setAba(i)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    aba === i
                      ? 'bg-brand text-on-brand shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {m.titulo}
                </button>
              ))}
            </div>
          )}
        </div>

        {!modulo ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            O conteúdo deste módulo será publicado em breve.
          </div>
        ) : (
          <ol className="mt-6 space-y-2.5">
            {modulo.episodios.map((ep) => {
              const feito = curso.feitas.has(ep.id)
              return (
                <li key={ep.id}>
                  <Link
                    to={`/curso/${curso.id}/aula/${ep.id}`}
                    className={`group flex items-center gap-4 rounded-2xl border p-3.5 transition-all duration-200 sm:gap-6 sm:p-4 ${
                      feito
                        ? 'border-line/50 bg-surface/40 hover:border-line hover:bg-surface/70'
                        : 'border-line/70 bg-surface/70 hover:border-brand/40 hover:bg-surface/90 hover:shadow-md hover:shadow-brand/5'
                    }`}
                  >
                    <span className="w-8 text-center font-mono text-xl font-bold text-muted transition group-hover:text-brand">
                      {String(ep.n).padStart(2, '0')}
                    </span>

                    <span className="relative grid aspect-video w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-wash to-black/80 sm:w-44" aria-hidden>
                      <span className="grid size-10 place-items-center rounded-full border border-white/60 bg-black/40 text-sm backdrop-blur-xs transition group-hover:scale-110 group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
                        <Icon nome="play" tamanho={14} className="ml-0.5" />
                      </span>
                      {feito && (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-ok" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-base font-bold text-ink transition group-hover:text-brand">
                          {ep.titulo}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {ep.atividades.map((a) => (
                            <SeloEstado key={a.id} estado={a.estado.estado} nota={a.estado.melhorNota} />
                          ))}
                          {feito && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/15 px-2.5 py-0.5 text-xs font-semibold text-ok">
                              <Icon nome="check" tamanho={12} /> Assistido
                            </span>
                          )}
                        </span>
                      </span>

                      <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                        {ep.conteudo ?? 'Assista ao episódio completo e acompanhe as anotações e atividades desta aula.'}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </main>
  )
}
