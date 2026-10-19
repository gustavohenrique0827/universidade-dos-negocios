import { useRef, type ReactNode } from 'react'
import Icon from './Icon'

/** Fileira horizontal estilo catálogo de streaming cinematográfico. */
export function Fileira({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const rolar = (d: 1 | -1) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: 'smooth' })

  return (
    <section className="group/row relative mt-10" aria-label={titulo}>
      <div className="flex items-center justify-between px-4 sm:px-8 mb-3.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
          {titulo}
        </h2>
      </div>
      <div className="relative">
        <button
          onClick={() => rolar(-1)}
          aria-label="Anterior"
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 hidden size-11 items-center justify-center rounded-full border border-white/15 bg-paper/85 text-ink shadow-2xl backdrop-blur-md opacity-0 transition-all duration-200 hover:scale-110 hover:border-brand/50 hover:text-brand group-hover/row:opacity-100 sm:flex"
        >
          <Icon nome="esquerda" tamanho={20} />
        </button>
        <div
          ref={ref}
          className="flex snap-x gap-4 overflow-x-auto scroll-smooth px-4 pb-6 pt-1 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        <button
          onClick={() => rolar(1)}
          aria-label="Próximo"
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 hidden size-11 items-center justify-center rounded-full border border-white/15 bg-paper/85 text-ink shadow-2xl backdrop-blur-md opacity-0 transition-all duration-200 hover:scale-110 hover:border-brand/50 hover:text-brand group-hover/row:opacity-100 sm:flex"
        >
          <Icon nome="direita" tamanho={20} />
        </button>
      </div>
    </section>
  )
}

export function Cartaz({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-64 shrink-0 snap-start transition-all duration-300 hover:z-20 hover:-translate-y-1 sm:w-72 ${className}`}>
      {children}
    </div>
  )
}
