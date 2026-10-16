import { estadoDe, type EstadoAtividade, type Envio } from './atividades'
import { supabase } from './supabase'

export type AtividadeResumo = { id: string; titulo: string; obrigatoria: boolean; nota_minima: number; tentativas_max: number | null; estado: EstadoAtividade }
export type Episodio = { id: string; titulo: string; ordem: number; video_url: string | null; conteudo: string | null; n: number; moduloId: string; moduloTitulo: string; atividades: AtividadeResumo[] }
export type Modulo = { id: string; titulo: string; ordem: number; episodios: Episodio[] }
export type CursoEstudo = {
  id: string; titulo: string; slug: string; descricao: string | null; capa_url: string | null; categoria: string | null
  modulos: Modulo[]; episodios: Episodio[]; feitas: Set<string>; pct: number; proximo: Episodio | null; ultimoEm: string | null
  /** atividades obrigatórias ainda sem aprovação (bloqueiam o certificado) */
  obrigatoriasPendentes: AtividadeResumo[]
}

type Linha = { id: string; titulo: string; slug: string; descricao: string | null; capa_url: string | null; categoria: string | null }

/** Cursos em que o usuário está matriculado, com episódios numerados e o próximo a assistir. */
export async function carregarCursos(): Promise<CursoEstudo[]> {
  const { data: e } = await supabase.from('enrollments').select('products(id, titulo, slug, descricao, capa_url, categoria)')
  const prods = (e ?? []).flatMap((r) => r.products as unknown as Linha[]).filter(Boolean)
  if (!prods.length) return []
  const [{ data: m }, { data: pr }] = await Promise.all([
    supabase.from('modules').select('id, product_id, titulo, ordem, lessons(id, titulo, ordem, video_url, conteudo)').in('product_id', prods.map((p) => p.id)),
    supabase.from('lesson_progress').select('lesson_id, concluida_em'),
  ])
  const { data: sessao } = await supabase.auth.getSession()
  const meuId = sessao.session?.user.id
  const todasAulas = ((m ?? []) as { lessons: { id: string }[] }[]).flatMap((x) => x.lessons.map((l) => l.id))
  const { data: ativs } = todasAulas.length ? await supabase.from('activities').select('id, lesson_id, titulo, obrigatoria, nota_minima, tentativas_max, ordem').in('lesson_id', todasAulas) : { data: [] }
  const { data: envs } = meuId && ativs?.length ? await supabase.from('activity_submissions').select('id, activity_id, status, nota, aprovado, tentativa, feedback, created_at').eq('user_id', meuId) : { data: [] }
  const porAula = new Map<string, AtividadeResumo[]>()
  for (const a of ((ativs ?? []) as { id: string; lesson_id: string; titulo: string; obrigatoria: boolean; nota_minima: number; tentativas_max: number | null; ordem: number }[]).sort((x, y) => x.ordem - y.ordem)) {
    const estado = estadoDe(((envs ?? []) as Envio[]).filter((e) => e.activity_id === a.id))
    porAula.set(a.lesson_id, [...(porAula.get(a.lesson_id) ?? []), { id: a.id, titulo: a.titulo, obrigatoria: a.obrigatoria, nota_minima: a.nota_minima, tentativas_max: a.tentativas_max, estado }])
  }
  const progresso = new Map((pr ?? []).map((x: { lesson_id: string; concluida_em: string }) => [x.lesson_id, x.concluida_em]))
  type M = { id: string; product_id: string; titulo: string; ordem: number; lessons: { id: string; titulo: string; ordem: number; video_url: string | null; conteudo: string | null }[] }

  return prods.map((p) => {
    let n = 0
    const modulos: Modulo[] = ((m ?? []) as M[]).filter((x) => x.product_id === p.id).sort((a, b) => a.ordem - b.ordem).map((x) => ({
      id: x.id, titulo: x.titulo, ordem: x.ordem,
      episodios: [...x.lessons].sort((a, b) => a.ordem - b.ordem).map((l) => ({ ...l, n: ++n, moduloId: x.id, moduloTitulo: x.titulo, atividades: porAula.get(l.id) ?? [] })),
    }))
    const episodios = modulos.flatMap((x) => x.episodios)
    const feitas = new Set(episodios.filter((ep) => progresso.has(ep.id)).map((ep) => ep.id))
    const datas = episodios.map((ep) => progresso.get(ep.id)).filter(Boolean) as string[]
    return {
      ...p, modulos, episodios, feitas,
      pct: episodios.length ? Math.round((feitas.size / episodios.length) * 100) : 0,
      proximo: episodios.find((ep) => !feitas.has(ep.id)) ?? null,
      ultimoEm: datas.sort().at(-1) ?? null,
      obrigatoriasPendentes: episodios.flatMap((ep) => ep.atividades).filter((a) => a.obrigatoria && a.estado.estado !== 'aprovado'),
    }
  })
}
