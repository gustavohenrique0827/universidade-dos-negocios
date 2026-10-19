import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Botao } from '../../components/Botao'
import Campo from '../../components/Campo'
import Capa from '../../components/Capa'
import { useDialogs } from '../../components/Dialogs'
import Drawer from '../../components/Drawer'
import { EsqueletoGrade } from '../../components/Esqueleto'
import Icon from '../../components/Icon'
import Menu from '../../components/Menu'
import { Kpi, PageHeader, Vazio } from '../../components/Ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { brl, campo, cartao, slugify } from '../../lib/util'

type Produto = { id: string; titulo: string; slug: string; capa_url: string | null; preco_centavos: number; publicado: boolean; categoria: string | null }
const CATEGORIAS = ['Empreendedorismo', 'Vendas', 'Marketing', 'Finanças', 'Negócios', 'Tecnologia', 'Desenvolvimento pessoal']
const ETAPAS = ['Informações', 'Preço', 'Revisão']
const unico = (t: string) => `${slugify(t)}-${Math.random().toString(36).slice(2, 6)}`

export default function Produtos() {
  useTitulo('Produtos')
  const { session } = useAuth()
  const { confirmar, avisar } = useDialogs()
  const nav = useNavigate()
  const [produtos, setProdutos] = useState<Produto[] | null>(null)
  const [vendas, setVendas] = useState<Record<string, number>>({})
  const [receita, setReceita] = useState<Record<string, number>>({})
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [criando, setCriando] = useState(false)
  const [etapa, setEtapa] = useState(0)
  const [form, setForm] = useState({ titulo: '', categoria: '', gratis: false, preco: '' })
  const [erros, setErros] = useState<{ titulo?: string; preco?: string }>({})
  const [enviando, setEnviando] = useState(false)

  async function carregar() {
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from('products').select('id, titulo, slug, capa_url, preco_centavos, publicado, categoria').eq('produtor_id', session!.user.id).order('created_at', { ascending: false }),
      supabase.from('orders').select('product_id, status, valor_centavos'),
    ])
    setProdutos(p ?? [])
    const v: Record<string, number> = {}, r: Record<string, number> = {}
    for (const x of o ?? []) if (x.status === 'pago') { v[x.product_id] = (v[x.product_id] ?? 0) + 1; r[x.product_id] = (r[x.product_id] ?? 0) + x.valor_centavos }
    setVendas(v); setReceita(r)
  }
  useEffect(() => { carregar() }, [])

  const lista = useMemo(() => (produtos ?? []).filter((p) => p.titulo.toLowerCase().includes(busca.toLowerCase()) && (!filtro || (filtro === 'pub' ? p.publicado : !p.publicado))), [produtos, busca, filtro])
  const precoCentavos = form.gratis ? 0 : Math.round(Number(form.preco.replace(/\./g, '').replace(',', '.')) * 100)

  function abrir() { setForm({ titulo: '', categoria: '', gratis: false, preco: '' }); setErros({}); setEtapa(0); setCriando(true) }
  function avancar() {
    if (etapa === 0 && form.titulo.trim().length < 3) return setErros({ titulo: 'Dê um nome com pelo menos 3 caracteres.' })
    if (etapa === 1 && !form.gratis && (!form.preco.trim() || Number.isNaN(precoCentavos) || precoCentavos < 500)) return setErros({ preco: 'O preço mínimo é R$ 5,00. Marque "Gratuito" se não for cobrar.' })
    setErros({}); setEtapa(etapa + 1)
  }
  async function criar() {
    setEnviando(true)
    const { data, error } = await supabase.from('products').insert({ produtor_id: session!.user.id, titulo: form.titulo.trim(), slug: unico(form.titulo), categoria: form.categoria || null, preco_centavos: precoCentavos }).select('id')
    setEnviando(false)
    if (error) return avisar(error.message, true)
    avisar('Produto criado. Agora monte o conteúdo.'); setCriando(false)
    nav(`/painel/produtos/${(data as { id: string }[])[0].id}`)
  }

  async function duplicar(p: Produto) {
    const { data: orig } = await supabase.from('products').select('*').eq('id', p.id).single()
    if (!orig) return
    const { id: _id, created_at: _c, ...resto } = orig as Record<string, unknown>
    const { data: novo, error } = await supabase.from('products').insert({ ...resto, titulo: `${p.titulo} (cópia)`, slug: unico(p.titulo), publicado: false, capa_url: p.capa_url }).select('id')
    if (error) return avisar(error.message, true)
    const novoId = (novo as { id: string }[])[0].id
    const { data: mods } = await supabase.from('modules').select('id, titulo, ordem, lessons(titulo, video_url, conteudo, ordem)').eq('product_id', p.id)
    for (const m of (mods ?? []) as { titulo: string; ordem: number; lessons: { titulo: string; video_url: string | null; conteudo: string | null; ordem: number }[] }[]) {
      const { data: nm } = await supabase.from('modules').insert({ product_id: novoId, titulo: m.titulo, ordem: m.ordem }).select('id')
      const mid = (nm as { id: string }[] | null)?.[0]?.id
      if (mid) for (const l of m.lessons) await supabase.from('lessons').insert({ module_id: mid, ...l })
    }
    avisar('Produto duplicado como rascunho.'); carregar()
  }
  async function alternar(p: Produto) {
    if (p.publicado && !(await confirmar(`Despublicar "${p.titulo}"?`, { texto: 'O produto sai da loja. Quem já comprou continua com acesso.', acao: 'Despublicar' }))) return
    await supabase.from('products').update({ publicado: !p.publicado }).eq('id', p.id)
    avisar(p.publicado ? 'Produto despublicado.' : 'Produto publicado na loja.'); carregar()
  }

  return (
    <>
      <PageHeader titulo="Produtos" sub="Cursos e infoprodutos que você vende." acoes={<Botao onClick={abrir}><Icon nome="mais" tamanho={16} /> Novo produto</Botao>} />
      {produtos && produtos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi rotulo="Produtos" valor={String(produtos.length)} />
          <Kpi rotulo="Publicados" valor={String(produtos.filter((x) => x.publicado).length)} detalhe="visíveis na loja" />
          <Kpi rotulo="Rascunhos" valor={String(produtos.filter((x) => !x.publicado).length)} detalhe="ainda não publicados" />
          <Kpi destaque rotulo="Receita total" valor={brl(Object.values(receita).reduce((n, v) => n + v, 0))} detalhe={`${Object.values(vendas).reduce((n, v) => n + v, 0)} vendas aprovadas`} />
        </div>
      )}
      {produtos && produtos.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative w-full sm:w-72"><Icon nome="busca" tamanho={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25" /></div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Situação" className={campo}><option value="">Todos</option><option value="pub">Publicados</option><option value="rasc">Rascunhos</option></select>
        </div>
      )}
      {produtos === null ? <EsqueletoGrade /> : produtos.length === 0 ? (
        <Vazio titulo="Crie seu primeiro produto" texto="Em três passos você define nome, preço e abre o editor para montar módulos e aulas." acao={<Botao onClick={abrir}>Criar produto</Botao>} />
      ) : lista.length === 0 ? <Vazio titulo="Nenhum produto encontrado" texto="Ajuste a busca ou o filtro." /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p) => (
            <article
              key={p.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line/70 bg-surface/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:bg-surface/90 hover:shadow-lg hover:shadow-black/25"
            >
              {/* Capa com overlay de status discreto */}
              <div className="relative aspect-video w-full overflow-hidden border-b border-line/50">
                <Link to={`/painel/produtos/${p.id}`} aria-label={`Editar ${p.titulo}`} className="block h-full w-full">
                  <Capa url={p.capa_url} titulo={p.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                </Link>

                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
                  <span className={`size-1.5 rounded-full ${p.publicado ? 'bg-ok animate-pulse' : 'bg-muted'}`} />
                  <span className={p.publicado ? 'text-ok' : 'text-muted'}>
                    {p.publicado ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>

                {p.categoria && (
                  <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur-md">
                    {p.categoria}
                  </span>
                )}
              </div>

              {/* Informações do Card */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/painel/produtos/${p.id}`}
                      className="font-semibold text-ink line-clamp-1 transition group-hover:text-brand"
                      title={p.titulo}
                    >
                      {p.titulo}
                    </Link>
                    <Menu
                      rotulo={`Ações de ${p.titulo}`}
                      itens={[
                        { rotulo: 'Editar conteúdo', onClick: () => nav(`/painel/produtos/${p.id}`) },
                        { rotulo: 'Ver página de vendas', onClick: () => nav(`/p/${p.slug}`) },
                        { rotulo: 'Duplicar produto', onClick: () => duplicar(p) },
                        { rotulo: p.publicado ? 'Despublicar' : 'Publicar na loja', onClick: () => alternar(p) },
                      ]}
                    />
                  </div>

                  <p className="mt-1 font-mono text-base font-bold text-ink">
                    {p.preco_centavos === 0 ? 'Grátis' : brl(p.preco_centavos)}
                  </p>
                </div>

                {/* Métricas organizadas e sóbrias */}
                <div className="mt-5 border-t border-line/60 pt-3.5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted">Vendas</span>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
                        {vendas[p.id] ?? 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted">Faturamento</span>
                      <p className="mt-0.5 font-mono text-sm font-semibold text-ink">
                        {brl(receita[p.id] ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer aberto={criando} onFechar={() => setCriando(false)} titulo="Novo produto"
        rodape={<>
          {etapa > 0 && <Botao variante="secundario" onClick={() => setEtapa(etapa - 1)}>Voltar</Botao>}
          {etapa < 2 ? <Botao onClick={avancar}>Continuar</Botao> : <Botao carregando={enviando} onClick={criar}>Criar e montar conteúdo</Botao>}
        </>}>
        <ol className="mb-6 flex items-center gap-2" aria-label="Etapas">
          {ETAPAS.map((t, i) => (
            <li key={t} aria-current={i === etapa ? 'step' : undefined} className="flex flex-1 items-center gap-2 text-sm">
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${i < etapa ? 'bg-ok text-on-brand' : i === etapa ? 'bg-brand text-on-brand' : 'bg-wash text-muted'}`}>{i < etapa ? <Icon nome="check" tamanho={13} /> : i + 1}</span>
              <span className={i === etapa ? 'font-semibold' : 'text-muted'}>{t}</span>{i < 2 && <span className="h-px flex-1 bg-line" />}
            </li>
          ))}
        </ol>
        {etapa === 0 && <div className="space-y-4">
          <Campo rotulo="Nome do produto" obrigatorio erro={erros.titulo} dica="É o que aparece na loja e na página de vendas.">{(p) => <input {...p} autoFocus value={form.titulo} onChange={(e) => { setForm({ ...form, titulo: e.target.value }); setErros({}) }} placeholder="Ex.: Vendas High Ticket" />}</Campo>
          <Campo rotulo="Categoria" dica="Ajuda os alunos a encontrar seu produto.">{(p) => <select {...p} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}><option value="">Escolher depois</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select>}</Campo>
        </div>}
        {etapa === 1 && <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.gratis} onChange={(e) => { setForm({ ...form, gratis: e.target.checked }); setErros({}) }} className="size-4 accent-brand" /> Produto gratuito</label>
          {!form.gratis && <Campo rotulo="Preço (R$)" obrigatorio erro={erros.preco} dica="Você pode mudar depois, junto com parcelamento e garantia.">{(p) => <input {...p} inputMode="decimal" autoFocus value={form.preco} onChange={(e) => { setForm({ ...form, preco: e.target.value }); setErros({}) }} placeholder="497,00" className={`${p.className} font-mono`} />}</Campo>}
        </div>}
        {etapa === 2 && <div className="space-y-3">
          <p className="text-sm text-muted">Confira e crie. O produto nasce como rascunho: só aparece na loja quando você publicar.</p>
          <dl className={`${cartao} divide-y divide-line text-sm`}>
            {[['Nome', form.titulo], ['Categoria', form.categoria || '—'], ['Preço', form.gratis ? 'Gratuito' : brl(precoCentavos)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
          </dl>
        </div>}
      </Drawer>
    </>
  )
}
