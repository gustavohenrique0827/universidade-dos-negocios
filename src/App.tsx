import type { ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { TelaCarregando } from './components/Esqueleto'
import { Logo } from './components/Logo'
import Rodape from './components/Rodape'
import Shell from './components/Shell'
import Icon from './components/Icon'
import { useTema } from './lib/tema'
import { useAuth } from './lib/auth'
import { MODO_DEMO } from './lib/supabase'
import Afiliacao from './pages/aluno/Afiliacao'
import MeusCursos from './pages/aluno/MeusCursos'
import Certificado from './pages/Certificado'
import Conta from './pages/Conta'
import Checkout from './pages/Checkout'
import Estudo from './components/Estudo'
import Aula from './pages/aluno/Aula'
import AtividadeAluno from './pages/aluno/AtividadeAluno'
import CursoHome from './pages/aluno/CursoHome'
import Legal from './pages/Legal'
import Login from './pages/Login'
import NaoEncontrada from './pages/NaoEncontrada'
import Loja from './pages/Loja'
import Afiliados from './pages/painel/Afiliados'
import Alunos from './pages/painel/Alunos'
import Cupons from './pages/painel/Cupons'
import Dashboard from './pages/painel/Dashboard'
import Financeiro from './pages/painel/Financeiro'
import ProdutoEditor from './pages/painel/ProdutoEditor'
import Produtos from './pages/painel/Produtos'
import Vendas from './pages/painel/Vendas'
import Produto from './pages/Produto'

function Protected({ children, produtor }: { children: ReactNode; produtor?: boolean }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <TelaCarregando />
  if (!session) return <Navigate to="/login" replace />
  if (produtor && profile?.role === 'aluno') return <Navigate to="/meus-cursos" replace />
  return <>{children}</>
}

function Inicio() {
  const { session, profile, loading } = useAuth()
  if (loading) return <TelaCarregando />
  if (!session) return <Navigate to="/loja" replace />
  return <Navigate to={profile?.role === 'aluno' ? '/meus-cursos' : '/painel'} replace />
}

function Header() {
  const { session } = useAuth()
  const { tema, alternar } = useTema()
  const link = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
      isActive ? 'text-ink bg-wash/80 font-semibold shadow-xs' : 'text-muted hover:text-ink hover:bg-wash/50'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/75 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/loja" aria-label="Universidade dos Negócios, início" className="transition-transform hover:scale-[1.01]">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-1.5 md:flex">
            <NavLink to="/loja" className={link}>Cursos</NavLink>
            <NavLink to="/afiliacao" className={link}>Seja afiliado</NavLink>
            <NavLink to="/painel" className={link}>Venda seu curso</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={alternar}
            aria-label={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
            className="flex size-9 items-center justify-center rounded-xl text-muted hover:bg-wash hover:text-ink transition-colors"
          >
            <Icon nome={tema === 'dark' ? 'sol' : 'lua'} tamanho={17} />
          </button>
          {session ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-bold text-on-brand shadow-lg shadow-brand/20 transition-all hover:shadow-brand/35 hover:-translate-y-0.5"
            >
              Meu painel
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink/80 hover:bg-wash hover:text-ink transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/login?modo=criar"
                className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-bold text-on-brand shadow-md shadow-brand/20 hover:shadow-brand/35 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

const PularNav = () => <a href="#conteudo" className="sr-only z-50 rounded-md bg-brand px-3 py-2 font-semibold text-on-brand focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Pular para o conteúdo</a>
const comHeader = () => <><PularNav /><Header /><div id="conteudo" tabIndex={-1} className="min-h-[70vh] outline-none"><Outlet /></div><Rodape /></>

function FaixaDemo() {
  if (!MODO_DEMO) return null
  return <div role="note" className="bg-brand px-4 py-1.5 text-center text-xs font-semibold text-on-brand">Versão de demonstração: os dados são fictícios e não são salvos. Não use dados reais.</div>
}

export default function App() {
  return (
    <>
    <FaixaDemo />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/checkout/:slug" element={<Checkout />} />
      <Route element={comHeader()}>
        <Route path="/loja" element={<Loja />} />
        <Route path="/p/:slug" element={<Produto />} />
        <Route path="/certificado/:codigo" element={<Certificado />} />
        <Route path="/termos" element={<Legal tipo="termos" />} />
        <Route path="/privacidade" element={<Legal tipo="privacidade" />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
      <Route element={<Protected><Estudo /></Protected>}>
        <Route path="/meus-cursos" element={<MeusCursos />} />
        <Route path="/curso/:id" element={<CursoHome />} />
        <Route path="/curso/:id/aula/:aulaId" element={<Aula />} />
        <Route path="/curso/:id/atividade/:aid" element={<AtividadeAluno />} />
      </Route>
      <Route element={<Protected><Shell /></Protected>}>
        <Route path="/afiliacao" element={<Afiliacao />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="/painel" element={<Protected produtor><Dashboard /></Protected>} />
        <Route path="/painel/produtos" element={<Protected produtor><Produtos /></Protected>} />
        <Route path="/painel/produtos/:id" element={<Protected produtor><ProdutoEditor /></Protected>} />
        <Route path="/painel/vendas" element={<Protected produtor><Vendas /></Protected>} />
        <Route path="/painel/alunos" element={<Protected produtor><Alunos /></Protected>} />
        <Route path="/painel/cupons" element={<Protected produtor><Cupons /></Protected>} />
        <Route path="/painel/afiliados" element={<Protected produtor><Afiliados /></Protected>} />
        <Route path="/painel/financeiro" element={<Protected produtor><Financeiro /></Protected>} />
      </Route>
      <Route path="/" element={<Inicio />} />
    </Routes>
    </>
  )
}
