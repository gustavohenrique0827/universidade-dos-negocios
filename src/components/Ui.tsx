import type { ReactNode } from 'react'
import { cartao } from '../lib/util'

export function PageHeader({ titulo, sub, acoes }: { titulo: string; sub?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line/60 pb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-ink">
          {titulo}
        </h1>
        {sub && <p className="mt-1.5 text-sm text-muted max-w-xl">{sub}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2.5">{acoes}</div>}
    </div>
  )
}

export function Kpi({ rotulo, valor, detalhe, destaque, icone }: { rotulo: string; valor: string; detalhe?: string; destaque?: boolean; icone?: ReactNode }) {
  if (destaque) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-brand/50 bg-gradient-to-br from-brand via-brand to-brand-dark p-5 text-on-brand shadow-xl shadow-brand/20 transition-all duration-200 hover:-translate-y-0.5">
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/20 blur-xl" />
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-on-brand/80">{rotulo}</div>
          {icone && <div className="text-on-brand/80">{icone}</div>}
        </div>
        <div className="mt-2 font-mono text-3xl font-extrabold tracking-tight tabular-nums text-on-brand">{valor}</div>
        {detalhe && <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-on-brand/90"><span className="inline-block size-1.5 rounded-full bg-white/80" />{detalhe}</div>}
      </div>
    )
  }

  return (
    <div className={`${cartao} group p-5 transition-all duration-200 hover:border-line hover:bg-surface-hover hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">{rotulo}</div>
        {icone && <div className="text-muted/70 group-hover:text-brand transition-colors">{icone}</div>}
      </div>
      <div className="mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums text-ink">{valor}</div>
      {detalhe && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted"><span className="inline-block size-1.5 rounded-full bg-brand/70" />{detalhe}</div>}
    </div>
  )
}

export function Badge({ children, className = '', dot = false }: { children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 px-3 py-0.5 text-xs font-medium shadow-sm ${className}`}>
      {dot && <span className="size-1.5 rounded-full bg-current animate-pulse-subtle" />}
      {children}
    </span>
  )
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className={`${cartao} flex flex-col items-center px-6 py-16 text-center`}>
      <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl border border-line bg-wash/80 shadow-inner">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl bg-brand/5 blur-md" />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{titulo}</h3>
      {texto && <p className="mt-1.5 max-w-sm text-sm text-muted leading-relaxed">{texto}</p>}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  )
}

export function Tabela({ colunas, children }: { colunas: string[]; children: ReactNode }) {
  return (
    <div className={`${cartao} overflow-hidden shadow-lg`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-wash/40 text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>{colunas.map((c) => <th key={c} scope="col" className="px-5 py-3.5">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line/70 [&_tr]:transition-colors [&_tr:hover]:bg-wash/30">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function Abas<T extends string>({ abas, ativa, onChange }: { abas: { id: T; rotulo: string }[]; ativa: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="mb-6 flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface/90 p-1.5 shadow-sm">
      {abas.map((a) => (
        <button key={a.id} role="tab" aria-selected={ativa === a.id} onClick={() => onChange(a.id)}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${ativa === a.id ? 'bg-gradient-to-r from-brand to-brand-dark text-on-brand shadow-md shadow-brand/20' : 'text-muted hover:text-ink hover:bg-wash/60'}`}>
          {a.rotulo}
        </button>
      ))}
    </div>
  )
}

export function Filtros({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2.5">{children}</div>
}
