import { useMemo, useState } from 'react'
import Icon from '../Icon'
import type { AtividadeAluno, PerguntaAluno, Resultado, Respostas } from '../../lib/atividades'
import { TIPOS } from '../../lib/atividades'

type Props = {
  atividade: AtividadeAluno
  /** Envia as respostas e devolve o resultado (no servidor, ou localmente na prévia). */
  enviar: (r: Respostas) => Promise<Resultado>
  previa?: boolean
  onTentarNovamente?: () => void
  rodapeResultado?: React.ReactNode
}

const respondida = (p: PerguntaAluno, r: Respostas) => (p.tipo === 'texto' ? typeof r[p.id] === 'string' && (r[p.id] as string).trim().length > 0 : Array.isArray(r[p.id]) && (r[p.id] as string[]).length > 0)

function Anel({ nota, aprovado }: { nota: number; aprovado: boolean }) {
  const raio = 52, c = 2 * Math.PI * raio
  return (
    <div className="relative size-36 shrink-0" role="img" aria-label={`Nota ${nota}%`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90"><circle cx="60" cy="60" r={raio} fill="none" className="stroke-line" strokeWidth="10" />
        <circle cx="60" cy="60" r={raio} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - nota / 100)} className={`${aprovado ? 'stroke-ok' : 'stroke-bad'} transition-all duration-700`} /></svg>
      <div className="absolute inset-0 grid place-items-center"><span className="font-mono text-3xl font-medium">{nota}%</span></div>
    </div>
  )
}

/** Quem responde: uma pergunta por vez, revisão final e resultado com explicações. */
export default function AtividadePlayer({ atividade, enviar, previa, onTentarNovamente, rodapeResultado }: Props) {
  const [passo, setPasso] = useState(0)            // 0..n-1 perguntas, n = revisão
  const [r, setR] = useState<Respostas>({})
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const ps = atividade.perguntas
  const n = ps.length
  const q = ps[passo] as PerguntaAluno | undefined
  const faltam = useMemo(() => ps.filter((p) => !respondida(p, r)), [ps, r])

  function marcar(p: PerguntaAluno, id: string) {
    setR((x) => {
      const atual = Array.isArray(x[p.id]) ? (x[p.id] as string[]) : []
      if (p.tipo === 'multipla') return { ...x, [p.id]: atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id] }
      return { ...x, [p.id]: [id] }
    })
  }

  async function finalizar() {
    setEnviando(true); setErro('')
    try { setResultado(await enviar(r)) } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível enviar.') }
    setEnviando(false)
  }

  if (resultado) {
    const aprovado = resultado.aprovado === true
    const pendente = resultado.status === 'pendente'
    const restantes = atividade.tentativas_max === null ? null : atividade.tentativas_max - resultado.tentativa
    return (
      <div>
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-surface p-6">
          {resultado.nota !== null ? <Anel nota={resultado.nota} aprovado={aprovado} /> : <div className="grid size-36 shrink-0 place-items-center rounded-full border-2 border-dashed border-outlier/60 text-outlier"><Icon nome="diploma" tamanho={40} /></div>}
          <div className="min-w-0 flex-1">
            <p className={`font-mono text-xs uppercase tracking-widest ${pendente ? 'text-outlier' : aprovado ? 'text-ok' : 'text-bad'}`}>{previa ? 'Prévia · ' : ''}{pendente ? 'Em correção' : aprovado ? 'Aprovado' : 'Não aprovado'}</p>
            <h2 className="mt-1 text-3xl">{pendente ? 'Respostas enviadas!' : aprovado ? 'Parabéns, você passou!' : 'Quase lá. Vale tentar de novo.'}</h2>
            <p className="mt-2 text-sm text-muted">{pendente ? 'Há perguntas dissertativas. Quando o professor corrigir, a nota aparece aqui e na página do curso.' : `Nota mínima para aprovação: ${atividade.nota_minima}%.`}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!aprovado && !pendente && (restantes === null || restantes > 0) && onTentarNovamente && <button onClick={onTentarNovamente} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-dark">Tentar novamente{restantes !== null ? ` (${restantes} ${restantes === 1 ? 'restante' : 'restantes'})` : ''}</button>}
              {rodapeResultado}
            </div>
          </div>
        </div>
        <h3 className="mb-3 mt-8 text-xl">Revisão das respostas</h3>
        <ol className="space-y-3">
          {ps.map((p, i) => {
            const d = resultado.detalhes.find((x) => x.pergunta_id === p.id)
            const resp = r[p.id]
            const rotulo = (id: string) => p.opcoes.find((o) => o.id === id)?.texto ?? id
            const marcadas = Array.isArray(resp) ? resp.map(rotulo) : []
            return (
              <li key={p.id} className={`rounded-xl border p-5 ${d?.correta === true ? 'border-ok/40 bg-ok/5' : d?.correta === false ? 'border-bad/40 bg-bad/5' : 'border-line bg-surface'}`}>
                <div className="flex items-start gap-3">
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${d?.correta === true ? 'bg-ok/20 text-ok' : d?.correta === false ? 'bg-bad/20 text-bad' : 'bg-outlier/20 text-outlier'}`}>{d?.correta === true ? <Icon nome="check" tamanho={14} /> : d?.correta === false ? <Icon nome="fechar" tamanho={14} /> : i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.enunciado}</p>
                    {p.tipo === 'texto' ? <p className="mt-2 whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm text-ink/85">{typeof resp === 'string' ? resp : ''}</p> : (
                      <dl className="mt-2 space-y-1 text-sm">
                        <div className="flex flex-wrap gap-x-2"><dt className="text-muted">Sua resposta:</dt><dd className={d?.correta ? 'text-ok' : 'text-bad'}>{marcadas.length ? marcadas.join(', ') : 'Sem resposta'}</dd></div>
                        {d?.correta === false && d.esperado && <div className="flex flex-wrap gap-x-2"><dt className="text-muted">Resposta correta:</dt><dd className="text-ok">{d.esperado.map(rotulo).join(', ')}</dd></div>}
                      </dl>
                    )}
                    {d?.explicacao && <p className="mt-3 rounded-lg bg-wash p-3 text-sm text-ink/85"><span className="font-semibold">{p.tipo === 'texto' ? 'Orientação: ' : 'Por quê: '}</span>{d.explicacao}</p>}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  const progresso = Math.round(((passo >= n ? n : passo) / n) * 100)
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm text-muted">
        <span>{passo < n ? `Pergunta ${passo + 1} de ${n}` : 'Revisão final'}</span>
        <span className="font-mono">{faltam.length === 0 ? 'Tudo respondido' : `${n - faltam.length}/${n} respondidas`}</span>
      </div>
      <div className="mt-2 h-1.5 rounded bg-wash" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da atividade"><div className="h-1.5 rounded bg-brand transition-all" style={{ width: `${passo >= n ? 100 : progresso}%` }} /></div>

      {q ? (
        <section className="mt-6" aria-labelledby="enunciado">
          <p className="font-mono text-xs uppercase tracking-widest text-brand">{TIPOS[q.tipo].rotulo} · {q.pontos} {q.pontos === 1 ? 'ponto' : 'pontos'}</p>
          <h2 id="enunciado" className="mt-2 whitespace-pre-wrap text-2xl leading-snug sm:text-3xl">{q.enunciado}</h2>
          {q.tipo === 'texto' ? (
            <div className="mt-5">
              <label className="sr-only" htmlFor="resp-texto">Sua resposta</label>
              <textarea id="resp-texto" value={typeof r[q.id] === 'string' ? (r[q.id] as string) : ''} onChange={(e) => setR({ ...r, [q.id]: e.target.value })} rows={8} maxLength={4000} placeholder="Escreva sua resposta com suas palavras…" className="w-full rounded-xl border border-line bg-surface p-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/25" />
              <p className="mt-1 text-right font-mono text-xs text-muted">{(typeof r[q.id] === 'string' ? (r[q.id] as string) : '').length}/4000</p>
            </div>
          ) : (
            <fieldset className={`mt-5 gap-3 ${q.tipo === 'vf' ? 'grid grid-cols-2' : 'space-y-3'}`}>
              <legend className="sr-only">{q.tipo === 'multipla' ? 'Marque todas as corretas' : 'Marque uma opção'}</legend>
              {q.opcoes.map((o, i) => {
                const marcada = Array.isArray(r[q.id]) && (r[q.id] as string[]).includes(o.id)
                return (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${marcada ? 'border-brand bg-brand/10' : 'border-line bg-surface hover:border-brand/50'} ${q.tipo === 'vf' ? 'justify-center text-lg font-semibold' : ''}`}>
                    <input type={q.tipo === 'multipla' ? 'checkbox' : 'radio'} name={q.id} checked={marcada} onChange={() => marcar(q, o.id)} className="size-5 accent-brand" />
                    {q.tipo !== 'vf' && <span className="grid size-7 shrink-0 place-items-center rounded-md bg-wash font-mono text-xs text-muted">{String.fromCharCode(65 + i)}</span>}
                    <span>{o.texto}</span>
                  </label>
                )
              })}
              {q.tipo === 'multipla' && <p className="col-span-full text-sm text-muted">Mais de uma opção pode estar correta.</p>}
            </fieldset>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <h2 className="text-3xl">Revise antes de enviar</h2>
          <ul className="mt-5 divide-y divide-line rounded-xl border border-line bg-surface">
            {ps.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-3"><span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${respondida(p, r) ? 'bg-ok/20 text-ok' : 'bg-outlier/20 text-outlier'}`}>{respondida(p, r) ? <Icon nome="check" tamanho={12} /> : '!'}</span><span className="truncate">{i + 1}. {p.enunciado}</span></span>
                <button onClick={() => setPasso(i)} className="shrink-0 font-semibold text-brand hover:underline">{respondida(p, r) ? 'Editar' : 'Responder'}</button>
              </li>
            ))}
          </ul>
          {faltam.length > 0 && <p role="alert" className="mt-4 rounded-lg border border-outlier/40 bg-outlier/10 px-3 py-2 text-sm">Faltam {faltam.length} {faltam.length === 1 ? 'pergunta' : 'perguntas'} para enviar.</p>}
          {erro && <p role="alert" className="mt-4 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{erro}</p>}
        </section>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button onClick={() => setPasso(Math.max(0, passo - 1))} disabled={passo === 0} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold disabled:opacity-30"><Icon nome="voltar" tamanho={15} /> Anterior</button>
        {passo < n ? (
          <button onClick={() => setPasso(passo + 1)} disabled={!respondida(q!, r) && q!.tipo !== 'texto'} className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-on-brand hover:bg-brand-dark disabled:opacity-40">{passo === n - 1 ? 'Revisar' : 'Próxima'} <Icon nome="avancar" tamanho={15} /></button>
        ) : (
          <button onClick={finalizar} disabled={enviando || faltam.length > 0} aria-busy={enviando} className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-on-brand hover:bg-brand-dark disabled:opacity-40">{enviando && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}{previa ? 'Ver resultado da prévia' : 'Enviar respostas'}</button>
        )}
      </div>
    </div>
  )
}
