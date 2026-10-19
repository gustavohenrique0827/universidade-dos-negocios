import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type Variante = 'primario' | 'secundario' | 'terciario' | 'perigo'
const BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]'
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-gradient-to-r from-brand to-brand-dark text-on-brand shadow-lg shadow-brand/20 hover:shadow-brand/35 hover:-translate-y-0.5 active:translate-y-0',
  secundario: 'border border-line bg-surface/90 text-ink shadow-sm hover:border-brand/60 hover:bg-wash hover:text-brand hover:-translate-y-0.5 active:translate-y-0',
  terciario: 'text-muted hover:bg-wash hover:text-ink',
  perigo: 'bg-bad text-on-brand shadow-lg shadow-bad/20 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0',
}
const TAMANHOS = { p: 'px-3.5 py-1.5 text-xs', m: 'px-4.5 py-2.5 text-sm', g: 'px-6 py-3.5 text-base' }

export const classeBotao = (v: Variante = 'primario', t: keyof typeof TAMANHOS = 'm') => `${BASE} ${VARIANTES[v]} ${TAMANHOS[t]}`

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: keyof typeof TAMANHOS; carregando?: boolean; larga?: boolean }

/** Botão padrão. Com `carregando`, mostra o spinner e bloqueia cliques repetidos. */
export function Botao({ variante = 'primario', tamanho = 'm', carregando, larga, disabled, className = '', children, ...rest }: Props) {
  return (
    <button {...rest} disabled={disabled || carregando} aria-busy={carregando || undefined} className={`${classeBotao(variante, tamanho)} ${larga ? 'w-full' : ''} ${className}`}>
      {carregando && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

export function LinkBotao({ para, variante = 'primario', tamanho = 'm', larga, children, className = '' }: { para: string; variante?: Variante; tamanho?: keyof typeof TAMANHOS; larga?: boolean; children: ReactNode; className?: string }) {
  return <Link to={para} className={`${classeBotao(variante, tamanho)} ${larga ? 'w-full' : ''} ${className}`}>{children}</Link>
}
