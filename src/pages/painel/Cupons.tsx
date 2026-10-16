import { useEffect, useState, type FormEvent } from 'react'
import { Botao } from '../../components/Botao'
import Campo from '../../components/Campo'
import DataTable, { type Coluna } from '../../components/DataTable'
import { useDialogs } from '../../components/Dialogs'
import Menu from '../../components/Menu'
import { Badge, PageHeader, Vazio } from '../../components/Ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { cartao } from '../../lib/util'

type Cupom = { id: string; product_id: string; codigo: string; percentual: number; usos: number; usos_max: number | null; ativo: boolean }
type Produto = { id: string; titulo: string }
type Erros = Partial<Record<'codigo' | 'percentual' | 'usos_max' | 'form', string>>

export default function Cupons() {
  useTitulo('Cupons')
  const { session } = useAuth()
  const { confirmar, avisar } = useDialogs()
  const [cupons, setCupons] = useState<Cupom[] | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [novo, setNovo] = useState({ product_id: '', codigo: '', percentual: '10', usos_max: '' })
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)

  const carregar = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([supabase.from('products').select('id, titulo').eq('produtor_id', session!.user.id), supabase.from('coupons').select('*')])
    setProdutos(p ?? []); setCupons((c ?? []) as Cupom[])
    setNovo((n) => ({ ...n, product_id: n.product_id || p?.[0]?.id || '' }))
  }
  useEffect(() => { carregar() }, [])

  async function criar(e: FormEvent) {
    e.preventDefault()
    const er: Erros = {}
    const codigo = novo.codigo.trim().toUpperCase()
    const pct = Number(novo.percentual)
    if (!/^[A-Z0-9_-]{3,20}$/.test(codigo)) er.codigo = 'Use de 3 a 20 letras, números, - ou _, sem espaços.'
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) er.percentual = 'Informe um valor de 1 a 100.'
    if (novo.usos_max && (!Number.isInteger(Number(novo.usos_max)) || Number(novo.usos_max) < 1)) er.usos_max = 'Informe um número inteiro maior que zero.'
    setErros(er); if (Object.keys(er).length) return
    setEnviando(true)
    const { error } = await supabase.from('coupons').insert({ product_id: novo.product_id, codigo, percentual: pct, usos_max: novo.usos_max ? Number(novo.usos_max) : null })
    setEnviando(false)
    if (error) return setErros({ codigo: error.message.includes('duplicate') ? 'Já existe um cupom com esse código neste produto.' : error.message })
    setNovo({ ...novo, codigo: '', usos_max: '' }); avisar(`Cupom ${codigo} criado.`); carregar()
  }

  const nome = (id: string) => produtos.find((p) => p.id === id)?.titulo ?? '—'
  const colunas: Coluna<Cupom>[] = [
    { id: 'codigo', titulo: 'Código', valor: (c) => c.codigo, render: (c) => <span className="font-mono font-medium">{c.codigo}</span> },
    { id: 'produto', titulo: 'Produto', valor: (c) => nome(c.product_id), render: (c) => <span className="block max-w-56 truncate">{nome(c.product_id)}</span> },
    { id: 'pct', titulo: 'Desconto', valor: (c) => c.percentual, render: (c) => <span className="font-mono">{c.percentual}%</span> },
    { id: 'usos', titulo: 'Usos', valor: (c) => c.usos, render: (c) => <span className="font-mono tabular-nums">{c.usos}{c.usos_max ? ` / ${c.usos_max}` : ''}</span> },
    { id: 'status', titulo: 'Status', render: (c) => <Badge className={c.ativo ? 'bg-ok/10 text-ok' : 'bg-wash text-muted'}>{c.ativo ? 'Ativo' : 'Pausado'}</Badge> },
  ]

  async function alternar(c: Cupom) { await supabase.from('coupons').update({ ativo: !c.ativo }).eq('id', c.id); avisar(c.ativo ? 'Cupom pausado.' : 'Cupom ativado.'); carregar() }
  async function apagar(c: Cupom) {
    if (!(await confirmar(`Apagar o cupom ${c.codigo}?`, { texto: 'Quem ainda não usou perde o desconto.', acao: 'Apagar', perigo: true }))) return
    await supabase.from('coupons').delete().eq('id', c.id); avisar('Cupom apagado.'); carregar()
  }

  if (produtos.length === 0 && cupons) return <><PageHeader titulo="Cupons" /><Vazio titulo="Crie um produto primeiro" texto="Os cupons são criados para um produto específico." /></>

  return (
    <>
      <PageHeader titulo="Cupons" sub="Descontos para campanhas e parcerias." />
      <form onSubmit={criar} noValidate className={`${cartao} mb-6 p-5`}>
        <h2 className="mb-3 text-lg">Novo cupom</h2>
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_110px_120px_auto]">
          <Campo rotulo="Produto" obrigatorio>{(p) => <select {...p} value={novo.product_id} onChange={(e) => setNovo({ ...novo, product_id: e.target.value })}>{produtos.map((x) => <option key={x.id} value={x.id}>{x.titulo}</option>)}</select>}</Campo>
          <Campo rotulo="Código" obrigatorio erro={erros.codigo}>{(p) => <input {...p} value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value })} placeholder="BLACK30" className={`${p.className} font-mono uppercase`} />}</Campo>
          <Campo rotulo="Desconto (%)" obrigatorio erro={erros.percentual}>{(p) => <input {...p} inputMode="numeric" value={novo.percentual} onChange={(e) => setNovo({ ...novo, percentual: e.target.value })} />}</Campo>
          <Campo rotulo="Limite de usos" erro={erros.usos_max} dica="Vazio = ilimitado">{(p) => <input {...p} inputMode="numeric" value={novo.usos_max} onChange={(e) => setNovo({ ...novo, usos_max: e.target.value })} placeholder="Ilimitado" />}</Campo>
          <Botao carregando={enviando} className="sm:mt-[26px]">Criar cupom</Botao>
        </div>
      </form>
      <DataTable<Cupom> rotulo="Lista de cupons" dados={cupons} colunas={colunas} chave={(c) => c.id}
        busca={{ placeholder: 'Buscar cupom', texto: (c) => `${c.codigo} ${nome(c.product_id)}` }}
        acoesLinha={(c) => <Menu rotulo={`Ações do cupom ${c.codigo}`} itens={[{ rotulo: c.ativo ? 'Pausar' : 'Ativar', onClick: () => alternar(c) }, { rotulo: 'Apagar', onClick: () => apagar(c), perigo: true }]} />}
        vazio={<Vazio titulo="Nenhum cupom criado" texto="Crie um cupom acima e divulgue o código para quem você quer incentivar." />} />
    </>
  )
}
