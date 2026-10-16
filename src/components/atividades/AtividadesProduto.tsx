import { useCallback, useEffect, useMemo, useState } from 'react'
import { Botao } from '../Botao'
import Campo from '../Campo'
import DataTable, { type Coluna } from '../DataTable'
import { useDialogs } from '../Dialogs'
import Drawer from '../Drawer'
import Icon from '../Icon'
import Menu from '../Menu'
import { Abas, Badge, Vazio } from '../Ui'
import Construtor, { type AulaOpcao } from './Construtor'
import { SeloObrigatoria } from './Selos'
import { type AtividadeForm, type Opcao, type PerguntaForm, type Tipo, TIPOS, formVazio } from '../../lib/atividades'
import { supabase } from '../../lib/supabase'
import { cartao, dataHoraBR } from '../../lib/util'

type Atividade = { id: string; lesson_id: string; titulo: string; descricao: string | null; nota_minima: number; obrigatoria: boolean; tentativas_max: number | null; ordem: number }
type Pergunta = { id: string; activity_id: string; tipo: Tipo; enunciado: string; opcoes: Opcao[]; correta: string[]; explicacao: string | null; pontos: number; ordem: number }
type EnvioProdutor = {
  id: string; activity_id: string; atividade: string; user_id: string; nome: string; email: string; status: 'corrigida' | 'pendente'
  nota: number | null; aprovado: boolean | null; pontos_auto: number; pontos_manual: number | null; pontos_total: number
  respostas: Record<string, string[] | string>; feedback: string | null; tentativa: number; created_at: string
}
type Modulo = { id: string; titulo: string; lessons: { id: string; titulo: string }[] }
type Sub = 'atividades' | 'respostas'

export default function AtividadesProduto({ produtoId, modulos }: { produtoId: string; modulos: Modulo[] }) {
  const { confirmar, avisar } = useDialogs()
  const [sub, setSub] = useState<Sub>('atividades')
  const [atividades, setAtividades] = useState<Atividade[] | null>(null)
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [envios, setEnvios] = useState<EnvioProdutor[]>([])
  const [form, setForm] = useState<AtividadeForm | null>(null)
  const [revisando, setRevisando] = useState<EnvioProdutor | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')

  const aulas: AulaOpcao[] = useMemo(() => modulos.flatMap((m) => m.lessons.map((l) => ({ id: l.id, titulo: l.titulo, modulo: m.titulo }))), [modulos])
  const nomeAula = (id: string) => aulas.find((a) => a.id === id)

  const carregar = useCallback(async () => {
    const ids = aulas.map((a) => a.id)
    const { data: a } = ids.length ? await supabase.from('activities').select('*').in('lesson_id', ids) : { data: [] }
    const lista = ((a ?? []) as Atividade[]).sort((x, y) => x.ordem - y.ordem)
    const { data: q } = lista.length ? await supabase.from('activity_questions').select('*').in('activity_id', lista.map((x) => x.id)) : { data: [] }
    const { data: e } = await supabase.rpc('activity_submissions_owner', { p_product: produtoId })
    setAtividades(lista); setPerguntas(((q ?? []) as Pergunta[]).sort((x, y) => x.ordem - y.ordem)); setEnvios((e ?? []) as EnvioProdutor[])
  }, [aulas, produtoId])
  useEffect(() => { carregar() }, [carregar])

  const pendentes = envios.filter((e) => e.status === 'pendente').length

  function abrirNova(lessonId = '') { setForm(formVazio(lessonId)) }
  function abrirEdicao(a: Atividade) {
    const ps: PerguntaForm[] = perguntas.filter((p) => p.activity_id === a.id).map((p) => ({ id: p.id, existente: true, tipo: p.tipo, enunciado: p.enunciado, opcoes: p.opcoes, correta: p.correta, explicacao: p.explicacao ?? '', pontos: p.pontos }))
    setForm({ id: a.id, titulo: a.titulo, descricao: a.descricao ?? '', lesson_id: a.lesson_id, nota_minima: a.nota_minima, obrigatoria: a.obrigatoria, tentativas_max: a.tentativas_max, perguntas: ps })
  }

  async function salvar(f: AtividadeForm) {
    const campos = { titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, lesson_id: f.lesson_id, nota_minima: f.nota_minima, obrigatoria: f.obrigatoria, tentativas_max: f.tentativas_max }
    let id = f.id
    if (id) {
      const { error } = await supabase.from('activities').update(campos).eq('id', id)
      if (error) return avisar(error.message, true)
    } else {
      const { data, error } = await supabase.from('activities').insert({ ...campos, ordem: (atividades ?? []).length }).select('id')
      if (error) return avisar(error.message, true)
      id = (data as { id: string }[])[0].id
    }
    // preserva os ids das perguntas já existentes (as respostas dos alunos apontam para eles)
    const manter = new Set(f.perguntas.map((p) => p.id))
    for (const antiga of perguntas.filter((p) => p.activity_id === id && !manter.has(p.id))) await supabase.from('activity_questions').delete().eq('id', antiga.id)
    for (const [i, q] of f.perguntas.entries()) {
      const linha = { activity_id: id, tipo: q.tipo, enunciado: q.enunciado.trim(), opcoes: q.opcoes.map((o) => ({ ...o, texto: o.texto.trim() })), correta: q.correta, explicacao: q.explicacao.trim() || null, pontos: q.pontos, ordem: i }
      const { error } = q.existente ? await supabase.from('activity_questions').update(linha).eq('id', q.id) : await supabase.from('activity_questions').insert({ id: q.id, ...linha })
      if (error) return avisar(error.message, true)
    }
    avisar(f.id ? 'Atividade atualizada.' : 'Atividade criada. Ela já aparece para os alunos na aula escolhida.')
    setForm(null); carregar()
  }

  async function apagar(a: Atividade) {
    const n = envios.filter((e) => e.activity_id === a.id).length
    if (!(await confirmar(`Apagar "${a.titulo}"?`, { texto: n ? `As ${n} respostas dos alunos também serão apagadas. Esta ação não pode ser desfeita.` : 'Esta ação não pode ser desfeita.', acao: 'Apagar', perigo: true }))) return
    await supabase.from('activities').delete().eq('id', a.id); avisar('Atividade apagada.'); carregar()
  }

  const stats = (aid: string) => {
    const e = envios.filter((x) => x.activity_id === aid)
    const corrigidos = e.filter((x) => x.nota !== null)
    return { envios: e.length, alunos: new Set(e.map((x) => x.user_id)).size, media: corrigidos.length ? Math.round(corrigidos.reduce((n, x) => n + (x.nota ?? 0), 0) / corrigidos.length) : null, aprovacao: corrigidos.length ? Math.round((corrigidos.filter((x) => x.aprovado).length / corrigidos.length) * 100) : null, pendentes: e.filter((x) => x.status === 'pendente').length }
  }

  const colunas: Coluna<EnvioProdutor>[] = [
    { id: 'aluno', titulo: 'Aluno', valor: (e) => e.nome, render: (e) => <div className="min-w-0"><p className="truncate font-medium">{e.nome}</p><p className="truncate text-xs text-muted">{e.email}</p></div> },
    { id: 'atividade', titulo: 'Atividade', valor: (e) => e.atividade, render: (e) => <span className="block max-w-56 truncate">{e.atividade}</span> },
    { id: 'tent', titulo: 'Tentativa', valor: (e) => e.tentativa, render: (e) => <span className="font-mono">{e.tentativa}</span> },
    { id: 'data', titulo: 'Enviado em', valor: (e) => e.created_at, render: (e) => <span className="whitespace-nowrap text-muted">{dataHoraBR(e.created_at)}</span> },
    { id: 'status', titulo: 'Situação', valor: (e) => e.status, render: (e) => e.status === 'pendente' ? <Badge className="bg-outlier/20 text-outlier">Aguardando correção</Badge> : <Badge className={e.aprovado ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}>{e.aprovado ? 'Aprovado' : 'Não aprovado'}</Badge> },
    { id: 'nota', titulo: 'Nota', valor: (e) => e.nota ?? -1, render: (e) => <span className="font-mono tabular-nums">{e.nota === null ? '—' : `${e.nota}%`}</span> },
  ]
  const enviosFiltrados = envios.filter((e) => !filtroStatus || e.status === filtroStatus)

  if (aulas.length === 0) return <Vazio titulo="Crie uma aula primeiro" texto="As atividades aparecem dentro de uma aula. Adicione módulos e aulas na aba Conteúdo e volte aqui." />

  const comAtividade = modulos.map((m) => ({ ...m, lessons: m.lessons.map((l) => ({ ...l, atividades: (atividades ?? []).filter((a) => a.lesson_id === l.id) })).filter((l) => l.atividades.length) })).filter((m) => m.lessons.length)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Abas ativa={sub} onChange={setSub} abas={[{ id: 'atividades', rotulo: `Atividades (${atividades?.length ?? 0})` }, { id: 'respostas', rotulo: pendentes ? `Respostas (${pendentes} a corrigir)` : `Respostas (${envios.length})` }]} />
        {sub === 'atividades' && <Botao className="mb-6" onClick={() => abrirNova()}><Icon nome="mais" tamanho={16} /> Nova atividade</Botao>}
      </div>

      {sub === 'atividades' && (atividades === null ? <p className="text-muted">Carregando…</p> : atividades.length === 0 ? (
        <div className={`${cartao} px-6 py-12 text-center`}>
          <p className="font-display text-2xl font-bold">Engaje seus alunos com atividades</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Crie quizzes com correção automática ou perguntas abertas que você corrige. Você escolhe a aula, a nota mínima e se a atividade é obrigatória para o certificado.</p>
          <Botao className="mt-5" onClick={() => abrirNova()}>Criar a primeira atividade</Botao>
        </div>
      ) : (
        <div className="space-y-6">
          {comAtividade.map((m) => (
            <section key={m.id} aria-label={m.titulo}><h3 className="mb-3 text-sm text-muted">{m.titulo}</h3>
              <ul className="space-y-3">
                {m.lessons.flatMap((l) => l.atividades.map((a) => {
                  const st = stats(a.id); const nq = perguntas.filter((p) => p.activity_id === a.id)
                  return (
                    <li key={a.id} className={`${cartao} p-5`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0"><p className="text-xs text-muted">Aula: {l.titulo}</p><h4 className="mt-0.5 text-lg">{a.titulo}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><Badge className="bg-wash text-muted">{nq.length} {nq.length === 1 ? 'pergunta' : 'perguntas'}</Badge><Badge className="bg-wash text-muted">Aprovação {a.nota_minima}%</Badge><Badge className="bg-wash text-muted">{a.tentativas_max ? `${a.tentativas_max} ${a.tentativas_max === 1 ? 'tentativa' : 'tentativas'}` : 'Tentativas ilimitadas'}</Badge>{nq.some((p) => p.tipo === 'texto') && <Badge className="bg-wash text-muted">Correção manual</Badge>}{a.obrigatoria && <SeloObrigatoria />}</div></div>
                        <div className="flex items-center gap-2"><Botao tamanho="p" variante="secundario" onClick={() => abrirEdicao(a)}>Editar</Botao>
                          <Menu rotulo={`Ações de ${a.titulo}`} itens={[{ rotulo: 'Ver respostas', onClick: () => { setFiltroStatus(''); setSub('respostas') } }, { rotulo: 'Apagar atividade', onClick: () => apagar(a), perigo: true }]} /></div>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
                        <div><dt className="text-xs text-muted">Alunos</dt><dd className="font-mono text-lg">{st.alunos}</dd></div>
                        <div><dt className="text-xs text-muted">Nota média</dt><dd className="font-mono text-lg">{st.media === null ? '—' : `${st.media}%`}</dd></div>
                        <div><dt className="text-xs text-muted">Aprovação</dt><dd className="font-mono text-lg">{st.aprovacao === null ? '—' : `${st.aprovacao}%`}</dd></div>
                        <div><dt className="text-xs text-muted">A corrigir</dt><dd className={`font-mono text-lg ${st.pendentes ? 'text-outlier' : ''}`}>{st.pendentes}</dd></div>
                      </dl>
                    </li>
                  )
                }))}
              </ul>
            </section>
          ))}
          {aulas.filter((a) => !(atividades ?? []).some((x) => x.lesson_id === a.id)).length > 0 && <p className="text-sm text-muted">Aulas sem atividade: {aulas.filter((a) => !(atividades ?? []).some((x) => x.lesson_id === a.id)).map((a, i, arr) => <span key={a.id}><button onClick={() => abrirNova(a.id)} className="font-semibold text-brand hover:underline">{a.titulo}</button>{i < arr.length - 1 ? ', ' : ''}</span>)}.</p>}
        </div>
      ))}

      {sub === 'respostas' && (
        <DataTable<EnvioProdutor> rotulo="Respostas dos alunos" dados={atividades === null ? null : enviosFiltrados} colunas={colunas} chave={(e) => e.id} onLinha={setRevisando}
          busca={{ placeholder: 'Buscar aluno ou atividade', texto: (e) => `${e.nome} ${e.email} ${e.atividade}` }}
          filtros={<select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} aria-label="Situação" className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"><option value="">Todas as situações</option><option value="pendente">Aguardando correção</option><option value="corrigida">Corrigidas</option></select>}
          acoesLinha={(e) => <Botao tamanho="p" variante={e.status === 'pendente' ? 'primario' : 'terciario'} onClick={() => setRevisando(e)}>{e.status === 'pendente' ? 'Corrigir' : 'Ver'}</Botao>}
          vazio={<Vazio titulo="Nenhuma resposta ainda" texto="Quando os alunos enviarem as atividades, as respostas aparecem aqui. As dissertativas ficam esperando a sua correção." />} />
      )}

      <Construtor aberto={!!form} onFechar={() => setForm(null)} inicial={form ?? formVazio()} aulas={aulas} envios={form?.id ? envios.filter((e) => e.activity_id === form.id).length : 0} onSalvar={salvar} />
      <Revisao envio={revisando} atividade={(atividades ?? []).find((a) => a.id === revisando?.activity_id)} perguntas={perguntas.filter((p) => p.activity_id === revisando?.activity_id)} aula={nomeAula((atividades ?? []).find((a) => a.id === revisando?.activity_id)?.lesson_id ?? '')?.titulo}
        onFechar={() => setRevisando(null)} onCorrigido={() => { setRevisando(null); carregar() }} />
    </div>
  )
}

function Revisao({ envio, atividade, perguntas, aula, onFechar, onCorrigido }: { envio: EnvioProdutor | null; atividade?: Atividade; perguntas: Pergunta[]; aula?: string; onFechar: () => void; onCorrigido: () => void }) {
  const { avisar } = useDialogs()
  const maxManual = perguntas.filter((p) => p.tipo === 'texto').reduce((n, p) => n + p.pontos, 0)
  const [pontos, setPontos] = useState('')
  const [feedback, setFeedback] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  useEffect(() => { setPontos(envio?.pontos_manual != null ? String(envio.pontos_manual) : ''); setFeedback(envio?.feedback ?? ''); setErro('') }, [envio])

  async function corrigir() {
    const n = Number(pontos)
    if (pontos.trim() === '' || !Number.isInteger(n) || n < 0 || n > maxManual) return setErro(`Informe um número inteiro de 0 a ${maxManual}.`)
    setSalvando(true)
    const { error } = await supabase.rpc('grade_submission', { p_submission: envio!.id, p_pontos: n, p_feedback: feedback })
    setSalvando(false)
    if (error) return setErro(error.message)
    avisar('Correção salva. O aluno já vê a nota.'); onCorrigido()
  }

  return (
    <Drawer aberto={!!envio} onFechar={onFechar} largura="max-w-2xl" titulo={envio?.status === 'pendente' ? 'Corrigir respostas' : 'Respostas do aluno'}
      rodape={envio && maxManual > 0 && <><Botao variante="terciario" onClick={onFechar}>Fechar</Botao><Botao carregando={salvando} onClick={corrigir}>{envio.status === 'pendente' ? 'Salvar correção' : 'Atualizar correção'}</Botao></>}>
      {envio && atividade && (
        <div className="space-y-6">
          <div><p className="text-sm text-muted">{envio.nome} · {envio.email}</p><h3 className="mt-1 text-2xl">{atividade.titulo}</h3><p className="text-sm text-muted">{aula ? `Aula: ${aula} · ` : ''}Tentativa {envio.tentativa} · {dataHoraBR(envio.created_at)}</p>
            <div className="mt-3 flex flex-wrap gap-2">{envio.status === 'pendente' ? <Badge className="bg-outlier/20 text-outlier">Aguardando correção</Badge> : <Badge className={envio.aprovado ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}>{envio.aprovado ? 'Aprovado' : 'Não aprovado'} · {envio.nota}%</Badge>}<Badge className="bg-wash text-muted">Automática: {envio.pontos_auto}/{envio.pontos_total - maxManual} pts</Badge></div></div>
          <ol className="space-y-3">
            {perguntas.map((p, i) => {
              const r = envio.respostas[p.id]; const ids = Array.isArray(r) ? r : []
              const texto = (id: string) => p.opcoes.find((o) => o.id === id)?.texto ?? id
              const certa = p.tipo !== 'texto' && [...ids].sort().join('|') === [...p.correta].sort().join('|')
              return (
                <li key={p.id} className={`rounded-xl border p-4 ${p.tipo === 'texto' ? 'border-line bg-surface' : certa ? 'border-ok/40 bg-ok/5' : 'border-bad/40 bg-bad/5'}`}>
                  <p className="text-xs text-muted">{i + 1} · {TIPOS[p.tipo].rotulo} · {p.pontos} {p.pontos === 1 ? 'ponto' : 'pontos'}</p>
                  <p className="mt-1 font-semibold">{p.enunciado}</p>
                  {p.tipo === 'texto' ? <p className="mt-3 whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm">{typeof r === 'string' && r ? r : <span className="text-muted">Sem resposta</span>}</p> : (
                    <dl className="mt-2 space-y-1 text-sm"><div className="flex flex-wrap gap-x-2"><dt className="text-muted">Respondeu:</dt><dd className={certa ? 'text-ok' : 'text-bad'}>{ids.length ? ids.map(texto).join(', ') : 'Sem resposta'}</dd></div>
                      {!certa && <div className="flex flex-wrap gap-x-2"><dt className="text-muted">Correta:</dt><dd className="text-ok">{p.correta.map(texto).join(', ')}</dd></div>}</dl>)}
                  {p.tipo === 'texto' && p.explicacao && <p className="mt-2 text-xs text-muted"><span className="font-semibold">Sua orientação:</span> {p.explicacao}</p>}
                </li>
              )
            })}
          </ol>
          {maxManual > 0 ? (
            <section className="rounded-xl border border-brand/40 bg-brand/5 p-4" aria-label="Correção">
              <h4 className="text-lg">Sua correção</h4>
              <div className="mt-3 grid gap-4 sm:grid-cols-[160px_1fr]">
                <Campo rotulo={`Pontos (0 a ${maxManual})`} erro={erro} obrigatorio>{(p) => <input {...p} inputMode="numeric" value={pontos} onChange={(e) => { setPontos(e.target.value); setErro('') }} className={`${p.className} font-mono`} />}</Campo>
                <Campo rotulo="Comentário para o aluno" dica="Aparece para o aluno junto da nota.">{(p) => <textarea {...p} rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />}</Campo>
              </div>
              {pontos !== '' && Number.isInteger(Number(pontos)) && Number(pontos) >= 0 && Number(pontos) <= maxManual && <p className="mt-3 text-sm text-muted">Nota final: <strong className="font-mono text-ink">{Math.round(((envio.pontos_auto + Number(pontos)) * 100) / envio.pontos_total)}%</strong> · aprovação com {atividade.nota_minima}%.</p>}
            </section>
          ) : <p className="rounded-xl bg-wash p-3 text-sm text-muted">Esta atividade só tem perguntas de marcar. A correção foi automática.</p>}
        </div>
      )}
    </Drawer>
  )
}
