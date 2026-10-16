import { useEffect, useState } from 'react'
import { Botao } from '../../components/Botao'
import DataTable, { type Coluna } from '../../components/DataTable'
import { useDialogs } from '../../components/Dialogs'
import { Kpi, PageHeader, Vazio } from '../../components/Ui'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { brl } from '../../lib/util'

type Linha = { afiliado_id: string; nome: string; product_id: string; titulo: string; codigo: string; vendas: number; comissao_centavos: number; pendente_centavos: number }
type Comissao = { id: string; order_id: string; valor_centavos: number; status: string }

export default function Afiliados() {
  useTitulo('Meus afiliados')
  const { confirmar, avisar } = useDialogs()
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [ocupado, setOcupado] = useState(false)

  const carregar = async () => {
    const [{ data: l }, { data: c }] = await Promise.all([supabase.rpc('my_affiliates'), supabase.from('commissions').select('id, order_id, valor_centavos, status')])
    setLinhas((l ?? []) as Linha[]); setComissoes((c ?? []) as Comissao[])
  }
  useEffect(() => { carregar() }, [])

  async function quitarTodas() {
    const pend = comissoes.filter((c) => c.status === 'pendente')
    if (!pend.length) return
    const total = brl(pend.reduce((n, c) => n + c.valor_centavos, 0))
    if (!(await confirmar(`Marcar ${pend.length} comissões como pagas?`, { texto: `Total de ${total}. Faça o repasse aos afiliados antes de confirmar.`, acao: 'Marcar como pagas' }))) return
    setOcupado(true)
    await Promise.all(pend.map((c) => supabase.from('commissions').update({ status: 'paga' }).eq('id', c.id)))
    setOcupado(false); avisar('Comissões marcadas como pagas.'); carregar()
  }

  const pendente = comissoes.filter((c) => c.status === 'pendente').reduce((n, c) => n + c.valor_centavos, 0)
  const paga = comissoes.filter((c) => c.status === 'paga').reduce((n, c) => n + c.valor_centavos, 0)
  const colunas: Coluna<Linha>[] = [
    { id: 'nome', titulo: 'Afiliado', valor: (l) => l.nome, render: (l) => <span className="font-medium">{l.nome}</span> },
    { id: 'produto', titulo: 'Produto', valor: (l) => l.titulo, render: (l) => <span className="block max-w-56 truncate">{l.titulo}</span> },
    { id: 'link', titulo: 'Link', render: (l) => <span className="font-mono text-xs text-muted">{l.codigo}</span> },
    { id: 'vendas', titulo: 'Vendas', valor: (l) => l.vendas, render: (l) => <span className="font-mono tabular-nums">{l.vendas}</span> },
    { id: 'com', titulo: 'Comissão gerada', valor: (l) => l.comissao_centavos, render: (l) => <span className="font-mono tabular-nums">{brl(l.comissao_centavos)}</span> },
    { id: 'pend', titulo: 'A pagar', valor: (l) => l.pendente_centavos, render: (l) => <span className="font-mono tabular-nums">{brl(l.pendente_centavos)}</span> },
  ]

  return (
    <>
      <PageHeader titulo="Meus afiliados" sub="Quem divulga seus produtos e quanto cada um gerou." acoes={pendente > 0 ? <Botao carregando={ocupado} onClick={quitarTodas}>Marcar pendentes como pagas</Botao> : undefined} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md"><Kpi rotulo="A pagar" valor={brl(pendente)} /><Kpi rotulo="Já pagas" valor={brl(paga)} /></div>
      <DataTable<Linha> rotulo="Afiliados" dados={linhas} colunas={colunas} chave={(l) => l.codigo}
        busca={{ placeholder: 'Buscar afiliado ou produto', texto: (l) => `${l.nome} ${l.titulo}` }}
        vazio={<Vazio titulo="Nenhum afiliado ainda" texto="Defina uma comissão na aba Afiliação do produto e ele aparece no marketplace." />} />
    </>
  )
}
