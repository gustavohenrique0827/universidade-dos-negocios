import type { ReactNode } from 'react'
import { cartao } from '../lib/util'

export function PageHeader({ titulo, sub, acoes }: { titulo: string; sub?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl">{titulo}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  )
}

export function Kpi({ rotulo, valor, detalhe, destaque }: { rotulo: string; valor: string; detalhe?: string; destaque?: boolean }) {
  return (
    <div className={destaque ? 'rounded-xl border border-brand bg-brand p-4 text-on-brand' : `${cartao} p-4`}>
      <div className={`text-xs font-medium uppercase tracking-wide ${destaque ? 'text-on-brand/70' : 'text-muted'}`}>{rotulo}</div>
      <div className="mt-1.5 font-mono text-2xl font-medium tabular-nums">{valor}</div>
      {detalhe && <div className={`mt-1 text-xs ${destaque ? 'text-on-brand/70' : 'text-muted'}`}>{detalhe}</div>}
    </div>
  )
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className={`${cartao} flex flex-col items-center px-6 py-12 text-center`}>
      <svg width="56" height="32" viewBox="0 0 56 32" aria-hidden className="mb-3"><path className="stroke-line" d="M2 30 C 14 30, 18 4, 28 4 S 42 30, 54 30" fill="none" strokeWidth="3" strokeLinecap="round" /></svg>
      <p className="font-display text-lg font-bold">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-muted">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}

export function Tabela({ colunas, children }: { colunas: string[]; children: ReactNode }) {
  return (
    <div className={`${cartao} overflow-x-auto`}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <tr>{colunas.map((c) => <th key={c} scope="col" className="px-4 py-3 font-medium">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export function Abas<T extends string>({ abas, ativa, onChange }: { abas: { id: T; rotulo: string }[]; ativa: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
      {abas.map((a) => (
        <button key={a.id} role="tab" aria-selected={ativa === a.id} onClick={() => onChange(a.id)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${ativa === a.id ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'}`}>
          {a.rotulo}
        </button>
      ))}
    </div>
  )
}

export function Filtros({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}
