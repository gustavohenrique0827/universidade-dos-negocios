import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TelaCarregando } from '../../components/Esqueleto'
import { SeloEstado, SeloObrigatoria } from '../../components/atividades/Selos'
import Icon from '../../components/Icon'
import { useAuth } from '../../lib/auth'
import { useTitulo } from '../../lib/titulo'
import { carregarCursos, type CursoEstudo } from '../../lib/estudo'
import { supabase } from '../../lib/supabase'
import { dataBR } from '../../lib/util'

type Comentario = { id: string; autor_nome: string; texto: string; created_at: string; user_id: string }

export default function Aula() {
  const { id, aulaId } = useParams()
  const { session } = useAuth()
  const nav = useNavigate()
  const [curso, setCurso] = useState<CursoEstudo | null | undefined>(undefined)
  const [src, setSrc] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [contagem, setContagem] = useState<number | null>(null)
  const [autoplay, setAutoplay] = useState(true)
  const timer = useRef<number>(0)

  const carregar = useCallback(async () => setCurso((await carregarCursos()).find((c) => c.id === id) ?? null), [id])
  useEffect(() => { carregar() }, [carregar])

  const ep = curso?.episodios.find((e) => e.id === aulaId) ?? null
  const idx = curso && ep ? curso.episodios.findIndex((e) => e.id === ep.id) : -1
  const anterior = curso && idx > 0 ? curso.episodios[idx - 1] : null
  const proximo = curso && idx >= 0 ? curso.episodios[idx + 1] ?? null : null
  const feito = !!(ep && curso?.feitas.has(ep.id))

  useEffect(() => { setContagem(null); window.clearInterval(timer.current); window.scrollTo(0, 0) }, [aulaId])

  // vídeo: URL externa, ou caminho no bucket privado "aulas" (URL assinada)
  useEffect(() => {
    setSrc(null)
    const v = ep?.video_url
    if (!v) return
    if (/^https?:\/\//.test(v)) return setSrc(v)
    supabase.storage.from('aulas').createSignedUrl(v, 3600).then(({ data }) => setSrc(data?.signedUrl ?? null))
  }, [ep?.id, ep?.video_url])

  const carregarComentarios = useCallback(async () => {
    if (!aulaId) return
    const { data } = await supabase.from('comments').select('id, autor_nome, texto, created_at, user_id').eq('lesson_id', aulaId).order('created_at')
    setComentarios(data ?? [])
  }, [aulaId])
  useEffect(() => { carregarComentarios() }, [carregarComentarios])

  async function concluir() {
    if (!ep || feito) return
    await supabase.from('lesson_progress').insert({ lesson_id: ep.id, user_id: session!.user.id })
    await carregar()
  }
  async function desmarcar() {
    if (!ep) return
    await supabase.from('lesson_progress').delete().eq('lesson_id', ep.id).eq('user_id', session!.user.id)
    await carregar()
  }

  async function aoTerminar() {
    await concluir()
    if (!proximo || !autoplay) return
    let n = 5; setContagem(n)
    timer.current = window.setInterval(() => {
      n -= 1; setContagem(n)
      if (n <= 0) { window.clearInterval(timer.current); nav(`/curso/${id}/aula/${proximo.id}`) }
    }, 1000)
  }
  const cancelar = () => { window.clearInterval(timer.current); setContagem(null) }
  useEffect(() => () => window.clearInterval(timer.current), [])

  async function comentar() {
    if (!texto.trim() || !ep) return
    const { error } = await supabase.from('comments').insert({ lesson_id: ep.id, texto: texto.trim() })
    if (error) return setErro(error.message)
    setTexto(''); setErro(''); carregarComentarios()
  }

  useTitulo(ep ? `${ep.titulo} · ${curso?.titulo}` : curso?.titulo)
  if (curso === undefined) return <TelaCarregando escuro />
  if (!curso || !ep) return <p className="p-8 pt-28 text-muted">Episódio não encontrado. <Link to="/meus-cursos" className="text-brand">Voltar ao início</Link></p>

  return (
    <main className="mx-auto max-w-[1550px] px-0 pt-20 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="min-w-0">
          {/* Player de Vídeo em modo Cinema */}
          <div className="relative isolate overflow-hidden bg-black shadow-2xl shadow-black/80 sm:rounded-2xl border border-line/60">
            {/* Brilho ambiente sob o vídeo */}
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-brand/10 blur-[100px]" />

            {src ? (
              <video
                key={ep.id}
                src={src}
                controls
                autoPlay
                onEnded={aoTerminar}
                className="aspect-video w-full"
              />
            ) : (
              <div className="grid aspect-video place-items-center p-8 text-center text-muted">
                {ep.video_url ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    <span className="text-sm font-medium">Carregando vídeo…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Icon nome="play" tamanho={32} className="text-muted/40" />
                    <span className="text-sm">Este episódio ainda não possui vídeo.</span>
                  </div>
                )}
              </div>
            )}

            {/* Overlay de contagem para o próximo episódio */}
            {contagem !== null && proximo && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/85 p-6 text-center backdrop-blur-md">
                <div className="max-w-md">
                  <span className="rounded-full bg-brand/15 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-brand">
                    A seguir · Episódio {proximo.n}
                  </span>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-white">{proximo.titulo}</p>
                  <p className="mt-4 font-mono text-6xl font-extrabold text-brand">{contagem}</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => { cancelar(); nav(`/curso/${id}/aula/${proximo.id}`) }}
                      className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
                    >
                      Assistir agora
                    </button>
                    <button
                      onClick={cancelar}
                      className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pt-5 sm:px-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">
                {ep.moduloTitulo} · Episódio {ep.n}
              </span>
              <button
                onClick={feito ? desmarcar : concluir}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  feito
                    ? 'border-ok/50 bg-ok/15 text-ok shadow-sm shadow-ok/10'
                    : 'border-line/80 bg-surface/80 text-muted hover:border-brand/40 hover:text-ink'
                }`}
              >
                {feito ? (
                  <>
                    <Icon nome="check" tamanho={14} />
                    <span>Concluído</span>
                  </>
                ) : (
                  <span>Marcar como concluído</span>
                )}
              </button>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {ep.titulo}
            </h1>

            {ep.conteudo && (
              <div className="mt-4 rounded-2xl border border-line/60 bg-surface/50 p-5 text-[15px] leading-relaxed text-ink/85 backdrop-blur-xs">
                <p className="whitespace-pre-wrap">{ep.conteudo}</p>
              </div>
            )}

            {/* Barra de Navegação entre Episódios */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line/60 bg-surface/60 p-4 backdrop-blur-md">
              <button
                onClick={() => anterior && nav(`/curso/${id}/aula/${anterior.id}`)}
                disabled={!anterior}
                className="inline-flex items-center gap-2 rounded-xl border border-line/80 bg-surface px-4 py-2 text-xs font-semibold transition hover:border-brand/40 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
              >
                <Icon nome="voltar" tamanho={14} /> Anterior
              </button>

              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-muted hover:text-ink">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="size-4 rounded accent-brand"
                />
                Próximo episódio automático
              </label>

              {proximo ? (
                <button
                  onClick={async () => { await concluir(); nav(`/curso/${id}/aula/${proximo.id}`) }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-on-brand shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
                >
                  Próximo <Icon nome="avancar" tamanho={14} />
                </button>
              ) : (
                <Link
                  to={`/curso/${id}`}
                  onClick={concluir}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-light px-5 py-2 text-xs font-bold text-on-brand shadow-sm"
                >
                  Finalizar curso <Icon nome="check" tamanho={14} />
                </Link>
              )}
            </div>

            {/* Atividades desta aula */}
            {ep.atividades.length > 0 && (
              <section className="mt-10" aria-label="Atividades desta aula">
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  {ep.atividades.length === 1 ? 'Atividade desta aula' : 'Atividades desta aula'}
                </h2>
                <ul className="mt-4 space-y-3">
                  {ep.atividades.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line/70 bg-surface/70 p-4 backdrop-blur-md transition hover:border-brand/40 hover:bg-surface/90"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{a.titulo}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <SeloEstado estado={a.estado.estado} nota={a.estado.melhorNota} />
                          {a.obrigatoria && <SeloObrigatoria />}
                          <span className="text-xs text-muted">Aprovação com nota {a.nota_minima}%</span>
                        </div>
                      </div>
                      <Link
                        to={`/curso/${id}/atividade/${a.id}`}
                        className="rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-on-brand shadow-sm transition hover:bg-brand-dark"
                      >
                        {a.estado.estado === 'nova' ? 'Fazer atividade' : a.estado.estado === 'aprovado' ? 'Ver resultado' : a.estado.estado === 'pendente' ? 'Ver envio' : 'Tentar novamente'}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Seção de Comunidade / Dúvidas */}
            <section className="mt-10 pb-16">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-ink">Comunidade</h2>
                <span className="rounded-full bg-wash px-2.5 py-0.5 font-mono text-xs font-semibold text-muted">
                  {comentarios.length}
                </span>
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && comentar()}
                  maxLength={2000}
                  placeholder="Tire sua dúvida ou compartilhe um aprendizado desta aula…"
                  aria-label="Escrever comentário"
                  className="min-w-0 flex-1 rounded-xl border border-line/80 bg-surface/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-muted/60"
                />
                <button
                  onClick={comentar}
                  className="rounded-xl bg-brand px-6 text-sm font-bold text-on-brand shadow-sm transition hover:bg-brand-dark active:scale-95"
                >
                  Enviar
                </button>
              </div>

              {erro && <p role="alert" className="mt-2 text-sm font-medium text-bad">{erro}</p>}

              <ul className="mt-6 space-y-3">
                {comentarios.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-line/80 p-6 text-center text-sm text-muted">
                    Seja o primeiro a compartilhar uma dúvida ou insight nesta aula!
                  </li>
                )}
                {comentarios.map((c) => (
                  <li key={c.id} className="flex gap-3.5 rounded-2xl border border-line/50 bg-surface/60 p-4 text-sm backdrop-blur-xs">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 font-mono text-sm font-bold text-brand shadow-xs" aria-hidden>
                      {c.autor_nome.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink">
                          {c.autor_nome}{' '}
                          <span className="font-normal text-muted/70 text-xs ml-1">· {dataBR(c.created_at)}</span>
                        </span>
                        {c.user_id === session!.user.id && (
                          <button
                            onClick={async () => { await supabase.from('comments').delete().eq('id', c.id); carregarComentarios() }}
                            className="text-xs text-muted hover:text-bad transition"
                          >
                            excluir
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-ink/85">{c.texto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Playlist lateral do curso */}
        <aside className="px-4 pb-12 sm:px-0 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto" aria-label="Episódios do curso">
          <div className="rounded-3xl border border-line/70 bg-surface/75 p-5 backdrop-blur-xl shadow-lg shadow-black/10 lg:sticky lg:top-24">
            <Link to={`/curso/${id}`} className="group flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold tracking-tight text-ink transition group-hover:text-brand line-clamp-1">
                {curso.titulo}
              </h2>
              <Icon nome="voltar" tamanho={14} className="rotate-180 text-muted transition group-hover:text-brand" />
            </Link>

            <div className="mb-5 mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-wash">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-300" style={{ width: `${curso.pct}%` }} />
              </div>
              <span className="font-mono text-xs font-bold text-brand">{curso.pct}%</span>
            </div>

            <div className="space-y-5">
              {curso.modulos.map((m) => (
                <div key={m.id}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    {m.titulo}
                  </h3>
                  <ul className="space-y-1.5">
                    {m.episodios.map((e) => {
                      const ativo = e.id === ep.id
                      const assistido = curso.feitas.has(e.id)
                      return (
                        <li key={e.id}>
                          <Link
                            to={`/curso/${id}/aula/${e.id}`}
                            aria-current={ativo ? 'true' : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                              ativo
                                ? 'border-l-2 border-brand bg-brand/15 font-bold text-brand shadow-xs'
                                : 'text-ink/80 hover:bg-wash/60 hover:text-ink'
                            }`}
                          >
                            <span className="w-5 text-center font-mono text-[11px] text-muted">
                              {String(e.n).padStart(2, '0')}
                            </span>
                            <span className="flex-1 truncate">{e.titulo}</span>
                            {e.atividades.length > 0 && (
                              <span title="Tem atividade" className="size-1.5 rounded-full bg-brand" />
                            )}
                            <span
                              aria-label={assistido ? 'concluído' : 'pendente'}
                              className={assistido ? 'text-ok' : 'text-muted/40'}
                            >
                              {assistido ? <Icon nome="check" tamanho={14} /> : <Icon nome="circle" tamanho={12} />}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
