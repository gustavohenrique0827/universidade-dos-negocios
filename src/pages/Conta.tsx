import { useState, type FormEvent } from 'react'
import { Botao } from '../components/Botao'
import Campo from '../components/Campo'
import { useDialogs } from '../components/Dialogs'
import { PageHeader } from '../components/Ui'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTitulo } from '../lib/titulo'
import { cartao } from '../lib/util'

export default function Conta() {
  useTitulo('Minha conta')
  const { session, profile, setProfile } = useAuth()
  const { avisar } = useDialogs()
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [senha, setSenha] = useState('')
  const [erroNome, setErroNome] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [salvando, setSalvando] = useState<'nome' | 'senha' | null>(null)

  async function salvarNome(e: FormEvent) {
    e.preventDefault()
    if (nome.trim().length < 2) return setErroNome('Informe seu nome.')
    setSalvando('nome')
    const { error } = await supabase.from('profiles').update({ nome: nome.trim() }).eq('id', session!.user.id)
    setSalvando(null)
    if (error) return avisar(error.message, true)
    if (profile) setProfile({ ...profile, nome: nome.trim() })
    setErroNome(''); avisar('Nome atualizado.')
  }
  async function trocarSenha(e: FormEvent) {
    e.preventDefault()
    if (senha.length < 6) return setErroSenha('A senha precisa ter pelo menos 6 caracteres.')
    setSalvando('senha')
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(null)
    if (error) return avisar(error.message, true)
    setSenha(''); setErroSenha(''); avisar('Senha alterada.')
  }

  return (
    <>
      <PageHeader titulo="Minha conta" sub="Seus dados de acesso." />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <form onSubmit={salvarNome} noValidate className={`${cartao} space-y-4 p-5`}>
          <h2 className="text-lg">Dados pessoais</h2>
          <Campo rotulo="Nome" obrigatorio erro={erroNome}>{(p) => <input {...p} value={nome} onChange={(e) => { setNome(e.target.value); setErroNome('') }} />}</Campo>
          <Campo rotulo="E-mail" dica="O e-mail de acesso não pode ser alterado por aqui.">{(p) => <input {...p} value={session?.user.email ?? ''} readOnly />}</Campo>
          <Botao carregando={salvando === 'nome'}>Salvar</Botao>
        </form>
        <form onSubmit={trocarSenha} noValidate className={`${cartao} space-y-4 p-5`}>
          <h2 className="text-lg">Senha</h2>
          <Campo rotulo="Nova senha" obrigatorio erro={erroSenha} dica="Mínimo de 6 caracteres.">{(p) => <input {...p} type="password" autoComplete="new-password" value={senha} onChange={(e) => { setSenha(e.target.value); setErroSenha('') }} />}</Campo>
          <Botao carregando={salvando === 'senha'}>Alterar senha</Botao>
        </form>
      </div>
    </>
  )
}
