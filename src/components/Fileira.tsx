import { useRef, type ReactNode } from 'react'
import Icon from './Icon'

/** Fileira horizontal estilo catálogo de streaming. */
export function Fileira({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const rolar = (d: 1 | -1) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: 'smooth' })
  return (
    <section className="group/row relative mt-8" aria-label={titulo}>
      <h2 className="mb-3 px-4 text-xl sm:px-8">{titulo}</h2>
      <div className="relative">
        <button onClick={() => rolar(-1)} aria-label="Anterior" className="absolute inset-y-0 left-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-r from-paper to-transparent text-3xl opacity-0 transition group-hover/row:opacity-100 sm:flex"><Icon nome="esquerda" tamanho={28} /></button>
        <div ref={ref} className="flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 pb-6 pt-1 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
        <button onClick={() => rolar(1)} aria-label="Próximo" className="absolute inset-y-0 right-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-l from-paper to-transparent text-3xl opacity-0 transition group-hover/row:opacity-100 sm:flex"><Icon nome="direita" tamanho={28} /></button>
      </div>
    </section>
  )
}

export function Cartaz({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`w-64 shrink-0 snap-start transition duration-200 hover:z-10 hover:scale-[1.04] sm:w-72 ${className}`}>{children}</div>
}
