import { useEffect, useState, type FormEvent } from 'react'
import { Botao } from '../../components/Botao'
import Campo from '../../components/Campo'
import DataTable, { type Coluna } from '../../components/DataTable'
import { useDialogs } from '../../components/Dialogs'
import Icon from '../../components/Icon'
import { PageHeader, Vazio } from '../../components/Ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { useTitulo } from '../../lib/titulo'
import { baixarCSV, campo, cartao, dataBR } from '../../lib/util'

type Aluno = { user_id: string; nome: string; email: string; matriculado_em: string; progresso_pct: number }
type Produto = { id: string; titulo: string }

export default function Alunos() {
  useTitulo('Alunos')
  const { session } = useAuth()
  const { avisar } = useDialogs()
  const [produtos, setProdutos] = useState<Produto[] | null>(null)
  const [produto, setProduto] = useState('')
  const [alunos, setAlunos] = useState<Aluno[] | null>(null)
  const [email, setEmail] = useState('')
  const [erroEmail, setErroEmail] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id, titulo').eq('produtor_id', session!.user.id).then(({ data }) => { setProdutos(data ?? []); if (data?.[0]) setProduto(data[0].id) })
  }, [])

  const carregar = () => { if (produto) supabase.rpc('product_students', { p_product: produto }).then(({ data }) => setAlunos((data ?? []) as Aluno[])) }
  useEffect(() => { setAlunos(null); carregar() }, [produto])

  async function matricular(e: FormEvent) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErroEmail('Informe um e-mail válido.')
    setEnviando(true)
    const { data, error } = await supabase.rpc('enroll_by_email', { p_product: produto, p_email: email })
    setEnviando(false)
    if (error) return avisar(error.message, true)
    if (!data) return setErroEmail('Nenhuma conta encontrada com esse e-mail. A pessoa precisa se cadastrar primeiro.')
    setEmail(''); setErroEmail(''); avisar('Aluno matriculado.'); carregar()
  }

  const colunas: Coluna<Aluno>[] = [
    { id: 'nome', titulo: 'Aluno', valor: (a) => a.nome, render: (a) => <div className="min-w-0"><p className="truncate font-medium">{a.nome}</p><p className="truncate text-xs text-muted">{a.email}</p></div> },
    { id: 'data', titulo: 'Matrícula', valor: (a) => a.matriculado_em, render: (a) => <span className="text-muted">{dataBR(a.matriculado_em)}</span> },
    { id: 'prog', titulo: 'Progresso', valor: (a) => a.progresso_pct, render: (a) => <div className="flex items-center gap-3"><div className="h-1.5 w-28 rounded bg-wash"><div className="h-1.5 rounded bg-brand" style={{ width: `${a.progresso_pct}%` }} /></div><span className="font-mono text-xs tabular-nums">{a.progresso_pct}%</span></div> },
  ]
  const csv = (l: Aluno[]) => baixarCSV('alunos.csv', [['Nome', 'E-mail', 'Matrícula', 'Progresso'], ...l.map((a) => [a.nome, a.email, dataBR(a.matriculado_em), `${a.progresso_pct}%`])])

  if (produtos && produtos.length === 0) return <><PageHeader titulo="Alunos" /><Vazio titulo="Você ainda não tem produtos" texto="Crie um produto para começar a receber alunos." /></>

  return (
    <>
      <PageHeader titulo="Alunos" sub="Quem tem acesso aos seus cursos e quanto já assistiu." acoes={<Botao variante="secundario" onClick={() => csv(alunos ?? [])} disabled={!alunos?.length}><Icon nome="baixar" tamanho={15} /> Exportar CSV</Botao>} />
      <DataTable<Aluno> rotulo="Lista de alunos" dados={alunos} colunas={colunas} chave={(a) => a.user_id} selecionavel
        busca={{ placeholder: 'Buscar aluno por nome ou e-mail', texto: (a) => `${a.nome} ${a.email}` }}
        filtros={<select value={produto} onChange={(e) => setProduto(e.target.value)} aria-label="Produto" className={`${campo} max-w-64`}>{(produtos ?? []).map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select>}
        acoesSelecao={(ids) => <Botao tamanho="p" variante="secundario" onClick={() => csv((alunos ?? []).filter((a) => ids.includes(a.user_id)))}><Icon nome="baixar" tamanho={14} /> Exportar selecionados</Botao>}
        vazio={<Vazio titulo="Nenhum aluno encontrado" texto="Os alunos aparecem aqui depois de uma compra aprovada ou de uma matrícula manual." />} />
      <form onSubmit={matricular} noValidate className={`${cartao} mt-8 max-w-xl p-5`}>
        <h2 className="text-lg">Matricular manualmente</h2>
        <p className="mb-3 text-sm text-muted">Para bônus, parcerias ou vendas fora da plataforma. A pessoa precisa ter conta.</p>
        <div className="flex items-start gap-2">
          <Campo rotulo="E-mail do aluno" erro={erroEmail} className="flex-1">{(p) => <input {...p} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErroEmail('') }} placeholder="nome@email.com" />}</Campo>
          <Botao className="mt-[26px]" carregando={enviando}>Matricular</Botao>
        </div>
      </form>
    </>
  )
}
