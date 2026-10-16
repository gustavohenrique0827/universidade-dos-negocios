import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Botao } from '../../components/Botao'
import CartaoCurso from '../../components/CartaoCurso'
import Capa from '../../components/Capa'
import { useDialogs } from '../../components/Dialogs'
import { EsqueletoPainel } from '../../components/Esqueleto'
import Icon from '../../components/Icon'
import AtividadesProduto from '../../components/atividades/AtividadesProduto'
import { Abas, Badge } from '../../components/Ui'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { brl, campo, cartao, TAXA_PLATAFORMA } from '../../lib/util'

type Aula = { id: string; titulo: string; video_url: string | null; conteudo: string | null; ordem: number }
type Modulo = { id: string; titulo: string; ordem: number; lessons: Aula[] }
type Produto = {
  titulo: string; slug: string; descricao: string | null; descricao_longa: string | null; capa_url: string | null; categoria: string | null
  preco_centavos: number; publicado: boolean; comissao_afiliado_pct: number; garantia_dias: number; parcelas_max: number
  bump_titulo: string | null; bump_descricao: string | null; bump_preco_centavos: number | null
}
type Aba = 'geral' | 'conteudo' | 'atividades' | 'oferta' | 'afiliacao'

const CATEGORIAS = ['Empreendedorismo', 'Vendas', 'Marketing', 'Finanças', 'Negócios', 'Tecnologia', 'Desenvolvimento pessoal']
const CAMPOS_SALVOS = ['titulo', 'descricao', 'descricao_longa', 'categoria', 'preco_centavos', 'comissao_afiliado_pct', 'publicado', 'garantia_dias', 'parcelas_max', 'bump_titulo', 'bump_descricao', 'bump_preco_centavos'] as const
const instantaneo = (p: Produto) => JSON.stringify(CAMPOS_SALVOS.map((k) => p[k]))

function Rotulo({ texto, children, dica, obrigatorio }: { texto: string; children: ReactNode; dica?: string; obrigatorio?: boolean }) {
  return <label className="block text-sm font-medium">{texto}{obrigatorio && <span aria-hidden className="ml-0.5 text-bad">*</span>}<div className="mt-1 font-normal">{children}</div>{dica && <p className="mt-1 text-xs font-normal text-muted">{dica}</p>}</label>
}

export default function ProdutoEditor() {
  const { id } = useParams()
  const { confirmar, perguntar, avisar } = useDialogs()
  const [aba, setAba] = useState<Aba>('geral')
  const [p, setP] = useState<Produto | null>(null)
  const [original, setOriginal] = useState('')
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [novoModulo, setNovoModulo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const [{ data: pr }, { data: m }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id!).single(),
      supabase.from('modules').select('id, titulo, ordem, lessons(id, titulo, video_url, conteudo, ordem)').eq('product_id', id!).order('ordem'),
    ])
    setModulos(((m ?? []) as Modulo[]).map((x) => ({ ...x, lessons: [...x.lessons].sort((a, b) => a.ordem - b.ordem) })))
    // só substitui o formulário se não houver edição em andamento
    setP((atual) => { if (atual) return atual; setOriginal(instantaneo(pr as Produto)); return pr as Produto | null })
  }, [id])
  useEffect(() => { carregar() }, [carregar])

  const sujo = !!p && instantaneo(p) !== original
  useEffect(() => {
    if (!sujo) return
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [sujo])

  const aulas = useMemo(() => modulos.flatMap((m) => m.lessons), [modulos])
  const semVideo = aulas.filter((a) => !a.video_url).length
  useTitulo(p?.titulo)

  if (!p) return <EsqueletoPainel />
  const set = <K extends keyof Produto>(k: K, v: Produto[K]) => setP({ ...p, [k]: v })

  const requisitos = [
    { ok: p.titulo.trim().length >= 3 && !!p.descricao?.trim(), rotulo: 'Nome e descrição curta', obrigatorio: true, aba: 'geral' as Aba },
    { ok: aulas.length > 0, rotulo: 'Pelo menos uma aula', obrigatorio: true, aba: 'conteudo' as Aba },
    { ok: !!p.capa_url, rotulo: 'Capa do produto', obrigatorio: false, aba: 'geral' as Aba },
    { ok: aulas.length > 0 && semVideo === 0, rotulo: 'Vídeo em todas as aulas', obrigatorio: false, aba: 'conteudo' as Aba },
    { ok: !!p.descricao_longa?.trim(), rotulo: 'Texto da página de vendas', obrigatorio: false, aba: 'geral' as Aba },
  ]
  const prontoParaPublicar = requisitos.filter((r) => r.obrigatorio).every((r) => r.ok)
  const feitos = requisitos.filter((r) => r.ok).length

  async function salvar() {
    setSalvando(true)
    const { error } = await supabase.from('products').update({
      titulo: p!.titulo, descricao: p!.descricao, descricao_longa: p!.descricao_longa, categoria: p!.categoria, preco_centavos: p!.preco_centavos,
      comissao_afiliado_pct: p!.comissao_afiliado_pct, publicado: p!.publicado, garantia_dias: p!.garantia_dias, parcelas_max: p!.parcelas_max,
      bump_titulo: p!.bump_titulo || null, bump_descricao: p!.bump_descricao || null, bump_preco_centavos: p!.bump_titulo ? p!.bump_preco_centavos ?? 0 : null,
    }).eq('id', id!)
    setSalvando(false)
    if (error) return avisar(error.message, true)
    setOriginal(instantaneo(p!)); avisar('Alterações salvas.')
  }

  function alternarPublicado(v: boolean) {
    if (v && !prontoParaPublicar) return avisar('Complete os itens obrigatórios do checklist antes de publicar.', true)
    set('publicado', v)
  }

  async function enviarCapa(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const path = `${id}/${Date.now()}-${f.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await supabase.storage.from('capas').upload(path, f)
    if (error) return avisar(error.message, true)
    const url = supabase.storage.from('capas').getPublicUrl(path).data.publicUrl
    await supabase.from('products').update({ capa_url: url }).eq('id', id!)
    setP((x) => (x ? { ...x, capa_url: url } : x)); avisar('Capa atualizada.')
  }

  async function addModulo() {
    if (!novoModulo.trim()) return
    await supabase.from('modules').insert({ product_id: id, titulo: novoModulo.trim(), ordem: modulos.length })
    setNovoModulo(''); carregar()
  }
  async function addAula(m: Modulo) {
    const titulo = await perguntar('Nova aula', 'Título da aula', { acao: 'Adicionar' }); if (!titulo) return
    await supabase.from('lessons').insert({ module_id: m.id, titulo, ordem: m.lessons.length }); carregar()
  }
  async function renomear(tabela: 'modules' | 'lessons', rowId: string, atual: string) {
    const t = await perguntar('Renomear', 'Novo título', { inicial: atual }); if (!t || t === atual) return
    await supabase.from(tabela).update({ titulo: t }).eq('id', rowId); carregar()
  }
  async function mover(tabela: 'modules' | 'lessons', lista: { id: string; ordem: number }[], i: number, dir: -1 | 1) {
    const a = lista[i], b = lista[i + dir]; if (!a || !b) return
    await Promise.all([supabase.from(tabela).update({ ordem: b.ordem }).eq('id', a.id), supabase.from(tabela).update({ ordem: a.ordem }).eq('id', b.id)]); carregar()
  }
  async function apagar(tabela: 'modules' | 'lessons', rowId: string, nome: string) {
    if (!(await confirmar(`Apagar "${nome}"?`, { texto: 'Esta ação não pode ser desfeita.', acao: 'Apagar', perigo: true }))) return
    await supabase.from(tabela).delete().eq('id', rowId); carregar()
  }
  async function definirVideo(a: Aula, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const path = `${id}/${a.id}-${f.name.replace(/[^\w.-]/g, '_')}`
    avisar('Enviando vídeo…')
    const { error } = await supabase.storage.from('aulas').upload(path, f, { upsert: true })
    if (error) return avisar(error.message, true)
    await supabase.from('lessons').update({ video_url: path }).eq('id', a.id); avisar('Vídeo enviado.'); carregar()
  }
  async function editarTexto(a: Aula) {
    const t = await perguntar('Texto de apoio', 'Conteúdo exibido abaixo do vídeo', { inicial: a.conteudo ?? '', multilinha: true }); if (t === null) return
    await supabase.from('lessons').update({ conteudo: t || null }).eq('id', a.id); carregar()
  }

  const preco = p.preco_centavos
  const base = `${location.origin}/p/${p.slug}`
  const botaoSec = 'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand'

  return (
    <>
      <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/painel/produtos" className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon nome="voltar" tamanho={14} /> Produtos</Link>
            <div className="flex items-center gap-3"><h1 className="truncate text-2xl sm:text-3xl">{p.titulo || 'Sem nome'}</h1><Badge className={p.publicado ? 'bg-ok/10 text-ok' : 'bg-wash text-muted'}>{p.publicado ? 'Publicado' : 'Rascunho'}</Badge></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sujo && <span role="status" className="flex items-center gap-1.5 text-sm text-outlier"><span className="size-2 rounded-full bg-outlier" aria-hidden /> Alterações não salvas</span>}
            <Link to={`/p/${p.slug}`} className={botaoSec}>Ver página de vendas</Link>
            <Botao carregando={salvando} disabled={!sujo} onClick={salvar}>Salvar</Botao>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Abas ativa={aba} onChange={setAba} abas={[{ id: 'geral', rotulo: 'Geral' }, { id: 'conteudo', rotulo: `Conteúdo (${aulas.length})` }, { id: 'atividades', rotulo: 'Atividades' }, { id: 'oferta', rotulo: 'Preço e oferta' }, { id: 'afiliacao', rotulo: 'Afiliação e links' }]} />

          {aba === 'geral' && (
            <div className="space-y-5">
              <section className={`${cartao} space-y-4 p-5`}>
                <h2 className="text-lg">Informações básicas</h2>
                <Rotulo texto="Nome do produto" obrigatorio><input className={`${campo} w-full`} value={p.titulo} onChange={(e) => set('titulo', e.target.value)} /></Rotulo>
                <Rotulo texto="Descrição curta" obrigatorio dica="Aparece nos cards da loja. Até 140 caracteres."><input className={`${campo} w-full`} value={p.descricao ?? ''} onChange={(e) => set('descricao', e.target.value)} maxLength={140} /></Rotulo>
                <Rotulo texto="Categoria" dica="Ajuda os alunos a encontrar seu produto."><select className={`${campo} w-full`} value={p.categoria ?? ''} onChange={(e) => set('categoria', e.target.value || null)}><option value="">Sem categoria</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></Rotulo>
              </section>
              <section className={`${cartao} space-y-4 p-5`}>
                <h2 className="text-lg">Página de vendas</h2>
                <Rotulo texto="Texto de apresentação" dica="Conte a transformação que o aluno terá. Use linhas em branco para separar parágrafos."><textarea className={`${campo} h-48 w-full`} value={p.descricao_longa ?? ''} onChange={(e) => set('descricao_longa', e.target.value)} /></Rotulo>
              </section>
              <section className={`${cartao} flex flex-wrap items-center gap-5 p-5`}>
                <div className="w-48 overflow-hidden rounded-xl"><Capa url={p.capa_url} titulo={p.titulo} /></div>
                <div><h2 className="text-lg">Capa</h2><p className="mt-1 text-sm text-muted">Proporção 16:9, a partir de 1280×720.</p>
                  <label className={`${botaoSec} mt-3 cursor-pointer`}>{p.capa_url ? 'Trocar capa' : 'Enviar capa'}<input type="file" accept="image/*" onChange={enviarCapa} className="sr-only" /></label></div>
              </section>
            </div>
          )}

          {aba === 'conteudo' && (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Módulos', modulos.length], ['Aulas', aulas.length], ['Com vídeo', aulas.length - semVideo], ['Sem vídeo', semVideo]].map(([t, v]) => (
                  <div key={t as string} className={`${cartao} p-4`}><dt className="text-xs text-muted">{t}</dt><dd className={`mt-1 font-mono text-2xl ${t === 'Sem vídeo' && semVideo > 0 ? 'text-outlier' : ''}`}>{v}</dd></div>
                ))}
              </dl>
              {modulos.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">Comece criando o primeiro módulo abaixo. Cada módulo agrupa aulas de um mesmo tema.</p>}
              {(() => { let n = 0; return modulos.map((m, mi) => (
                <section key={m.id} className={`${cartao} p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg"><span className="mr-2 font-mono text-sm text-muted">Módulo {mi + 1}</span>{m.titulo}</h3>
                    <div className="flex items-center gap-1 text-muted">
                      <button disabled={mi === 0} onClick={() => mover('modules', modulos, mi, -1)} aria-label="Mover módulo para cima" className="rounded p-1.5 hover:bg-wash hover:text-ink disabled:opacity-30"><Icon nome="cima" tamanho={15} /></button>
                      <button disabled={mi === modulos.length - 1} onClick={() => mover('modules', modulos, mi, 1)} aria-label="Mover módulo para baixo" className="rounded p-1.5 hover:bg-wash hover:text-ink disabled:opacity-30"><Icon nome="baixo" tamanho={15} /></button>
                      <button onClick={() => renomear('modules', m.id, m.titulo)} className="rounded px-2 py-1 text-xs font-medium hover:bg-wash hover:text-ink">Renomear</button>
                      <button onClick={() => apagar('modules', m.id, m.titulo)} className="rounded px-2 py-1 text-xs font-medium hover:bg-wash hover:text-bad">Apagar</button>
                    </div>
                  </div>
                  <ul className="mt-3 divide-y divide-line">
                    {m.lessons.map((a, ai) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                        <span className="flex min-w-0 items-center gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-wash font-mono text-[11px] text-muted">{++n}</span><span className="truncate font-medium">{a.titulo}</span>{a.video_url ? <Badge className="bg-ok/10 text-ok">vídeo</Badge> : <Badge className="bg-outlier/20 text-outlier">sem vídeo</Badge>}</span>
                        <span className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted">
                          <label className="cursor-pointer rounded px-2 py-1 text-brand hover:bg-brand/10">{a.video_url ? 'Trocar vídeo' : 'Enviar vídeo'}<input type="file" accept="video/*" onChange={(e) => definirVideo(a, e)} className="sr-only" /></label>
                          <button onClick={() => editarTexto(a)} className="rounded px-2 py-1 hover:bg-wash hover:text-ink">Texto</button>
                          <button disabled={ai === 0} onClick={() => mover('lessons', m.lessons, ai, -1)} aria-label="Mover aula para cima" className="rounded p-1.5 hover:bg-wash hover:text-ink disabled:opacity-30"><Icon nome="cima" tamanho={14} /></button>
                          <button disabled={ai === m.lessons.length - 1} onClick={() => mover('lessons', m.lessons, ai, 1)} aria-label="Mover aula para baixo" className="rounded p-1.5 hover:bg-wash hover:text-ink disabled:opacity-30"><Icon nome="baixo" tamanho={14} /></button>
                          <button onClick={() => renomear('lessons', a.id, a.titulo)} className="rounded px-2 py-1 hover:bg-wash hover:text-ink">Renomear</button>
                          <button onClick={() => apagar('lessons', a.id, a.titulo)} className="rounded px-2 py-1 hover:bg-wash hover:text-bad">Apagar</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => addAula(m)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><Icon nome="mais" tamanho={15} /> Adicionar aula</button>
                </section>
              )) })()}
              <div className="flex gap-2"><input className={`${campo} flex-1`} placeholder="Nome do novo módulo" aria-label="Nome do novo módulo" value={novoModulo} onChange={(e) => setNovoModulo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addModulo()} /><Botao onClick={addModulo}>Adicionar módulo</Botao></div>
            </div>
          )}

          {aba === 'atividades' && <AtividadesProduto produtoId={id!} modulos={modulos} />}

          {aba === 'oferta' && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className={`${cartao} space-y-4 p-5`}>
                <h2 className="text-lg">Preço</h2>
                <Rotulo texto="Preço (R$)" dica="Use 0 para um produto gratuito."><input type="number" min={0} step="0.01" className={`${campo} w-full`} value={preco / 100} onChange={(e) => set('preco_centavos', Math.round(Number(e.target.value) * 100))} /></Rotulo>
                <Rotulo texto="Parcelamento máximo no cartão"><select className={`${campo} w-full`} value={p.parcelas_max} onChange={(e) => set('parcelas_max', Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n === 1 ? 'À vista' : `Até ${n}x`}</option>)}</select></Rotulo>
                <Rotulo texto="Garantia" dica="O valor das vendas fica 'a liberar' durante a garantia."><select className={`${campo} w-full`} value={p.garantia_dias} onChange={(e) => set('garantia_dias', Number(e.target.value))}>{[0, 7, 14, 21, 30].map((d) => <option key={d} value={d}>{d === 0 ? 'Sem garantia' : `${d} dias`}</option>)}</select></Rotulo>
                <dl className="rounded-xl bg-wash p-4 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Preço de venda</dt><dd className="font-mono">{brl(preco)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Taxa da plataforma ({(TAXA_PLATAFORMA * 100).toFixed(1).replace('.', ',')}%)</dt><dd className="font-mono">− {brl(Math.ceil(preco * TAXA_PLATAFORMA))}</dd></div>
                  <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><dt>Você recebe</dt><dd className="font-mono">{brl(Math.floor(preco * (1 - TAXA_PLATAFORMA)))}</dd></div>
                </dl>
              </section>
              <section className={`${cartao} space-y-4 p-5`}>
                <h2 className="text-lg">Oferta adicional no checkout</h2>
                <p className="text-sm text-muted">Uma oferta marcada com um clique, logo antes de pagar. Costuma aumentar o ticket médio.</p>
                <Rotulo texto="Título da oferta"><input className={`${campo} w-full`} placeholder="Ex.: Planilha de fluxo de caixa" value={p.bump_titulo ?? ''} onChange={(e) => set('bump_titulo', e.target.value || null)} /></Rotulo>
                <Rotulo texto="Descrição"><input className={`${campo} w-full`} value={p.bump_descricao ?? ''} onChange={(e) => set('bump_descricao', e.target.value || null)} disabled={!p.bump_titulo} /></Rotulo>
                <Rotulo texto="Preço adicional (R$)"><input type="number" min={0} step="0.01" className={`${campo} w-full`} value={(p.bump_preco_centavos ?? 0) / 100} onChange={(e) => set('bump_preco_centavos', Math.round(Number(e.target.value) * 100))} disabled={!p.bump_titulo} /></Rotulo>
              </section>
            </div>
          )}

          {aba === 'afiliacao' && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className={`${cartao} space-y-4 p-5`}>
                <h2 className="text-lg">Programa de afiliados</h2>
                <Rotulo texto="Comissão (%)" dica="Com 0, o produto não aparece no marketplace de afiliação."><input type="number" min={0} max={90} className={`${campo} w-full`} value={p.comissao_afiliado_pct} onChange={(e) => set('comissao_afiliado_pct', Number(e.target.value))} /></Rotulo>
                {p.comissao_afiliado_pct > 0 && <p className="rounded-xl bg-wash p-4 text-sm">Em uma venda de {brl(preco)}, o afiliado ganha <strong className="font-mono">{brl(Math.floor((preco * p.comissao_afiliado_pct) / 100))}</strong>.</p>}
              </section>
              <section className={`${cartao} space-y-4 p-5`}>
                <h2 className="text-lg">Links de venda</h2>
                <Rotulo texto="Página de vendas"><input readOnly value={base} onFocus={(e) => e.currentTarget.select()} className={`${campo} w-full font-mono text-xs`} /></Rotulo>
                <Rotulo texto="Checkout direto"><input readOnly value={`${location.origin}/checkout/${p.slug}`} onFocus={(e) => e.currentTarget.select()} className={`${campo} w-full font-mono text-xs`} /></Rotulo>
              </section>
            </div>
          )}
        </div>

        <aside aria-label="Resumo do produto" className="space-y-5 lg:sticky lg:top-44 lg:self-start">
          <section className={`${cartao} p-5`}>
            <h2 className="text-sm text-muted">Prévia na loja</h2>
            <div className="mt-3 max-w-xs"><CartaoCurso semLink p={{ id: 'previa', slug: p.slug, titulo: p.titulo || 'Nome do produto', descricao: p.descricao, capa_url: p.capa_url, preco_centavos: preco, categoria: p.categoria, parcelas_max: p.parcelas_max }} /></div>
          </section>
          <section className={`${cartao} p-5`}>
            <div className="flex items-center justify-between"><h2 className="text-lg">Pronto para publicar?</h2><span className="font-mono text-sm text-muted">{feitos}/{requisitos.length}</span></div>
            <div className="mt-2 h-1.5 rounded bg-wash"><div className="h-1.5 rounded bg-brand transition-all" style={{ width: `${(feitos / requisitos.length) * 100}%` }} /></div>
            <ul className="mt-4 space-y-2">
              {requisitos.map((r) => (
                <li key={r.rotulo}><button onClick={() => setAba(r.aba)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-wash">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full ${r.ok ? 'bg-ok/20 text-ok' : 'border border-line text-transparent'}`}>{r.ok && <Icon nome="check" tamanho={12} />}</span>
                  <span className={r.ok ? 'text-muted line-through' : ''}>{r.rotulo}</span>{!r.obrigatorio && !r.ok && <span className="ml-auto text-xs text-muted">recomendado</span>}
                </button></li>
              ))}
            </ul>
            <label className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-3 text-sm font-semibold ${p.publicado ? 'border-ok/40 bg-ok/10' : 'border-line'} ${!prontoParaPublicar && !p.publicado ? 'opacity-60' : ''}`}>
              Publicado na loja
              <input type="checkbox" role="switch" checked={p.publicado} onChange={(e) => alternarPublicado(e.target.checked)} className="size-5 accent-brand" />
            </label>
            {!prontoParaPublicar && !p.publicado && <p className="mt-2 text-xs text-muted">Complete os itens obrigatórios para publicar.</p>}
          </section>
        </aside>
      </div>
    </>
  )
}
