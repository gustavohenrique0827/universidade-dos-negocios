import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AreaChart from '../../components/AreaChart'
import { EsqueletoPainel } from '../../components/Esqueleto'
import { useTitulo } from '../../lib/titulo'
import { LinkBotao } from '../../components/Botao'
import Icon from '../../components/Icon'
import { Badge, Kpi, PageHeader, Vazio } from '../../components/Ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { brl, botao, cartao, dataHoraBR, METODO, STATUS_PEDIDO } from '../../lib/util'

type Pedido = { id: string; valor_centavos: number; status: string; metodo: string; created_at: string; paid_at: string | null; comprador_nome: string | null; product_id: string; products: { titulo: string } | null }

const PERIODOS = [{ d: 7, r: '7 dias' }, { d: 30, r: '30 dias' }, { d: 90, r: '90 dias' }]
const dia = (d: Date) => d.toISOString().slice(0, 10)

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  const [dias, setDias] = useState(30)
  const { profile, session } = useAuth()
  const [extra, setExtra] = useState<{ saldo: number; comissoes: number; rascunhos: number } | null>(null)

  useEffect(() => {
    supabase.from('orders').select('id, valor_centavos, status, metodo, created_at, paid_at, comprador_nome, product_id, products(titulo)').order('created_at', { ascending: false })
      .then(({ data }) => setPedidos((data ?? []) as unknown as Pedido[]))
    Promise.all([
      supabase.rpc('producer_balance'),
      supabase.from('commissions').select('valor_centavos, status'),
      supabase.from('products').select('publicado').eq('produtor_id', session!.user.id),
    ]).then(([s, c, p]) => setExtra({
      saldo: (s.data as { disponivel: number } | null)?.disponivel ?? 0,
      comissoes: (c.data ?? []).filter((x: { status: string }) => x.status === 'pendente').reduce((n: number, x: { valor_centavos: number }) => n + x.valor_centavos, 0),
      rascunhos: (p.data ?? []).filter((x: { publicado: boolean }) => !x.publicado).length,
    }))
  }, [])

  const x = useMemo(() => {
    const desde = Date.now() - dias * 86400000
    const doPeriodo = (pedidos ?? []).filter((p) => new Date(p.created_at).getTime() >= desde)
    const pagos = doPeriodo.filter((p) => p.status === 'pago')
    const receita = pagos.reduce((n, p) => n + p.valor_centavos, 0)
    const reemb = doPeriodo.filter((p) => p.status === 'reembolsado')
    const serie = Array.from({ length: dias }, (_, i) => {
      const d = new Date(Date.now() - (dias - 1 - i) * 86400000)
      const k = dia(d)
      return { rotulo: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), valor: pagos.filter((p) => p.created_at.slice(0, 10) === k).reduce((n, p) => n + p.valor_centavos, 0) }
    })
    const porProduto = new Map<string, { titulo: string; vendas: number; receita: number }>()
    for (const p of pagos) {
      const t = porProduto.get(p.product_id) ?? { titulo: p.products?.titulo ?? '—', vendas: 0, receita: 0 }
      t.vendas++; t.receita += p.valor_centavos; porProduto.set(p.product_id, t)
    }
    const porMetodo = ['pix', 'cartao', 'boleto'].map((m) => ({ m, n: pagos.filter((p) => p.metodo === m).length }))
    return {
      receita, vendas: pagos.length, ticket: pagos.length ? Math.round(receita / pagos.length) : 0,
      reemb: reemb.length, conversao: doPeriodo.length ? Math.round((pagos.length / doPeriodo.length) * 100) : 0,
      serie, top: [...porProduto.values()].sort((a, b) => b.receita - a.receita).slice(0, 5), porMetodo,
    }
  }, [pedidos, dias])

  useTitulo('Dashboard')
  if (pedidos === null) return <EsqueletoPainel />
  if (pedidos.length === 0) return (
    <>
      <PageHeader titulo="Dashboard" />
      <Vazio titulo="Sua primeira venda começa aqui" texto="Crie um produto, publique e compartilhe o link da página de vendas." acao={<Link to="/painel/produtos" className={botao}>Criar produto</Link>} />
    </>
  )

  const maxM = Math.max(1, ...x.porMetodo.map((m) => m.n))
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const pendentes = pedidos.filter((p) => p.status === 'pendente').length
  const tarefas = [
    pendentes > 0 && { para: '/painel/vendas', titulo: `${pendentes} ${pendentes === 1 ? 'pedido aguarda' : 'pedidos aguardam'} pagamento`, texto: 'Confirme ou cancele para liberar o acesso.' },
    (extra?.comissoes ?? 0) > 0 && { para: '/painel/afiliados', titulo: `${brl(extra!.comissoes)} em comissões a pagar`, texto: 'Repasse aos afiliados e marque como pagas.' },
    (extra?.saldo ?? 0) >= 5000 && { para: '/painel/financeiro', titulo: `${brl(extra!.saldo)} disponíveis para saque`, texto: 'Solicite o repasse para a sua conta.' },
    (extra?.rascunhos ?? 0) > 0 && { para: '/painel/produtos', titulo: `${extra!.rascunhos} ${extra!.rascunhos === 1 ? 'produto em rascunho' : 'produtos em rascunho'}`, texto: 'Publique para começar a vender.' },
  ].filter(Boolean) as { para: string; titulo: string; texto: string }[]
  return (
    <>
      <PageHeader titulo={`${saudacao}, ${profile?.nome?.split(' ')[0] ?? ''}`} sub="Veja como estão suas vendas." acoes={<>
        <LinkBotao para="/painel/produtos" variante="secundario" tamanho="p"><Icon nome="mais" tamanho={15} /> Novo produto</LinkBotao>
        <div className="flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Período">
          {PERIODOS.map((p) => <button key={p.d} onClick={() => setDias(p.d)} aria-pressed={dias === p.d} className={`rounded-md px-3 py-1 text-sm font-medium ${dias === p.d ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'}`}>{p.r}</button>)}
        </div></>
      } />
      <section aria-label="Pendências" className={`${cartao} mb-4 p-4`}>
        <h2 className="mb-2 text-lg">Para fazer agora</h2>
        {extra === null ? <p className="text-sm text-muted">Verificando pendências…</p> : tarefas.length === 0 ? <p className="flex items-center gap-2 text-sm text-muted"><Icon nome="check" tamanho={16} className="text-ok" /> Tudo em dia. Nenhuma pendência no momento.</p> : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {tarefas.map((t) => <li key={t.para}><Link to={t.para} className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 transition hover:border-brand"><span><span className="block text-sm font-semibold">{t.titulo}</span><span className="text-xs text-muted">{t.texto}</span></span><Icon nome="avancar" tamanho={16} className="shrink-0 text-muted" /></Link></li>)}
          </ul>
        )}
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi destaque rotulo="Receita" valor={brl(x.receita)} detalhe={`${x.vendas} vendas aprovadas`} />
        <Kpi rotulo="Ticket médio" valor={brl(x.ticket)} />
        <Kpi rotulo="Aprovação" valor={`${x.conversao}%`} detalhe="pedidos aprovados" />
        <Kpi rotulo="Reembolsos" valor={String(x.reemb)} detalhe={`no período`} />
      </div>

      <section className={`${cartao} mt-4 p-4`}>
        <h2 className="mb-2 text-lg">Receita por dia</h2>
        <AreaChart dados={x.serie} formato={brl} titulo={`Receita diária dos últimos ${dias} dias`} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className={`${cartao} p-4`}>
          <h2 className="mb-3 text-lg">Produtos que mais vendem</h2>
          {x.top.length === 0 ? <p className="text-sm text-muted">Nenhuma venda aprovada neste período.</p> : (
            <ul className="space-y-3">
              {x.top.map((t) => (
                <li key={t.titulo}>
                  <div className="flex justify-between text-sm"><span className="truncate pr-2 font-medium">{t.titulo}</span><span className="font-mono tabular-nums">{brl(t.receita)}</span></div>
                  <div className="mt-1 h-1.5 rounded bg-wash"><div className="h-1.5 rounded bg-brand" style={{ width: `${(t.receita / x.top[0].receita) * 100}%` }} /></div>
                  <div className="mt-0.5 text-xs text-muted">{t.vendas} vendas</div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={`${cartao} p-4`}>
          <h2 className="mb-3 text-lg">Formas de pagamento</h2>
          <ul className="space-y-3">
            {x.porMetodo.map(({ m, n }) => (
              <li key={m} className="flex items-center gap-3 text-sm">
                <span className="w-14 text-muted">{METODO[m]}</span>
                <div className="h-6 flex-1 rounded bg-wash"><div className="flex h-6 items-center rounded bg-brand px-2 font-mono text-xs text-on-brand" style={{ width: `${Math.max(8, (n / maxM) * 100)}%` }}>{n}</div></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${cartao} mt-4`}>
        <div className="flex items-center justify-between p-4 pb-2"><h2 className="text-lg">Vendas recentes</h2><Link to="/painel/vendas" className="text-sm font-medium text-brand">Ver todas</Link></div>
        <ul className="divide-y divide-line">
          {pedidos.slice(0, 6).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{p.comprador_nome ?? 'Cliente'}</p><p className="truncate text-xs text-muted">{p.products?.titulo} · {dataHoraBR(p.created_at)}</p></div>
              <div className="flex items-center gap-3"><Badge className={STATUS_PEDIDO[p.status]?.cor}>{STATUS_PEDIDO[p.status]?.rotulo}</Badge><span className="font-mono tabular-nums">{brl(p.valor_centavos)}</span></div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
