import { useEffect, useState } from 'react'
import Capa from '../../components/Capa'
import { Botao } from '../../components/Botao'
import DataTable, { type Coluna } from '../../components/DataTable'
import { useDialogs } from '../../components/Dialogs'
import { Abas, Kpi, PageHeader, Vazio } from '../../components/Ui'
import { useTitulo } from '../../lib/titulo'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { brl, campo, cartao } from '../../lib/util'

type Item = { id: string; titulo: string; slug: string; capa_url: string | null; categoria: string | null; preco_centavos: number; comissao_afiliado_pct: number }
type Stat = { codigo: string; product_id: string; titulo: string; slug: string; vendas: number; comissao_centavos: number; pendente_centavos: number }
type Aba = 'mercado' | 'links'

export default function Afiliacao() {
  const { session } = useAuth()
  const [aba, setAba] = useState<Aba>('mercado')
  const [catalogo, setCatalogo] = useState<Item[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [busca, setBusca] = useState('')
  const { avisar } = useDialogs()
  useTitulo('Afiliação')

  const carregar = async () => {
    const [c, s] = await Promise.all([supabase.rpc('affiliate_catalog'), supabase.rpc('affiliate_stats')])
    setCatalogo((c.data ?? []) as Item[]); setStats((s.data ?? []) as Stat[])
  }
  useEffect(() => { carregar() }, [])

  async function afiliar(productId: string) {
    const { error } = await supabase.from('affiliate_links').insert({ user_id: session!.user.id, product_id: productId, codigo: Math.random().toString(36).slice(2, 10) })
    if (error) return avisar(error.message, true)
    avisar('Link de afiliado criado.'); await carregar(); setAba('links')
  }
  const url = (slug: string, codigo: string) => `${location.origin}/p/${slug}?ref=${codigo}`
  async function copiar(texto: string) {
    try { await navigator.clipboard.writeText(texto) } catch { /* sem permissão: o campo permanece selecionável */ }
    avisar('Link copiado.')
  }

  const colunas: Coluna<Stat>[] = [
    { id: 'produto', titulo: 'Produto', valor: (x) => x.titulo, render: (x) => <span className="block max-w-56 truncate font-medium">{x.titulo}</span> },
    { id: 'link', titulo: 'Link', render: (x) => <div className="flex items-center gap-2"><input readOnly value={url(x.slug, x.codigo)} onFocus={(e) => e.currentTarget.select()} aria-label={`Link de ${x.titulo}`} className="w-52 rounded bg-wash px-2 py-1 font-mono text-xs" /><Botao tamanho="p" variante="terciario" onClick={() => copiar(url(x.slug, x.codigo))}>Copiar</Botao></div> },
    { id: 'vendas', titulo: 'Vendas', valor: (x) => x.vendas, render: (x) => <span className="font-mono tabular-nums">{x.vendas}</span> },
    { id: 'com', titulo: 'Comissão', valor: (x) => x.comissao_centavos, render: (x) => <span className="font-mono tabular-nums">{brl(x.comissao_centavos)}</span> },
    { id: 'pend', titulo: 'A receber', valor: (x) => x.pendente_centavos, render: (x) => <span className="font-mono tabular-nums">{brl(x.pendente_centavos)}</span> },
  ]
  const meus = new Set(stats.map((s) => s.product_id))
  const lista = catalogo.filter((i) => i.titulo.toLowerCase().includes(busca.toLowerCase()))
  const soma = (k: 'comissao_centavos' | 'pendente_centavos') => stats.reduce((n, s) => n + s[k], 0)

  return (
    <>
      <PageHeader titulo="Afiliação" sub="Divulgue produtos de outros criadores e receba comissão por cada venda." />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi destaque rotulo="Comissões geradas" valor={brl(soma('comissao_centavos'))} />
        <Kpi rotulo="A receber" valor={brl(soma('pendente_centavos'))} />
        <Kpi rotulo="Vendas" valor={String(stats.reduce((n, s) => n + s.vendas, 0))} detalhe={`${stats.length} links`} />
      </div>
      <Abas ativa={aba} onChange={setAba} abas={[{ id: 'mercado', rotulo: 'Marketplace' }, { id: 'links', rotulo: `Meus links (${stats.length})` }]} />

      {aba === 'mercado' && (
        <>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" className={`${campo} mb-4 w-full sm:w-72`} />
          {lista.length === 0 ? <Vazio titulo="Nenhum produto disponível" texto="Quando criadores ativarem comissão, os produtos aparecem aqui." /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((i) => (
                <article key={i.id} className={`${cartao} flex flex-col overflow-hidden`}>
                  <Capa url={i.capa_url} titulo={i.titulo} />
                  <div className="flex flex-1 flex-col p-4">
                    {i.categoria && <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{i.categoria}</p>}
                    <h2 className="text-lg leading-snug">{i.titulo}</h2>
                    <p className="mt-2 text-sm text-muted">Preço {brl(i.preco_centavos)}</p>
                    <p className="text-sm">Você ganha <strong className="font-mono text-ok">{brl(Math.floor((i.preco_centavos * i.comissao_afiliado_pct) / 100))}</strong> <span className="text-muted">({i.comissao_afiliado_pct}%) por venda</span></p>
                    <div className="mt-auto pt-4">{meus.has(i.id) ? <Botao variante="secundario" larga onClick={() => setAba('links')}>Ver meu link</Botao> : <Botao larga onClick={() => afiliar(i.id)}>Quero divulgar</Botao>}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {aba === 'links' && (
        <DataTable<Stat> rotulo="Meus links de afiliado" dados={stats} colunas={colunas} chave={(x) => x.codigo}
          vazio={<Vazio titulo="Você ainda não tem links" texto="Escolha um produto no marketplace para gerar seu link de afiliado." acao={<Botao onClick={() => setAba('mercado')}>Ver marketplace</Botao>} />} />
      )}
    </>
  )
}
