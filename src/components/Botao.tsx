import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type Variante = 'primario' | 'secundario' | 'terciario' | 'perigo'
const BASE = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50'
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-brand text-on-brand hover:bg-brand-dark',
  secundario: 'border border-line bg-surface text-ink hover:border-brand hover:text-brand',
  terciario: 'text-muted hover:bg-wash hover:text-ink',
  perigo: 'bg-bad text-on-brand hover:opacity-90',
}
const TAMANHOS = { p: 'px-3 py-1.5 text-sm', m: 'px-4 py-2 text-sm', g: 'px-6 py-3 text-base' }

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
