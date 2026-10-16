import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Logo } from './Logo'

/** Layout cinematográfico da área de estudo (fundo escuro, cabeçalho translúcido). */
export default function Estudo() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const link = ({ isActive }: { isActive: boolean }) => `transition ${isActive ? 'font-semibold text-ink' : 'text-ink/70 hover:text-ink'}`
  return (
    <div data-theme="dark" className="min-h-screen bg-paper text-ink">
      <header className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link to="/meus-cursos" aria-label="Início"><Logo /></Link>
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              <NavLink to="/meus-cursos" className={link}>Início</NavLink>
              <NavLink to="/loja" className={link}>Explorar</NavLink>
              <NavLink to="/afiliacao" className={link}>Afiliação</NavLink>
              {profile?.role !== 'aluno' && <NavLink to="/painel" className={link}>Painel do produtor</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/conta" className="hidden text-ink/70 hover:text-ink sm:inline">{profile?.nome?.split(' ')[0]}</Link>
            <button onClick={async () => { await supabase.auth.signOut(); nav('/loja') }} className="rounded-md border border-white/20 px-3 py-1.5 text-ink/80 hover:border-brand hover:text-brand">Sair</button>
          </div>
        </div>
      </header>
      <div id="conteudo" tabIndex={-1} className="outline-none"><Outlet /></div>
    </div>
  )
}
