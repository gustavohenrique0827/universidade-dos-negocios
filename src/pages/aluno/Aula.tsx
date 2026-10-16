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
    <main className="mx-auto max-w-[1500px] px-0 pt-20 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="relative overflow-hidden bg-black sm:rounded-xl">
            {src ? <video key={ep.id} src={src} controls autoPlay onEnded={aoTerminar} className="aspect-video w-full" />
              : <div className="grid aspect-video place-items-center text-muted">{ep.video_url ? 'Carregando vídeo…' : 'Este episódio ainda não tem vídeo.'}</div>}
            {contagem !== null && proximo && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
                <div><p className="text-sm text-muted">A seguir · Episódio {proximo.n}</p><p className="mt-1 font-display text-2xl font-bold">{proximo.titulo}</p>
                  <p className="mt-3 font-mono text-5xl text-brand">{contagem}</p>
                  <div className="mt-4 flex justify-center gap-3"><button onClick={() => { cancelar(); nav(`/curso/${id}/aula/${proximo.id}`) }} className="rounded-md bg-brand px-5 py-2 font-semibold text-on-brand">Assistir agora</button><button onClick={cancelar} className="rounded-md border border-white/30 px-5 py-2">Cancelar</button></div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-0">
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-brand">{ep.moduloTitulo} · Episódio {ep.n}</p>
            <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl sm:text-4xl">{ep.titulo}</h1>
              <button onClick={feito ? desmarcar : concluir} className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${feito ? 'border-ok/50 bg-ok/10 text-ok' : 'border-line hover:border-brand hover:text-brand'}`}>{feito ? <span className="inline-flex items-center gap-1.5"><Icon nome="check" tamanho={15} /> Concluído</span> : 'Marcar como concluído'}</button>
            </div>
            {ep.conteudo && <p className="mt-3 whitespace-pre-wrap text-ink/80">{ep.conteudo}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4">
              <button onClick={() => anterior && nav(`/curso/${id}/aula/${anterior.id}`)} disabled={!anterior} className="rounded-md border border-line px-4 py-2 text-sm font-medium disabled:opacity-30 inline-flex items-center gap-2"><Icon nome="voltar" tamanho={15} /> Anterior</button>
              <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} className="size-4 accent-brand" /> Próximo episódio automático</label>
              {proximo ? <button onClick={async () => { await concluir(); nav(`/curso/${id}/aula/${proximo.id}`) }} className="rounded-md bg-brand px-5 py-2 text-sm font-bold text-on-brand hover:bg-brand-dark inline-flex items-center gap-2">Próximo <Icon nome="avancar" tamanho={15} /></button>
                : <Link to={`/curso/${id}`} onClick={concluir} className="rounded-md bg-brand px-5 py-2 text-sm font-bold text-on-brand hover:bg-brand-dark">Finalizar curso</Link>}
            </div>

            {ep.atividades.length > 0 && (
              <section className="mt-8" aria-label="Atividades desta aula">
                <h2 className="text-xl">{ep.atividades.length === 1 ? 'Atividade desta aula' : 'Atividades desta aula'}</h2>
                <ul className="mt-3 space-y-3">
                  {ep.atividades.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4">
                      <div className="min-w-0"><p className="font-semibold">{a.titulo}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2"><SeloEstado estado={a.estado.estado} nota={a.estado.melhorNota} />{a.obrigatoria && <SeloObrigatoria />}<span className="text-xs text-muted">Aprovação com {a.nota_minima}%</span></div></div>
                      <Link to={`/curso/${id}/atividade/${a.id}`} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-on-brand hover:bg-brand-dark">{a.estado.estado === 'nova' ? 'Fazer atividade' : a.estado.estado === 'aprovado' ? 'Ver resultado' : a.estado.estado === 'pendente' ? 'Ver envio' : 'Tentar novamente'}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-8 pb-10">
              <h2 className="text-xl">Comunidade <span className="text-base text-muted">({comentarios.length})</span></h2>
              <div className="mt-3 flex gap-2">
                <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && comentar()} maxLength={2000} placeholder="Tire uma dúvida ou compartilhe um aprendizado" aria-label="Escrever comentário" className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand" />
                <button onClick={comentar} className="rounded-md bg-brand px-5 text-sm font-bold text-on-brand hover:bg-brand-dark">Enviar</button>
              </div>
              {erro && <p role="alert" className="mt-2 text-sm text-bad">{erro}</p>}
              <ul className="mt-4 space-y-3">
                {comentarios.length === 0 && <li className="text-sm text-muted">Seja o primeiro a comentar neste episódio.</li>}
                {comentarios.map((c) => (
                  <li key={c.id} className="flex gap-3 rounded-lg bg-surface p-3 text-sm">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/20 font-bold text-brand" aria-hidden>{c.autor_nome.charAt(0)}</span>
                    <div className="min-w-0 flex-1"><p className="flex justify-between gap-2"><span className="font-semibold">{c.autor_nome} <span className="font-normal text-muted">· {dataBR(c.created_at)}</span></span>
                      {c.user_id === session!.user.id && <button onClick={async () => { await supabase.from('comments').delete().eq('id', c.id); carregarComentarios() }} className="text-muted hover:text-bad">apagar</button>}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-ink/85">{c.texto}</p></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <aside className="px-4 pb-10 sm:px-0 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto" aria-label="Episódios do curso">
          <Link to={`/curso/${id}`} className="font-display text-lg font-bold hover:text-brand">{curso.titulo}</Link>
          <div className="mb-3 mt-2 flex items-center gap-3"><div className="h-1 flex-1 rounded bg-wash"><div className="h-1 rounded bg-brand" style={{ width: `${curso.pct}%` }} /></div><span className="font-mono text-xs text-muted">{curso.pct}%</span></div>
          {curso.modulos.map((m) => (
            <div key={m.id} className="mb-4">
              <h3 className="mb-1 text-sm text-muted">{m.titulo}</h3>
              <ul className="space-y-1">
                {m.episodios.map((e) => (
                  <li key={e.id}>
                    <Link to={`/curso/${id}/aula/${e.id}`} aria-current={e.id === ep.id ? 'true' : undefined} className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition ${e.id === ep.id ? 'bg-brand/15 text-brand' : 'hover:bg-surface'}`}>
                      <span className="w-5 text-center font-mono text-xs text-muted">{e.n}</span>
                      <span className="flex-1 truncate">{e.titulo}</span>{e.atividades.length > 0 && <span title="Tem atividade" className="text-xs text-brand">●</span>}
                      <span aria-label={curso.feitas.has(e.id) ? 'concluído' : 'pendente'} className={curso.feitas.has(e.id) ? 'text-ok' : 'text-muted'}>{curso.feitas.has(e.id) ? <Icon nome="check" tamanho={15} /> : <Icon nome="circle" tamanho={14} />}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </main>
  )
}
