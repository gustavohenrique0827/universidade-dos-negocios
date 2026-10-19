/**
 * Capa do produto. Quando não há imagem personalizada enviada pelo produtor,
 * exibe um layout editorial minimalista em tons escuros refinados e geometria sóbria.
 */
const TONS = [
  { bg: 'from-zinc-900 via-neutral-900 to-black', acento: 'text-zinc-500', linha: 'border-zinc-800/80', padrao: 'circulo' },
  { bg: 'from-slate-900 via-zinc-950 to-black', acento: 'text-slate-500', linha: 'border-slate-800/80', padrao: 'linhas' },
  { bg: 'from-stone-900 via-neutral-950 to-black', acento: 'text-stone-500', linha: 'border-stone-800/80', padrao: 'grade' },
  { bg: 'from-neutral-900 via-zinc-900 to-stone-950', acento: 'text-neutral-500', linha: 'border-neutral-800/80', padrao: 'arco' },
]

export default function Capa({
  url,
  titulo,
  className = '',
  mostrarTitulo = false,
}: {
  url: string | null
  titulo: string
  className?: string
  mostrarTitulo?: boolean
}) {
  if (url) {
    return <img src={url} alt="" loading="lazy" className={`aspect-video w-full object-cover ${className}`} />
  }

  // Gera variação determinística baseada no título
  const hash = [...titulo].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)
  const tema = TONS[hash % TONS.length]

  // Iniciais elegantes para o monograma da capa
  const palavras = titulo.trim().split(/\s+/).filter(Boolean)
  const iniciais = palavras.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'UN'

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${tema.bg} select-none ${className}`}
      aria-hidden
    >
      {/* Textura geométrica sutil e minimalista */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
      >
        <defs>
          <pattern id={`grid-${hash}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${hash})`} />
      </svg>

      {/* Destaque sutil de iluminação */}
      <div className="absolute -top-12 -right-12 size-36 rounded-full bg-brand/10 blur-2xl pointer-events-none" />

      {/* Monograma editorial centralizado */}
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Formação
          </span>
          <div className="size-1.5 rounded-full bg-brand/60" />
        </div>

        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 font-mono text-sm font-semibold tracking-wider text-zinc-300 backdrop-blur-xs">
            {iniciais}
          </div>
          {mostrarTitulo && (
            <p className="line-clamp-2 font-display text-sm font-semibold leading-snug text-white">
              {titulo}
            </p>
          )}
        </div>

        <div className="h-0.5 w-8 rounded-full bg-brand/40" />
      </div>
    </div>
  )
}
