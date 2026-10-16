import { useEffect, useMemo, useState } from 'react'
import DataTable, { type Coluna } from '../../components/DataTable'
import { Botao } from '../../components/Botao'
import { useDialogs } from '../../components/Dialogs'
import Drawer from '../../components/Drawer'
import Icon from '../../components/Icon'
import Menu from '../../components/Menu'
import { Badge, PageHeader, Vazio } from '../../components/Ui'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { baixarCSV, brl, campo, dataHoraBR, liquido, METODO, STATUS_PEDIDO, TAXA_PLATAFORMA } from '../../lib/util'

type Pedido = {
  id: string; valor_centavos: number; status: string; metodo: string; parcelas: number; bump_aceito: boolean; bump_valor_centavos: number
  created_at: string; paid_at: string | null; reembolsado_em: string | null; affiliate_link_id: string | null; coupon_id: string | null
  comprador_nome: string | null; comprador_email: string | null; product_id: string; products: { titulo: string } | null
}
type Fn = 'confirm_order' | 'cancel_order' | 'refund_order'

const PERIODOS = [['', 'Todo o período'], ['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias']]
const FEITO: Record<Fn, string> = { confirm_order: 'Pagamento confirmado. Acesso liberado ao aluno.', cancel_order: 'Pedido cancelado.', refund_order: 'Venda reembolsada.' }

export default function Vendas() {
  useTitulo('Pedidos')
  const { confirmar, avisar } = useDialogs()
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  const [comissoes, setComissoes] = useState<Record<string, number>>({})
  const [status, setStatus] = useState('')
  const [produto, setProduto] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [detalhe, setDetalhe] = useState<Pedido | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const carregar = async () => {
    const [{ data }, { data: c }] = await Promise.all([
      supabase.from('orders').select('*, products(titulo)').order('created_at', { ascending: false }),
      supabase.from('commissions').select('order_id, valor_centavos'),
    ])
    const lista = (data ?? []) as unknown as Pedido[]
    setPedidos(lista)
    setComissoes(Object.fromEntries((c ?? []).map((x: { order_id: string; valor_centavos: number }) => [x.order_id, x.valor_centavos])))
    setDetalhe((d) => (d ? lista.find((p) => p.id === d.id) ?? null : null))
  }
  useEffect(() => { carregar() }, [])

  const produtos = useMemo(() => [...new Map((pedidos ?? []).map((p) => [p.product_id, p.products?.titulo ?? '—'])).entries()], [pedidos])
  const filtrados = useMemo(() => {
    const desde = periodo ? Date.now() - Number(periodo) * 86400000 : 0
    return pedidos === null ? null : pedidos.filter((p) => (!status || p.status === status) && (!produto || p.product_id === produto) && new Date(p.created_at).getTime() >= desde)
  }, [pedidos, status, produto, periodo])
  const aprovado = (filtrados ?? []).filter((p) => p.status === 'pago').reduce((n, p) => n + p.valor_centavos, 0)

  async function acao(p: Pedido, fn: Fn) {
    if (fn === 'refund_order' && !(await confirmar('Reembolsar esta venda?', { texto: `${brl(p.valor_centavos)} de ${p.comprador_nome}. O aluno perde o acesso ao curso e a comissão do afiliado é cancelada.`, acao: 'Reembolsar', perigo: true }))) return
    if (fn === 'cancel_order' && !(await confirmar('Cancelar este pedido?', { texto: 'O pedido deixa de aguardar pagamento.', acao: 'Cancelar pedido', perigo: true }))) return
    setOcupado(true)
    const { error } = await supabase.rpc(fn, { p_order: p.id })
    setOcupado(false)
    if (error) avisar(error.message, true); else avisar(FEITO[fn])
    carregar()
  }

  const linhaCSV = (p: Pedido) => [dataHoraBR(p.created_at), p.comprador_nome ?? '', p.comprador_email ?? '', p.products?.titulo ?? '', METODO[p.metodo], p.parcelas, (p.valor_centavos / 100).toFixed(2).replace('.', ','), STATUS_PEDIDO[p.status]?.rotulo ?? p.status]
  const CAB = ['Data', 'Cliente', 'E-mail', 'Produto', 'Pagamento', 'Parcelas', 'Valor', 'Status']
  const exportar = (lista: Pedido[]) => baixarCSV('vendas.csv', [CAB, ...lista.map(linhaCSV)])

  const colunas: Coluna<Pedido>[] = [
    { id: 'data', titulo: 'Data', valor: (p) => p.created_at, render: (p) => <span className="whitespace-nowrap text-muted">{dataHoraBR(p.created_at)}</span> },
    { id: 'cliente', titulo: 'Cliente', valor: (p) => p.comprador_nome ?? '', render: (p) => <div className="min-w-0"><p className="truncate font-medium">{p.comprador_nome}</p><p className="truncate text-xs text-muted">{p.comprador_email}</p></div> },
    { id: 'produto', titulo: 'Produto', valor: (p) => p.products?.titulo ?? '', render: (p) => <div className="max-w-52"><p className="truncate">{p.products?.titulo}</p>{p.bump_aceito && <p className="text-xs text-muted">+ oferta adicional</p>}</div> },
    { id: 'pgto', titulo: 'Pagamento', render: (p) => <>{METODO[p.metodo]}{p.parcelas > 1 && <span className="text-muted"> {p.parcelas}x</span>}</> },
    { id: 'valor', titulo: 'Valor', valor: (p) => p.valor_centavos, render: (p) => <span className="font-mono tabular-nums">{brl(p.valor_centavos)}</span> },
    { id: 'status', titulo: 'Status', valor: (p) => p.status, render: (p) => <Badge className={STATUS_PEDIDO[p.status]?.cor}>{STATUS_PEDIDO[p.status]?.rotulo}</Badge> },
  ]

  const itensMenu = (p: Pedido) => [
    { rotulo: 'Ver detalhes', onClick: () => setDetalhe(p) },
    ...(p.status === 'pendente' ? [{ rotulo: 'Confirmar pagamento', onClick: () => acao(p, 'confirm_order') }, { rotulo: 'Cancelar pedido', onClick: () => acao(p, 'cancel_order'), perigo: true }] : []),
    ...(p.status === 'pago' ? [{ rotulo: 'Reembolsar', onClick: () => acao(p, 'refund_order'), perigo: true }] : []),
  ]

  const taxa = detalhe ? Math.ceil(detalhe.valor_centavos * TAXA_PLATAFORMA) : 0
  const comissao = detalhe ? comissoes[detalhe.id] ?? 0 : 0

  return (
    <>
      <PageHeader titulo="Pedidos" sub={filtrados ? `${filtrados.length} pedidos · ${brl(aprovado)} aprovados` : undefined}
        acoes={<Botao variante="secundario" onClick={() => exportar(filtrados ?? [])}><Icon nome="baixar" tamanho={15} /> Exportar CSV</Botao>} />
      <DataTable<Pedido> rotulo="Lista de pedidos" dados={filtrados} colunas={colunas} chave={(p) => p.id} selecionavel porPagina={10}
        busca={{ placeholder: 'Buscar por cliente ou e-mail', texto: (p) => `${p.comprador_nome} ${p.comprador_email}` }}
        filtros={<>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={campo}><option value="">Todos os status</option>{Object.entries(STATUS_PEDIDO).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}</select>
          <select value={produto} onChange={(e) => setProduto(e.target.value)} aria-label="Produto" className={`${campo} max-w-56`}><option value="">Todos os produtos</option>{produtos.map(([id, t]) => <option key={id} value={id}>{t}</option>)}</select>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Período" className={campo}>{PERIODOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
        </>}
        acoesSelecao={(ids) => <Botao tamanho="p" variante="secundario" onClick={() => exportar((pedidos ?? []).filter((p) => ids.includes(p.id)))}><Icon nome="baixar" tamanho={14} /> Exportar selecionados</Botao>}
        acoesLinha={(p) => <Menu itens={itensMenu(p)} rotulo={`Ações do pedido de ${p.comprador_nome}`} />} onLinha={setDetalhe}
        vazio={<Vazio titulo="Nenhum pedido encontrado" texto={pedidos?.length ? 'Nenhum pedido combina com os filtros. Ajuste a busca ou o período.' : 'Quando alguém comprar um dos seus produtos, o pedido aparece aqui.'} />} />

      <Drawer aberto={!!detalhe} onFechar={() => setDetalhe(null)} titulo="Detalhes do pedido"
        rodape={detalhe && <>
          {detalhe.status === 'pendente' && <><Botao variante="perigo" carregando={ocupado} onClick={() => acao(detalhe, 'cancel_order')}>Cancelar pedido</Botao><Botao carregando={ocupado} onClick={() => acao(detalhe, 'confirm_order')}>Confirmar pagamento</Botao></>}
          {detalhe.status === 'pago' && <Botao variante="perigo" carregando={ocupado} onClick={() => acao(detalhe, 'refund_order')}>Reembolsar</Botao>}
        </>}>
        {detalhe && (
          <div className="space-y-6">
            <div><Badge className={STATUS_PEDIDO[detalhe.status]?.cor}>{STATUS_PEDIDO[detalhe.status]?.rotulo}</Badge><p className="mt-2 font-display text-2xl font-bold">{detalhe.products?.titulo}</p><p className="text-sm text-muted">Pedido {detalhe.id.slice(0, 8)} · {dataHoraBR(detalhe.created_at)}</p></div>
            <section><h3 className="mb-2 text-sm text-muted">Cliente</h3><p className="font-medium">{detalhe.comprador_nome}</p><p className="text-sm text-muted">{detalhe.comprador_email}</p></section>
            <section><h3 className="mb-2 text-sm text-muted">Pagamento</h3>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Forma</dt><dd>{METODO[detalhe.metodo]}{detalhe.parcelas > 1 ? ` em ${detalhe.parcelas}x` : ''}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Aprovado em</dt><dd>{dataHoraBR(detalhe.paid_at)}</dd></div>
                {detalhe.reembolsado_em && <div className="flex justify-between"><dt className="text-muted">Reembolsado em</dt><dd>{dataHoraBR(detalhe.reembolsado_em)}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted">Cupom</dt><dd>{detalhe.coupon_id ? 'Aplicado' : 'Não'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Origem</dt><dd>{detalhe.affiliate_link_id ? 'Link de afiliado' : 'Direta'}</dd></div>
              </dl>
            </section>
            <section className="rounded-xl bg-wash p-4"><h3 className="mb-2 text-sm text-muted">Quanto você recebe</h3>
              <dl className="space-y-1.5 text-sm">
                {detalhe.bump_aceito && <div className="flex justify-between"><dt className="text-muted">Oferta adicional (incluída)</dt><dd className="font-mono">{brl(detalhe.bump_valor_centavos)}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted">Valor da venda</dt><dd className="font-mono">{brl(detalhe.valor_centavos)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Taxa da plataforma</dt><dd className="font-mono">− {brl(taxa)}</dd></div>
                {comissao > 0 && <div className="flex justify-between"><dt className="text-muted">Comissão do afiliado</dt><dd className="font-mono">− {brl(comissao)}</dd></div>}
                <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Líquido</dt><dd className="font-mono">{brl(detalhe.status === 'pago' ? liquido(detalhe.valor_centavos, comissao) : 0)}</dd></div>
              </dl>
              {detalhe.status !== 'pago' && <p className="mt-2 text-xs text-muted">O valor líquido só conta após a aprovação do pagamento.</p>}
            </section>
          </div>
        )}
      </Drawer>
    </>
  )
}
