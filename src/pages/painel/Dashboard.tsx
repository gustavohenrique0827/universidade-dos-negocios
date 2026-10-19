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
      <Vazio
        titulo="Sua primeira venda começa aqui"
        texto="Crie um produto, publique e compartilhe o link da página de vendas para começar a faturar."
        acao={<Link to="/painel/produtos" className={botao}>Criar produto</Link>}
      />
    </>
  )

  const maxM = Math.max(1, ...x.porMetodo.map((m) => m.n))
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const pendentes = pedidos.filter((p) => p.status === 'pendente').length
  const tarefas = [
    pendentes > 0 && {
      para: '/painel/vendas',
      titulo: `${pendentes} ${pendentes === 1 ? 'pedido aguarda' : 'pedidos aguardam'} pagamento`,
      texto: 'Confirme ou aprove o pedido para liberar o acesso.',
      cor: 'border-outlier/40 bg-outlier/5 text-outlier'
    },
    (extra?.comissoes ?? 0) > 0 && {
      para: '/painel/afiliados',
      titulo: `${brl(extra!.comissoes)} em comissões a pagar`,
      texto: 'Repasse aos afiliados e marque como quitadas.',
      cor: 'border-brand/40 bg-brand/5 text-brand'
    },
    (extra?.saldo ?? 0) >= 5000 && {
      para: '/painel/financeiro',
      titulo: `${brl(extra!.saldo)} disponíveis para saque`,
      texto: 'Solicite o repasse imediato para a sua conta.',
      cor: 'border-ok/40 bg-ok/5 text-ok'
    },
    (extra?.rascunhos ?? 0) > 0 && {
      para: '/painel/produtos',
      titulo: `${extra!.rascunhos} ${extra!.rascunhos === 1 ? 'produto em rascunho' : 'produtos em rascunho'}`,
      texto: 'Publique agora para disponibilizar na loja.',
      cor: 'border-line bg-surface text-ink'
    },
  ].filter(Boolean) as { para: string; titulo: string; texto: string; cor: string }[]

  return (
    <>
      <PageHeader
        titulo={`${saudacao}, ${profile?.nome?.split(' ')[0] ?? ''}`}
        sub="Acompanhe o faturamento, conversão e métricas em tempo real."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <LinkBotao para="/painel/produtos" variante="secundario" tamanho="p">
              <Icon nome="mais" tamanho={14} /> Novo produto
            </LinkBotao>
            <div className="flex rounded-xl border border-line bg-surface/90 p-1 shadow-sm" role="group" aria-label="Período">
              {PERIODOS.map((p) => (
                <button
                  key={p.d}
                  onClick={() => setDias(p.d)}
                  aria-pressed={dias === p.d}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    dias === p.d ? 'bg-gradient-to-r from-brand to-brand-dark text-on-brand shadow-xs' : 'text-muted hover:text-ink hover:bg-wash/50'
                  }`}
                >
                  {p.r}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Task / Action Center */}
      <section aria-label="Pendências" className={`${cartao} mb-6 p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand animate-pulse-subtle" />
            Ações recomendadas
          </h2>
          <span className="font-mono text-xs text-muted">Prioridades do dia</span>
        </div>
        {extra === null ? (
          <p className="text-sm text-muted">Verificando pendências…</p>
        ) : tarefas.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-ok/20 bg-ok/5 p-3.5 text-sm text-ok">
            <Icon nome="check" tamanho={18} className="text-ok" />
            <span className="font-medium">Tudo em dia! Nenhuma pendência aberta no momento.</span>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {tarefas.map((t) => (
              <li key={t.para}>
                <Link
                  to={t.para}
                  className={`group flex items-center justify-between gap-3 rounded-xl border p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${t.cor}`}
                >
                  <div>
                    <span className="block text-sm font-bold text-ink">{t.titulo}</span>
                    <span className="text-xs text-muted mt-0.5 block">{t.texto}</span>
                  </div>
                  <span className="grid size-8 place-items-center rounded-lg bg-surface text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand shrink-0">
                    <Icon nome="avancar" tamanho={15} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modern KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          destaque
          rotulo="Receita líquida"
          valor={brl(x.receita)}
          detalhe={`${x.vendas} vendas aprovadas`}
          icone={<Icon nome="financeiro" tamanho={22} />}
        />
        <Kpi
          rotulo="Ticket médio"
          valor={brl(x.ticket)}
          detalhe="por pedido pago"
          icone={<Icon nome="produtos" tamanho={20} />}
        />
        <Kpi
          rotulo="Taxa de aprovação"
          valor={`${x.conversao}%`}
          detalhe="conversão no período"
          icone={<Icon nome="check" tamanho={20} />}
        />
        <Kpi
          rotulo="Reembolsos"
          valor={String(x.reemb)}
          detalhe="solicitações processadas"
          icone={<Icon nome="escudo" tamanho={20} />}
        />
      </div>

      {/* Main Chart Section */}
      <section className={`${cartao} mt-6 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Receita diária</h2>
            <p className="text-xs text-muted">Histórico de vendas confirmadas nos últimos {dias} dias</p>
          </div>
          <span className="font-mono text-sm font-bold text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
            Total: {brl(x.receita)}
          </span>
        </div>
        <AreaChart dados={x.serie} formato={brl} titulo={`Receita diária dos últimos ${dias} dias`} />
      </section>

      {/* Secondary Metrics Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={`${cartao} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Produtos mais vendidos</h2>
            <span className="text-xs font-semibold text-muted font-mono">{x.top.length} produtos</span>
          </div>
          {x.top.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Nenhuma venda aprovada neste período.</p>
          ) : (
            <ul className="space-y-4">
              {x.top.map((t, idx) => (
                <li key={t.titulo} className="group">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="truncate pr-2 font-semibold text-ink flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{idx + 1}.</span>
                      {t.titulo}
                    </span>
                    <span className="font-mono font-bold text-brand">{brl(t.receita)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-wash/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-500"
                      style={{ width: `${(t.receita / x.top[0].receita) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span>{t.vendas} vendas</span>
                    <span>{Math.round((t.receita / (x.receita || 1)) * 100)}% da receita</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cartao} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Métodos de pagamento</h2>
            <span className="text-xs font-semibold text-muted font-mono">{x.vendas} pedidos</span>
          </div>
          <ul className="space-y-4">
            {x.porMetodo.map(({ m, n }) => {
              const pct = x.vendas ? Math.round((n / x.vendas) * 100) : 0
              return (
                <li key={m} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink flex items-center gap-2">
                      <span className="size-2 rounded-full bg-brand" />
                      {METODO[m]}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      <strong className="text-ink font-bold">{n}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-wash/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-500"
                      style={{ width: `${Math.max(4, (n / maxM) * 100)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* Recent Orders Table */}
      <section className={`${cartao} mt-6 overflow-hidden`}>
        <div className="flex items-center justify-between p-6 pb-4 border-b border-line/60">
          <div>
            <h2 className="text-lg font-bold text-ink">Vendas recentes</h2>
            <p className="text-xs text-muted">Últimos pedidos registrados na plataforma</p>
          </div>
          <Link
            to="/painel/vendas"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
          >
            Ver todas <Icon nome="avancar" tamanho={13} />
          </Link>
        </div>
        <ul className="divide-y divide-line/60">
          {pedidos.slice(0, 6).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-wash/30 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-wash font-mono text-xs font-bold text-ink border border-line/60">
                  {p.comprador_nome ? p.comprador_nome.charAt(0).toUpperCase() : 'C'}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{p.comprador_nome ?? 'Cliente'}</p>
                  <p className="truncate text-xs text-muted">{p.products?.titulo} · {dataHoraBR(p.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={STATUS_PEDIDO[p.status]?.cor} dot>{STATUS_PEDIDO[p.status]?.rotulo}</Badge>
                <span className="font-mono text-sm font-bold text-ink tabular-nums">{brl(p.valor_centavos)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
