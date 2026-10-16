import { useEffect, useState } from 'react'
import { Botao } from '../Botao'
import Drawer from '../Drawer'
import Icon from '../Icon'
import AtividadePlayer from './Player'
import {
  type AtividadeAluno, type AtividadeForm, type PerguntaForm, type Tipo, TIPOS, corrigirLocal, novaOpcao, novaPergunta, pontosTotais, validar,
} from '../../lib/atividades'
import { campo } from '../../lib/util'

export type AulaOpcao = { id: string; titulo: string; modulo: string }
const MAX_OPCOES = 6

function paraAluno(f: AtividadeForm): AtividadeAluno {
  return {
    id: f.id ?? 'previa', titulo: f.titulo || 'Sem título', descricao: f.descricao || null, nota_minima: f.nota_minima, obrigatoria: f.obrigatoria,
    tentativas_max: f.tentativas_max, tentativas_usadas: 0,
    perguntas: f.perguntas.map((q) => ({ id: q.id, tipo: q.tipo, enunciado: q.enunciado || '(sem enunciado)', opcoes: q.opcoes.filter((o) => o.texto.trim()), pontos: q.pontos })),
  }
}

function EditorPergunta({ q, i, total, erro, onChange, onRemover, onMover, onDuplicar }: {
  q: PerguntaForm; i: number; total: number; erro?: string
  onChange: (q: PerguntaForm) => void; onRemover: () => void; onMover: (d: -1 | 1) => void; onDuplicar: () => void
}) {
  const escolha = q.tipo === 'unica' || q.tipo === 'multipla'
  const marcar = (id: string) => onChange({ ...q, correta: q.tipo === 'unica' ? [id] : q.correta.includes(id) ? q.correta.filter((x) => x !== id) : [...q.correta, id] })
  function mudarTipo(t: Tipo) {
    const base = novaPergunta(t)
    onChange({ ...q, tipo: t, opcoes: t === 'texto' ? [] : t === 'vf' ? base.opcoes : q.opcoes.length >= 2 && (q.tipo === 'unica' || q.tipo === 'multipla') ? q.opcoes : base.opcoes, correta: t === 'vf' ? ['v'] : t === 'unica' ? q.correta.slice(0, 1).filter((c) => q.opcoes.some((o) => o.id === c)) : t === 'multipla' && (q.tipo === 'unica') ? q.correta : [], pontos: t === 'texto' && q.pontos === 1 ? 5 : q.pontos })
  }
  const btn = 'grid size-8 place-items-center rounded-md text-muted hover:bg-wash hover:text-ink disabled:opacity-30'
  return (
    <li className={`rounded-2xl border bg-surface p-5 ${erro ? 'border-bad/60' : 'border-line'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-brand/15 font-mono text-sm text-brand">{i + 1}</span>
          <label className="sr-only" htmlFor={`tipo-${q.id}`}>Tipo da pergunta {i + 1}</label>
          <select id={`tipo-${q.id}`} value={q.tipo} onChange={(e) => mudarTipo(e.target.value as Tipo)} className={`${campo} !w-auto py-1.5`}>{(Object.keys(TIPOS) as Tipo[]).map((t) => <option key={t} value={t}>{TIPOS[t].rotulo}</option>)}</select></div>
        <div className="flex items-center">
          <button type="button" disabled={i === 0} onClick={() => onMover(-1)} aria-label={`Subir pergunta ${i + 1}`} className={btn}><Icon nome="cima" tamanho={15} /></button>
          <button type="button" disabled={i === total - 1} onClick={() => onMover(1)} aria-label={`Descer pergunta ${i + 1}`} className={btn}><Icon nome="baixo" tamanho={15} /></button>
          <button type="button" onClick={onDuplicar} className="rounded-md px-2 py-1.5 text-xs font-medium text-muted hover:bg-wash hover:text-ink">Duplicar</button>
          <button type="button" onClick={onRemover} aria-label={`Remover pergunta ${i + 1}`} className="rounded-md px-2 py-1.5 text-xs font-medium text-muted hover:bg-wash hover:text-bad">Remover</button>
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium">Enunciado<span aria-hidden className="ml-0.5 text-bad">*</span>
        <textarea value={q.enunciado} onChange={(e) => onChange({ ...q, enunciado: e.target.value })} rows={2} placeholder={q.tipo === 'vf' ? 'Escreva a afirmação que o aluno vai julgar' : 'Escreva a pergunta'} className={`${campo} mt-1 w-full font-normal`} /></label>

      {escolha && (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Opções <span className="font-normal text-muted">· marque {q.tipo === 'unica' ? 'a correta' : 'todas as corretas'}</span></legend>
          <ul className="mt-2 space-y-2">
            {q.opcoes.map((o, k) => (
              <li key={o.id} className={`flex items-center gap-3 rounded-xl border p-2 pl-3 ${q.correta.includes(o.id) ? 'border-ok/50 bg-ok/5' : 'border-line'}`}>
                <input type={q.tipo === 'unica' ? 'radio' : 'checkbox'} name={`c-${q.id}`} checked={q.correta.includes(o.id)} onChange={() => marcar(o.id)} aria-label={`Opção ${k + 1} é correta`} className="size-5 shrink-0 accent-brand" />
                <input value={o.texto} onChange={(e) => onChange({ ...q, opcoes: q.opcoes.map((x) => (x.id === o.id ? { ...x, texto: e.target.value } : x)) })} placeholder={`Opção ${k + 1}`} aria-label={`Texto da opção ${k + 1}`} className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none" />
                <button type="button" disabled={q.opcoes.length <= 2} onClick={() => onChange({ ...q, opcoes: q.opcoes.filter((x) => x.id !== o.id), correta: q.correta.filter((c) => c !== o.id) })} aria-label={`Remover opção ${k + 1}`} className={btn}><Icon nome="fechar" tamanho={15} /></button>
              </li>
            ))}
          </ul>
          {q.opcoes.length < MAX_OPCOES && <button type="button" onClick={() => onChange({ ...q, opcoes: [...q.opcoes, novaOpcao()] })} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><Icon nome="mais" tamanho={14} /> Adicionar opção</button>}
        </fieldset>
      )}

      {q.tipo === 'vf' && (
        <fieldset className="mt-4"><legend className="text-sm font-medium">A afirmação é…</legend>
          <div className="mt-2 grid max-w-sm grid-cols-2 gap-2">{[['v', 'Verdadeira'], ['f', 'Falsa']].map(([id, t]) => (
            <label key={id} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold ${q.correta[0] === id ? 'border-ok bg-ok/10 text-ok' : 'border-line'}`}>
              <input type="radio" name={`c-${q.id}`} checked={q.correta[0] === id} onChange={() => onChange({ ...q, correta: [id] })} className="size-4 accent-brand" />{t}</label>))}</div></fieldset>
      )}
      {q.tipo === 'texto' && <p className="mt-4 rounded-xl bg-wash p-3 text-sm text-muted">O aluno escreve livremente. Você corrige depois, na aba <strong className="text-ink">Respostas</strong>, e dá os pontos de 0 a {q.pontos}.</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px]">
        <label className="block text-sm font-medium">{q.tipo === 'texto' ? 'Orientação de correção' : 'Explicação'} <span className="font-normal text-muted">(opcional)</span>
          <textarea value={q.explicacao} onChange={(e) => onChange({ ...q, explicacao: e.target.value })} rows={2} placeholder={q.tipo === 'texto' ? 'O que uma boa resposta deve conter? O aluno vê depois de enviar.' : 'Por que esta é a resposta certa? O aluno vê depois de enviar.'} className={`${campo} mt-1 w-full font-normal`} /></label>
        <label className="block text-sm font-medium">Pontos
          <input type="number" min={1} max={100} value={q.pontos} onChange={(e) => onChange({ ...q, pontos: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} className={`${campo} mt-1 w-full font-mono font-normal`} /></label>
      </div>
      {erro && <p role="alert" className="mt-3 text-sm text-bad">{erro}</p>}
    </li>
  )
}

export default function Construtor({ aberto, onFechar, inicial, aulas, envios, onSalvar }: {
  aberto: boolean; onFechar: () => void; inicial: AtividadeForm; aulas: AulaOpcao[]; envios: number; onSalvar: (f: AtividadeForm) => Promise<void>
}) {
  const [f, setF] = useState<AtividadeForm>(inicial)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [previa, setPrevia] = useState(false)
  const [salvando, setSalvando] = useState(false)
  useEffect(() => { if (aberto) { setF(inicial); setErros({}); setPrevia(false) } }, [aberto, inicial])

  const set = <K extends keyof AtividadeForm>(k: K, v: AtividadeForm[K]) => setF((x) => ({ ...x, [k]: v }))
  const setPergunta = (id: string, q: PerguntaForm) => setF((x) => ({ ...x, perguntas: x.perguntas.map((p) => (p.id === id ? q : p)) }))
  const mover = (i: number, d: -1 | 1) => setF((x) => { const p = [...x.perguntas]; [p[i], p[i + d]] = [p[i + d], p[i]]; return { ...x, perguntas: p } })
  const modulos = [...new Set(aulas.map((a) => a.modulo))]

  async function salvar() {
    const e = validar(f); setErros(e)
    if (Object.keys(e).length) { setPrevia(false); return }
    setSalvando(true)
    try { await onSalvar(f) } finally { setSalvando(false) }
  }
  function abrirPrevia() { const e = validar(f); setErros(e); if (Object.keys(e).length) return; setPrevia(true) }

  return (
    <Drawer aberto={aberto} onFechar={onFechar} largura="max-w-3xl" titulo={inicial.id ? 'Editar atividade' : 'Nova atividade'}
      rodape={previa ? <Botao variante="secundario" onClick={() => setPrevia(false)}>Voltar a editar</Botao> : <>
        <Botao variante="terciario" onClick={onFechar}>Cancelar</Botao>
        <Botao variante="secundario" onClick={abrirPrevia}>Ver como o aluno</Botao>
        <Botao carregando={salvando} onClick={salvar}>Salvar atividade</Botao></>}>
      {previa ? (
        <div>
          <p className="mb-5 rounded-xl border border-dashed border-brand/60 p-3 text-sm text-muted"><strong className="text-brand">Prévia.</strong> É assim que o aluno vê. Suas respostas aqui não são salvas.</p>
          <AtividadePlayer key={JSON.stringify(f.perguntas.length) + f.titulo} previa atividade={paraAluno(f)} enviar={async (r) => corrigirLocal(f, r)} onTentarNovamente={() => setPrevia(false)} />
        </div>
      ) : (
        <div className="space-y-8">
          {envios > 0 && <p role="note" className="rounded-xl border border-outlier/40 bg-outlier/10 p-3 text-sm">Esta atividade já tem <strong>{envios} {envios === 1 ? 'envio' : 'envios'}</strong>. Mudar o gabarito não altera as notas já registradas. Mudanças no enunciado ou nas opções valem só para novos envios.</p>}
          {Object.keys(erros).length > 0 && <div role="alert" className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad"><p className="font-semibold">Corrija antes de salvar:</p><ul className="mt-1 list-inside list-disc">{Object.values(erros).map((m) => <li key={m}>{m}</li>)}</ul></div>}

          <section aria-label="Configurações" className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">Título<span aria-hidden className="ml-0.5 text-bad">*</span>
              <input value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex.: Quiz do módulo 1" aria-invalid={!!erros.titulo} className={`${campo} mt-1 w-full font-normal`} /></label>
            <label className="block text-sm font-medium sm:col-span-2">Instruções <span className="font-normal text-muted">(opcional)</span>
              <textarea value={f.descricao} onChange={(e) => set('descricao', e.target.value)} rows={2} placeholder="O que o aluno deve fazer e como será avaliado" className={`${campo} mt-1 w-full font-normal`} /></label>
            <label className="block text-sm font-medium">Aparece na aula<span aria-hidden className="ml-0.5 text-bad">*</span>
              <select value={f.lesson_id} onChange={(e) => set('lesson_id', e.target.value)} aria-invalid={!!erros.lesson_id} className={`${campo} mt-1 w-full font-normal`}>
                <option value="">Escolha a aula</option>{modulos.map((m) => <optgroup key={m} label={m}>{aulas.filter((a) => a.modulo === m).map((a) => <option key={a.id} value={a.id}>{a.titulo}</option>)}</optgroup>)}</select></label>
            <label className="block text-sm font-medium">Tentativas permitidas
              <select value={f.tentativas_max ?? ''} onChange={(e) => set('tentativas_max', e.target.value ? Number(e.target.value) : null)} className={`${campo} mt-1 w-full font-normal`}>
                <option value="">Ilimitadas</option>{[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'tentativa' : 'tentativas'}</option>)}</select></label>
            <label className="block text-sm font-medium">Nota mínima para aprovação: <span className="font-mono text-brand">{f.nota_minima}%</span>
              <input type="range" min={0} max={100} step={5} value={f.nota_minima} onChange={(e) => set('nota_minima', Number(e.target.value))} className="mt-3 w-full accent-brand" /></label>
            <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm sm:self-end"><input type="checkbox" checked={f.obrigatoria} onChange={(e) => set('obrigatoria', e.target.checked)} className="mt-0.5 size-5 accent-brand" />
              <span><span className="font-semibold">Obrigatória para o certificado</span><span className="mt-0.5 block text-muted">O aluno só emite o certificado depois de ser aprovado nesta atividade.</span></span></label>
          </section>

          <section aria-label="Perguntas">
            <div className="flex flex-wrap items-end justify-between gap-2"><h3 className="text-xl">Perguntas <span className="font-mono text-base text-muted">({f.perguntas.length})</span></h3><p className="text-sm text-muted">Total: <span className="font-mono text-ink">{pontosTotais(f.perguntas)}</span> pontos</p></div>
            {erros.perguntas && <p role="alert" className="mt-2 text-sm text-bad">{erros.perguntas}</p>}
            <ol className="mt-4 space-y-4">
              {f.perguntas.map((q, i) => (
                <EditorPergunta key={q.id} q={q} i={i} total={f.perguntas.length} erro={erros[`q:${q.id}`]} onChange={(n) => setPergunta(q.id, n)}
                  onRemover={() => setF((x) => ({ ...x, perguntas: x.perguntas.filter((p) => p.id !== q.id) }))} onMover={(d) => mover(i, d)}
                  onDuplicar={() => setF((x) => { const c = { ...q, id: crypto.randomUUID(), existente: false, opcoes: q.opcoes.map((o) => (q.tipo === 'vf' ? o : { ...o, id: crypto.randomUUID().slice(0, 6) })) }; c.correta = q.tipo === 'vf' ? q.correta : q.correta.map((cid) => c.opcoes[q.opcoes.findIndex((o) => o.id === cid)]?.id).filter(Boolean) as string[]; const p = [...x.perguntas]; p.splice(i + 1, 0, c); return { ...x, perguntas: p } })} />
              ))}
            </ol>
            <div className="mt-4 rounded-2xl border border-dashed border-line p-4"><p className="mb-3 text-sm font-medium">Adicionar pergunta</p>
              <div className="flex flex-wrap gap-2">{(Object.keys(TIPOS) as Tipo[]).map((t) => (
                <button key={t} type="button" onClick={() => setF((x) => ({ ...x, perguntas: [...x.perguntas, novaPergunta(t)] }))} className="rounded-lg border border-line px-3.5 py-2 text-left text-sm hover:border-brand"><span className="block font-semibold">{TIPOS[t].rotulo}</span><span className="text-xs text-muted">{TIPOS[t].dica}</span></button>))}</div></div>
          </section>
        </div>
      )}
    </Drawer>
  )
}
