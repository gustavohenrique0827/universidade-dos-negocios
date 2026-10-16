/** Placeholders de carregamento que preservam o layout da página. */
export const Bloco = ({ className = '' }: { className?: string }) => <div aria-hidden className={`animate-pulse rounded-lg bg-wash ${className}`} />

export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return <div role="status" aria-label="Carregando" className="space-y-3">{Array.from({ length: linhas }, (_, i) => <Bloco key={i} className="h-14" />)}</div>
}
export function EsqueletoGrade({ n = 3 }: { n?: number }) {
  return <div role="status" aria-label="Carregando" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: n }, (_, i) => <Bloco key={i} className="aspect-[4/3]" />)}</div>
}
export function EsqueletoPainel() {
  return <div role="status" aria-label="Carregando" className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Bloco key={i} className="h-28" />)}</div><Bloco className="h-72" /></div>
}

export function TelaCarregando({ escuro = false }: { escuro?: boolean }) {
  return (
    <div role="status" aria-label="Carregando" className={`grid min-h-[60vh] place-items-center ${escuro ? 'pt-20' : ''}`}>
      <svg width="64" height="36" viewBox="0 0 64 36" aria-hidden><path className="stroke-line" d="M3 33 C 16 33, 20 4, 32 4 S 48 33, 61 33" fill="none" strokeWidth="3" strokeLinecap="round" /><path d="M3 33 C 16 33, 20 4, 32 4 S 48 33, 61 33" fill="none" strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray=".25 .75" className="stroke-brand animate-[curva_1.2s_linear_infinite]" /></svg>
    </div>
  )
}
