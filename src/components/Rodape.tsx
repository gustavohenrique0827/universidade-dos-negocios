import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export default function Rodape() {
  const col = 'space-y-2 text-sm text-muted [&_a:hover]:text-ink'
  return (
    <footer className="mt-20 border-t border-line max-lg:pb-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">Cursos e infoprodutos para quem constrói negócios fora da curva.</p>
        </div>
        <nav aria-label="Plataforma"><h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/60">Plataforma</h2>
          <ul className={col}><li><Link to="/loja">Todos os cursos</Link></li><li><Link to="/afiliacao">Seja afiliado</Link></li><li><Link to="/painel">Venda seu curso</Link></li></ul></nav>
        <nav aria-label="Conta"><h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/60">Conta</h2>
          <ul className={col}><li><Link to="/login">Entrar</Link></li><li><Link to="/meus-cursos">Meus cursos</Link></li></ul></nav>
        <nav aria-label="Institucional"><h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/60">Institucional</h2>
          <ul className={col}><li><Link to="/termos">Termos de uso</Link></li><li><Link to="/privacidade">Política de privacidade</Link></li><li><a href="mailto:suporte@universidadedosnegocios.com.br">Suporte</a></li></ul></nav>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} Universidade dos Negócios. Todos os direitos reservados.</div>
    </footer>
  )
}
