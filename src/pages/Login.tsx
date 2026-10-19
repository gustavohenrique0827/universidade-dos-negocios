import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Botao } from '../components/Botao'
import Campo from '../components/Campo'
import CurveHero from '../components/CurveHero'
import Dividido from '../components/Dividido'
import Icon from '../components/Icon'
import { useAuth } from '../lib/auth'
import { MODO_DEMO, supabase } from '../lib/supabase'
import { useTitulo } from '../lib/titulo'

type Erros = Partial<Record<'nome' | 'email' | 'senha' | 'form', string>>
type Modo = 'entrar' | 'criar'

const CONTAS_DEMO = [['Produtor', 'produtor@demo.com'], ['Aluno', 'aluno@demo.com'], ['Afiliado', 'afiliado@demo.com']]
const BENEFICIOS: { icone: 'play' | 'diploma' | 'cadeado'; texto: string }[] = [
  { icone: 'play', texto: 'Cursos em vídeo para assistir quando e onde quiser' },
  { icone: 'diploma', texto: 'Certificado ao concluir cada curso' },
  { icone: 'cadeado', texto: 'Pagamento por Pix, cartão ou boleto' },
]

export default function Login() {
  const { session } = useAuth()
  const voltar = (useLocation().state as { voltar?: string } | null)?.voltar ?? '/'
  const [params] = useSearchParams()
  const [modo, setModo] = useState<Modo>(params.get('modo') === 'criar' ? 'criar' : 'entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [erros, setErros] = useState<Erros>({})
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  useTitulo(modo === 'entrar' ? 'Entrar' : 'Criar conta')

  if (session) return <Navigate to={voltar} replace />

  function trocar(m: Modo) { setModo(m); setErros({}); setAviso('') }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const er: Erros = {}
    if (modo === 'criar' && nome.trim().length < 2) er.nome = 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = 'Informe um e-mail válido, como nome@email.com.'
    if (senha.length < 6) er.senha = 'A senha precisa ter pelo menos 6 caracteres.'
    setErros(er); setAviso('')
    if (Object.keys(er).length) return
    setEnviando(true)
    const { error } = modo === 'entrar'
      ? await supabase.auth.signInWithPassword({ email, password: senha })
      : await supabase.auth.signUp({ email, password: senha, options: { data: { nome: nome.trim() } } })
    setEnviando(false)
    if (error) setErros({ form: error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : error.message })
    else if (modo === 'criar') setAviso('Conta criada. Se a confirmação por e-mail estiver ativa, confira sua caixa de entrada.')
  }

  const termos = <>Ao continuar, você concorda com os <Link to="/termos" className="underline hover:text-ink">Termos de uso</Link> e a <Link to="/privacidade" className="underline hover:text-ink">Política de privacidade</Link>.</>
  const lateral = (
    <div className="relative flex h-full flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand">
          Universidade dos Negócios
        </div>
        <h2 className="mt-5 max-w-md text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight text-ink">
          Negócios fora da curva se aprendem com <span className="text-gradient-brand">quem já construiu.</span>
        </h2>
      </div>

      <div className="relative my-8"><CurveHero /></div>

      <ul className="relative space-y-3">
        {BENEFICIOS.map((b) => (
          <li key={b.texto} className="flex items-center gap-3.5 rounded-xl border border-line/60 bg-surface/60 p-3.5 text-xs text-ink/90 backdrop-blur-md">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand shadow-inner">
              <Icon nome={b.icone} tamanho={17} />
            </span>
            <span className="font-medium">{b.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <Dividido lateral={lateral} rodape={termos} decorativo>
      <div className="rounded-3xl border border-line/80 bg-surface/85 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {modo === 'entrar' ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {modo === 'entrar' ? 'Entre para continuar seu aprendizado.' : 'Comece a construir hoje. Leva menos de 1 minuto.'}
        </p>

        <div role="tablist" aria-label="Acesso" className="mt-7 grid grid-cols-2 rounded-2xl border border-line bg-wash/50 p-1.5">
          {([['entrar', 'Entrar'], ['criar', 'Criar conta']] as [Modo, string][]).map(([m, t]) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={modo === m}
              onClick={() => trocar(m)}
              className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer ${
                modo === m
                  ? 'bg-gradient-to-r from-brand to-brand-dark text-on-brand shadow-md shadow-brand/20'
                  : 'text-muted hover:text-ink hover:bg-wash/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
          {modo === 'criar' && (
            <Campo rotulo="Nome completo" obrigatorio erro={erros.nome}>
              {(p) => <input {...p} autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />}
            </Campo>
          )}
          <Campo rotulo="E-mail" obrigatorio erro={erros.email}>
            {(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@email.com" />}
          </Campo>
          <Campo rotulo="Senha" obrigatorio erro={erros.senha} dica={modo === 'criar' ? 'Mínimo de 6 caracteres.' : undefined}>
            {(p) => (
              <div className="relative">
                <input {...p} type={ver ? 'text' : 'password'} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} value={senha} onChange={(e) => setSenha(e.target.value)} className={`${p.className} pr-20`} placeholder="••••••••" />
                <button type="button" onClick={() => setVer(!ver)} aria-pressed={ver} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-muted hover:text-brand transition-colors cursor-pointer">{ver ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            )}
          </Campo>
          {erros.form && <p role="alert" className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2.5 text-xs font-semibold text-bad">{erros.form}</p>}
          {aviso && <p role="status" className="rounded-xl border border-ok/30 bg-ok/10 px-4 py-2.5 text-xs font-semibold text-ok">{aviso}</p>}
          <Botao larga tamanho="g" className="mt-2 shadow-lg shadow-brand/25" carregando={enviando}>{modo === 'entrar' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}</Botao>
        </form>

        {MODO_DEMO && (
          <div className="mt-6 rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Acesso Rápido de Testes</p>
            <p className="mt-1 text-xs text-muted">Selecione um perfil para preenchimento com 1 clique (senha: <code className="text-ink font-mono font-bold">demo1234</code>):</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CONTAS_DEMO.map(([t, e]) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { trocar('entrar'); setEmail(e); setSenha('demo1234') }}
                  className="rounded-xl border border-line bg-surface/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-xs transition-all hover:border-brand hover:text-brand hover:-translate-y-0.5 cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dividido>
  )
}
