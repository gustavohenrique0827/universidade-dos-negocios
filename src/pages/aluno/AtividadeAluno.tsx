import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AtividadePlayer from '../../components/atividades/Player'
import { SeloEstado, SeloObrigatoria } from '../../components/atividades/Selos'
import { TelaCarregando } from '../../components/Esqueleto'
import Icon from '../../components/Icon'
import { type AtividadeAluno, type Envio, type Respostas, type Resultado, estadoDe } from '../../lib/atividades'
import { useAuth } from '../../lib/auth'
import { carregarCursos, type CursoEstudo, type Episodio } from '../../lib/estudo'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { dataBR } from '../../lib/util'

/** Página em que o aluno responde uma atividade e vê o resultado. */
export default function AtividadeAlunoPagina() {
  const { id, aid } = useParams()
  const { session } = useAuth()
  const nav = useNavigate()
  const [atividade, setAtividade] = useState<AtividadeAluno | null | undefined>(undefined)
  const [curso, setCurso] = useState<CursoEstudo | null>(null)
  const [envios, setEnvios] = useState<Envio[]>([])
  const [rodada, setRodada] = useState(0)
  const [enviou, setEnviou] = useState(false) // true enquanto o resultado do envio recém-feito está na tela
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const [{ data, error }, cursos, { data: e }] = await Promise.all([
      supabase.rpc('activity_for_student', { p_activity: aid }),
      carregarCursos(),
      supabase.from('activity_submissions').select('id, activity_id, status, nota, aprovado, tentativa, feedback, created_at').eq('activity_id', aid!).eq('user_id', session!.user.id).order('created_at'),
    ])
    if (error) { setErro(error.message); return setAtividade(null) }
    setAtividade(data as AtividadeAluno); setCurso(cursos.find((c) => c.id === id) ?? null); setEnvios((e ?? []) as Envio[])
  }, [aid, id, session])
  useEffect(() => { carregar() }, [carregar])

  useTitulo(atividade?.titulo)
  if (atividade === undefined) return <TelaCarregando escuro />
  if (atividade === null) return <main className="mx-auto max-w-xl px-4 pt-32 text-center"><h1 className="text-3xl">Atividade indisponível</h1><p className="mt-2 text-muted">{erro || 'Você não tem acesso a esta atividade.'}</p><Link to={`/curso/${id}`} className="mt-6 inline-block text-brand">Voltar ao curso</Link></main>

  const aula: Episodio | undefined = curso?.episodios.find((ep) => ep.atividades.some((a) => a.id === aid))
  const proximaAula = aula && curso ? curso.episodios[curso.episodios.indexOf(aula) + 1] : undefined
  const estado = estadoDe(envios)
  const acabou = atividade.tentativas_max !== null && atividade.tentativas_usadas >= atividade.tentativas_max
  const ultimo = [...envios].reverse()[0]

  async function enviar(r: Respostas): Promise<Resultado> {
    const { data, error } = await supabase.rpc('submit_activity', { p_activity: aid, p_respostas: r })
    if (error) throw new Error(error.message)
    const res = data as Resultado
    setEnviou(true)
    setEnvios((x) => [...x, { id: res.submission_id ?? 'novo', activity_id: aid!, status: res.status, nota: res.nota, aprovado: res.aprovado, tentativa: res.tentativa, feedback: null, created_at: new Date().toISOString() }])
    return res
  }
  const voltar = aula ? `/curso/${id}/aula/${aula.id}` : `/curso/${id}`

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
      <Link to={voltar} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><Icon nome="voltar" tamanho={15} /> {aula ? `Aula ${aula.n}: ${aula.titulo}` : 'Voltar ao curso'}</Link>
      <header className="mt-5">
        <p className="font-mono text-xs uppercase tracking-widest text-brand">Atividade</p>
        <h1 className="mt-2 text-4xl leading-tight">{atividade.titulo}</h1>
        {atividade.descricao && <p className="mt-3 text-lg text-ink/80">{atividade.descricao}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <SeloEstado estado={estado.estado} nota={estado.melhorNota} />{atividade.obrigatoria && <SeloObrigatoria />}
          <span className="text-muted">Aprovação com {atividade.nota_minima}%</span>
          <span className="text-muted">· {atividade.perguntas.length} {atividade.perguntas.length === 1 ? 'pergunta' : 'perguntas'}</span>
          {atividade.tentativas_max !== null && <span className="text-muted">· tentativa {Math.min(atividade.tentativas_usadas + 1, atividade.tentativas_max)} de {atividade.tentativas_max}</span>}
        </div>
      </header>

      <div className="mt-8">
        {!enviou && acabou && estado.estado !== 'aprovado' ? (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-2xl">{estado.estado === 'pendente' ? 'Aguardando correção' : 'Tentativas esgotadas'}</h2>
            <p className="mt-2 text-muted">{estado.estado === 'pendente' ? 'Suas respostas foram enviadas e estão com o professor. A nota aparece aqui quando a correção terminar.' : 'Você usou todas as tentativas desta atividade. Fale com o professor se precisar de uma nova chance.'}</p>
            {ultimo?.feedback && <p className="mt-4 rounded-lg bg-wash p-3 text-sm"><span className="font-semibold">Comentário do professor: </span>{ultimo.feedback}</p>}
          </div>
        ) : !enviou && estado.estado === 'aprovado' && rodada === 0 && envios.length > 0 ? (
          <div className="rounded-2xl border border-ok/40 bg-ok/5 p-6">
            <h2 className="flex items-center gap-2 text-2xl"><Icon nome="check" className="text-ok" /> Você já foi aprovado</h2>
            <p className="mt-2 text-muted">Melhor nota: <strong className="font-mono text-ink">{estado.melhorNota}%</strong>, em {dataBR(envios.find((e) => e.aprovado)?.created_at)}.</p>
            {ultimo?.feedback && <p className="mt-4 rounded-lg bg-wash p-3 text-sm"><span className="font-semibold">Comentário do professor: </span>{ultimo.feedback}</p>}
            <div className="mt-5 flex flex-wrap gap-2"><Link to={voltar} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-on-brand hover:bg-brand-dark">Voltar à aula</Link>
              {!acabou && <button onClick={() => setRodada(1)} className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold hover:border-brand">Refazer para praticar</button>}</div>
          </div>
        ) : (
          <AtividadePlayer key={rodada} atividade={atividade} enviar={enviar}
            onTentarNovamente={async () => { await carregar(); setEnviou(false); setRodada((x) => x + 1) }}
            rodapeResultado={<>
              <button onClick={() => { void carregar(); nav(voltar) }} className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold hover:border-brand">Voltar à aula</button>
              {proximaAula && <Link to={`/curso/${id}/aula/${proximaAula.id}`} onClick={() => void carregar()} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-on-brand hover:bg-brand-dark">Próxima aula</Link>}
            </>} />
        )}
      </div>
    </main>
  )
}
