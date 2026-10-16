export type Tipo = 'unica' | 'multipla' | 'vf' | 'texto'
export type Opcao = { id: string; texto: string }

export const TIPOS: Record<Tipo, { rotulo: string; dica: string }> = {
  unica: { rotulo: 'Única escolha', dica: 'O aluno marca uma opção' },
  multipla: { rotulo: 'Múltipla escolha', dica: 'O aluno marca todas as corretas' },
  vf: { rotulo: 'Verdadeiro ou falso', dica: 'Uma afirmação para julgar' },
  texto: { rotulo: 'Dissertativa', dica: 'Resposta escrita, corrigida por você' },
}

/** Pergunta como o produtor edita (com gabarito). */
export type PerguntaForm = { id: string; existente: boolean; tipo: Tipo; enunciado: string; opcoes: Opcao[]; correta: string[]; explicacao: string; pontos: number }
export type AtividadeForm = {
  id?: string; titulo: string; descricao: string; lesson_id: string; nota_minima: number; obrigatoria: boolean; tentativas_max: number | null; perguntas: PerguntaForm[]
}

/** Pergunta como o aluno recebe: sem gabarito. */
export type PerguntaAluno = { id: string; tipo: Tipo; enunciado: string; opcoes: Opcao[]; pontos: number }
export type AtividadeAluno = {
  id: string; titulo: string; descricao: string | null; nota_minima: number; obrigatoria: boolean
  tentativas_max: number | null; tentativas_usadas: number; perguntas: PerguntaAluno[]
}
export type Respostas = Record<string, string[] | string>
export type Detalhe = { pergunta_id: string; correta: boolean | null; esperado?: string[]; explicacao?: string | null }
export type Resultado = { submission_id?: string; status: 'corrigida' | 'pendente'; nota: number | null; aprovado: boolean | null; tentativa: number; detalhes: Detalhe[] }

export type Envio = {
  id: string; activity_id: string; status: 'corrigida' | 'pendente'; nota: number | null; aprovado: boolean | null; tentativa: number
  feedback: string | null; created_at: string
}

const novoId = () => crypto.randomUUID()
const idOpcao = () => crypto.randomUUID().slice(0, 6)

export function novaPergunta(tipo: Tipo): PerguntaForm {
  const base = { id: novoId(), existente: false, tipo, enunciado: '', explicacao: '', pontos: tipo === 'texto' ? 5 : 1 }
  if (tipo === 'vf') return { ...base, opcoes: [{ id: 'v', texto: 'Verdadeiro' }, { id: 'f', texto: 'Falso' }], correta: ['v'] }
  if (tipo === 'texto') return { ...base, opcoes: [], correta: [] }
  return { ...base, opcoes: [{ id: idOpcao(), texto: '' }, { id: idOpcao(), texto: '' }], correta: [] }
}
export const novaOpcao = (): Opcao => ({ id: idOpcao(), texto: '' })

export const formVazio = (lessonId = ''): AtividadeForm => ({ titulo: '', descricao: '', lesson_id: lessonId, nota_minima: 70, obrigatoria: false, tentativas_max: null, perguntas: [novaPergunta('unica')] })

/** Regras de validação do construtor; devolve um mapa de mensagens por campo ("titulo", "lesson_id", "perguntas", "q:<id>"). */
export function validar(f: AtividadeForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (f.titulo.trim().length < 3) e.titulo = 'Dê um título com pelo menos 3 caracteres.'
  if (!f.lesson_id) e.lesson_id = 'Escolha a aula em que a atividade aparece.'
  if (f.perguntas.length === 0) e.perguntas = 'Adicione pelo menos uma pergunta.'
  for (const [i, q] of f.perguntas.entries()) {
    const n = `Pergunta ${i + 1}`
    if (!q.enunciado.trim()) { e[`q:${q.id}`] = `${n}: escreva o enunciado.`; continue }
    if (q.tipo === 'unica' || q.tipo === 'multipla') {
      const preenchidas = q.opcoes.filter((o) => o.texto.trim())
      if (preenchidas.length < 2) { e[`q:${q.id}`] = `${n}: informe pelo menos duas opções.`; continue }
      if (q.opcoes.some((o) => !o.texto.trim())) { e[`q:${q.id}`] = `${n}: há opções em branco. Preencha ou remova.`; continue }
      if (q.correta.length === 0) e[`q:${q.id}`] = `${n}: marque a resposta correta.`
      else if (q.tipo === 'unica' && q.correta.length > 1) e[`q:${q.id}`] = `${n}: única escolha aceita apenas uma resposta correta.`
    }
    if (q.tipo === 'vf' && q.correta.length !== 1) e[`q:${q.id}`] = `${n}: indique se a afirmação é verdadeira ou falsa.`
  }
  return e
}

export const pontosTotais = (ps: { pontos: number }[]) => ps.reduce((n, p) => n + p.pontos, 0)
const chave = (v: unknown) => (Array.isArray(v) ? [...v].map(String).sort().join('|') : '')

/** Correção local, usada só na prévia do produtor (a correção real acontece no servidor). */
export function corrigirLocal(f: AtividadeForm, r: Respostas): Resultado {
  let total = 0, auto = 0, temTexto = false
  const detalhes: Detalhe[] = f.perguntas.map((q) => {
    total += q.pontos
    if (q.tipo === 'texto') { temTexto = true; return { pergunta_id: q.id, correta: null, explicacao: q.explicacao || null } }
    const ok = chave(r[q.id]) === chave(q.correta)
    if (ok) auto += q.pontos
    return { pergunta_id: q.id, correta: ok, esperado: q.correta, explicacao: q.explicacao || null }
  })
  if (temTexto) return { status: 'pendente', nota: null, aprovado: null, tentativa: 1, detalhes }
  const nota = Math.round((auto * 100) / Math.max(total, 1))
  return { status: 'corrigida', nota, aprovado: nota >= f.nota_minima, tentativa: 1, detalhes }
}

export type EstadoAtividade = { estado: 'nova' | 'pendente' | 'aprovado' | 'reprovado'; melhorNota: number | null; tentativas: number }

/** Situação do aluno em uma atividade, a partir dos envios dele. */
export function estadoDe(envios: Envio[]): EstadoAtividade {
  if (envios.length === 0) return { estado: 'nova', melhorNota: null, tentativas: 0 }
  const notas = envios.map((e) => e.nota).filter((n): n is number => n !== null)
  const melhorNota = notas.length ? Math.max(...notas) : null
  if (envios.some((e) => e.aprovado)) return { estado: 'aprovado', melhorNota, tentativas: envios.length }
  const ultima = [...envios].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
  return { estado: ultima.status === 'pendente' ? 'pendente' : 'reprovado', melhorNota, tentativas: envios.length }
}
