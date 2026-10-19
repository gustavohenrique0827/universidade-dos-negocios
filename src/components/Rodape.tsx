import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import Icon from './Icon'

export default function Rodape() {
  const col = 'space-y-2.5 text-sm text-muted [&_a]:transition [&_a:hover]:text-ink'
  return (
    <footer className="relative mt-24 border-t border-line/70 bg-surface/30 backdrop-blur-md max-lg:pb-24">
      {/* Luz sutil de destaque no topo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Infraestrutura educacional e cursos de alto nível para quem constrói negócios fora da curva.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-xs font-medium text-ok backdrop-blur-xs">
            <span className="size-2 rounded-full bg-ok animate-pulse" />
            <span>Todos os sistemas operacionais</span>
          </div>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink/70">Plataforma</h2>
          <ul className={col}>
            <li><Link to="/loja">Todos os cursos</Link></li>
            <li><Link to="/afiliacao">Programa de afiliados</Link></li>
            <li><Link to="/painel">Venda seu curso</Link></li>
          </ul>
        </nav>

        <nav aria-label="Conta">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink/70">Conta</h2>
          <ul className={col}>
            <li><Link to="/login">Acessar minha conta</Link></li>
            <li><Link to="/meus-cursos">Área de membros</Link></li>
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink/70">Institucional</h2>
          <ul className={col}>
            <li><Link to="/termos">Termos de uso</Link></li>
            <li><Link to="/privacidade">Privacidade e dados</Link></li>
            <li><a href="mailto:suporte@universidadedosnegocios.com.br" className="inline-flex items-center gap-1.5"><Icon nome="email" tamanho={14} /> Fale com o suporte</a></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line/60 bg-paper/50 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Universidade dos Negócios. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-muted/80">
            <span className="flex items-center gap-1.5"><Icon nome="cadeado" tamanho={13} className="text-ok" /> Ambiente Criptografado SSL 256-bit</span>
            <span>·</span>
            <span>Pix Instantâneo</span>
            <span>·</span>
            <span>Cartão de Crédito</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
