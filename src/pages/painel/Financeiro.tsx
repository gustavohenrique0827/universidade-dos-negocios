import { useEffect, useState, type FormEvent } from 'react'
import { Botao } from '../../components/Botao'
import Campo from '../../components/Campo'
import DataTable, { type Coluna } from '../../components/DataTable'
import { useDialogs } from '../../components/Dialogs'
import { EsqueletoPainel } from '../../components/Esqueleto'
import { Badge, Kpi, PageHeader, Vazio } from '../../components/Ui'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { brl, cartao, dataHoraBR } from '../../lib/util'

type Saldo = { disponivel: number; a_liberar: number; sacado: number }
type Saque = { id: string; valor_centavos: number; status: string; created_at: string }

const paraCentavos = (t: string) => Math.round(Number(t.replace(/\./g, '').replace(',', '.')) * 100)

export default function Financeiro() {
  useTitulo('Financeiro')
  const { confirmar, avisar } = useDialogs()
  const [saldo, setSaldo] = useState<Saldo | null>(null)
  const [saques, setSaques] = useState<Saque[] | null>(null)
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const carregar = async () => {
    const [{ data: s }, { data: w }] = await Promise.all([supabase.rpc('producer_balance'), supabase.from('withdrawals').select('*').order('created_at', { ascending: false })])
    setSaldo(s as Saldo); setSaques((w ?? []) as Saque[])
  }
  useEffect(() => { carregar() }, [])

  async function sacar(e: FormEvent) {
    e.preventDefault()
    const c = paraCentavos(valor)
    if (!valor.trim() || Number.isNaN(c)) return setErro('Informe o valor que deseja sacar.')
    if (c < 5000) return setErro('O saque mínimo é R$ 50,00.')
    if (c > saldo!.disponivel) return setErro(`Seu saldo disponível é ${brl(saldo!.disponivel)}.`)
    if (!(await confirmar(`Sacar ${brl(c)}?`, { texto: 'O repasse é feito em até 2 dias úteis.', acao: 'Solicitar saque' }))) return
    setEnviando(true)
    const { error } = await supabase.rpc('request_withdrawal', { p_valor: c })
    setEnviando(false)
    if (error) return setErro(error.message)
    setValor(''); setErro(''); avisar('Saque solicitado. O repasse é feito em até 2 dias úteis.'); carregar()
  }

  if (!saldo) return <EsqueletoPainel />
  const colunas: Coluna<Saque>[] = [
    { id: 'data', titulo: 'Data', valor: (s) => s.created_at, render: (s) => <span className="text-muted">{dataHoraBR(s.created_at)}</span> },
    { id: 'valor', titulo: 'Valor', valor: (s) => s.valor_centavos, render: (s) => <span className="font-mono tabular-nums">{brl(s.valor_centavos)}</span> },
    { id: 'status', titulo: 'Status', render: (s) => <Badge className={s.status === 'pago' ? 'bg-ok/10 text-ok' : 'bg-outlier/20 text-outlier'}>{s.status === 'pago' ? 'Pago' : 'Em processamento'}</Badge> },
  ]

  return (
    <>
      <PageHeader titulo="Financeiro" sub="O valor de cada venda fica a liberar durante a garantia do produto." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi destaque rotulo="Disponível para saque" valor={brl(saldo.disponivel)} />
        <Kpi rotulo="A liberar" valor={brl(saldo.a_liberar)} detalhe="em período de garantia" />
        <Kpi rotulo="Total sacado" valor={brl(saldo.sacado)} />
      </div>
      <form onSubmit={sacar} noValidate className={`${cartao} mt-6 max-w-xl p-5`}>
        <h2 className="text-lg">Solicitar saque</h2>
        <p className="mt-1 text-sm text-muted">Valor mínimo de R$ 50,00. Já descontamos a taxa da plataforma e as comissões de afiliados.</p>
        <div className="mt-3 flex items-start gap-2">
          <Campo rotulo="Valor (R$)" erro={erro} className="flex-1">{(p) => <input {...p} inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => { setValor(e.target.value); setErro('') }} className={`${p.className} font-mono`} />}</Campo>
          <Botao type="button" variante="secundario" className="mt-[26px]" onClick={() => { setValor((saldo.disponivel / 100).toFixed(2).replace('.', ',')); setErro('') }}>Tudo</Botao>
          <Botao carregando={enviando} className="mt-[26px]" disabled={saldo.disponivel < 5000}>Sacar</Botao>
        </div>
        {saldo.disponivel < 5000 && <p className="mt-2 text-xs text-muted">Você ainda não tem o mínimo disponível para saque.</p>}
      </form>
      <h2 className="mb-3 mt-8 text-lg">Histórico de saques</h2>
      <DataTable<Saque> rotulo="Histórico de saques" dados={saques} colunas={colunas} chave={(s) => s.id} vazio={<Vazio titulo="Nenhum saque ainda" texto="Quando você solicitar um saque, ele aparece aqui com o status do repasse." />} />
    </>
  )
}
