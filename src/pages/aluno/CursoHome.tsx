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
    <main className="pb-16">
      <section className="relative isolate flex min-h-[60vh] items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Capa url={curso.capa_url} titulo={curso.titulo} className="!aspect-auto h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-black/50" />
        </div>
        <div className="w-full max-w-3xl px-4 pb-12 pt-32 sm:px-8">
          {curso.categoria && <p className="font-mono text-xs uppercase tracking-widest text-brand">{curso.categoria}</p>}
          <h1 className="mt-2 text-5xl leading-[1.03] sm:text-6xl">{curso.titulo}</h1>
          <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-ink/75"><span>{curso.modulos.length} {curso.modulos.length === 1 ? 'módulo' : 'módulos'}</span><span>{curso.episodios.length} {curso.episodios.length === 1 ? 'episódio' : 'episódios'}</span><span className="font-mono text-brand">{curso.pct}% assistido</span></p>
          {curso.descricao && <p className="mt-4 max-w-xl text-lg text-ink/80">{curso.descricao}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {alvo && <Link to={`/curso/${curso.id}/aula/${alvo.id}`} className="inline-flex items-center gap-2 rounded-md bg-brand px-7 py-3 text-lg font-bold text-on-brand hover:bg-brand-dark"><Icon nome="play" tamanho={18} /> {curso.ultimoEm && curso.proximo ? `Continuar · Ep. ${curso.proximo.n}` : curso.pct === 100 ? 'Rever do início' : 'Assistir'}</Link>}
            {certificado ? <Link to={`/certificado/${certificado}`} className="rounded-md bg-white/15 px-6 py-3 text-lg font-semibold backdrop-blur hover:bg-white/25">Ver certificado</Link>
              : curso.pct === 100 && curso.obrigatoriasPendentes.length === 0 && <button onClick={emitir} className="rounded-md bg-outlier px-6 py-3 text-lg font-bold text-on-brand">Emitir certificado</button>}
          </div>
          {curso.pct === 100 && curso.obrigatoriasPendentes.length > 0 && !certificado && (
            <div role="status" className="mt-5 max-w-xl rounded-xl border border-outlier/40 bg-outlier/10 p-4 text-sm">
              <p className="font-semibold">Falta pouco para o certificado</p>
              <p className="mt-1 text-ink/80">Conclua com aprovação {curso.obrigatoriasPendentes.length === 1 ? 'a atividade obrigatória' : `as ${curso.obrigatoriasPendentes.length} atividades obrigatórias`}: {curso.obrigatoriasPendentes.map((a, i) => (
                <span key={a.id}>{i > 0 && ', '}<Link to={`/curso/${curso.id}/atividade/${a.id}`} className="font-semibold text-brand underline">{a.titulo}</Link></span>))}.</p>
            </div>
          )}
          {erro && <p role="alert" className="mt-3 text-sm text-bad">{erro}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Episódios</h2>
          {curso.modulos.length > 1 && (
            <div role="tablist" aria-label="Módulos" className="flex flex-wrap gap-2">
              {curso.modulos.map((m, i) => <button key={m.id} role="tab" aria-selected={aba === i} onClick={() => setAba(i)} className={`rounded-full border px-3.5 py-1 text-sm font-medium transition ${aba === i ? 'border-brand bg-brand text-on-brand' : 'border-line text-muted hover:text-ink'}`}>{m.titulo}</button>)}
            </div>
          )}
        </div>
        {!modulo ? <p className="mt-6 text-muted">O conteúdo será publicado em breve.</p> : (
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {modulo.episodios.map((ep) => {
              const feito = curso.feitas.has(ep.id)
              return (
                <li key={ep.id}>
                  <Link to={`/curso/${curso.id}/aula/${ep.id}`} className="group flex items-center gap-4 px-2 py-4 transition hover:bg-surface sm:gap-6 sm:px-4">
                    <span className="w-8 text-center font-display text-3xl font-bold text-muted group-hover:text-brand">{ep.n}</span>
                    <span className="relative grid aspect-video w-32 shrink-0 place-items-center overflow-hidden rounded bg-gradient-to-br from-wash to-black sm:w-44" aria-hidden>
                      <span className="grid size-10 place-items-center rounded-full border-2 border-white/70 text-sm transition group-hover:scale-110 group-hover:border-brand group-hover:text-brand"><Icon nome="play" tamanho={14} className="ml-0.5" /></span>
                      {feito && <span className="absolute inset-x-0 bottom-0 h-1 bg-brand" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3"><span className="truncate font-semibold">{ep.titulo}</span><span className="flex shrink-0 items-center gap-2">{ep.atividades.map((a) => <SeloEstado key={a.id} estado={a.estado.estado} nota={a.estado.melhorNota} />)}{feito && <span className="rounded-full bg-ok/15 px-2 py-0.5 text-xs font-medium text-ok">Assistido</span>}</span></span>
                      <span className="mt-1 line-clamp-2 text-sm text-muted">{ep.conteudo ?? 'Assista ao episódio e marque como concluído para acompanhar seu progresso.'}</span>
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
