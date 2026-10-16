/**
 * Capa do produto. Sem imagem enviada, gera uma capa tipográfica: cada produto recebe
 * uma paleta e uma composição própria, sempre com o ponto "fora da curva" em destaque.
 */
const PALETAS = [['#ff6a1a', '#2a0f00'], ['#7a2bff', '#10062a'], ['#0fa968', '#03180f'], ['#d6204a', '#2a0610'], ['#2f7bff', '#06122a']]

const COMPOSICOES: ((p: { x: number; y: number }) => React.ReactNode)[] = [
  // curva de sino
  ({ x, y }) => <><path d="M-5 80 C 30 80, 45 22, 80 22 S 130 80, 165 80" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2.5" /><circle cx={x} cy={y} r="5" fill="#ffc933" /></>,
  // degraus
  ({ x, y }) => <><path d="M0 84 H30 V68 H58 V52 H86 V36 H114 V20 H160" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2.5" /><circle cx={x} cy={y} r="5" fill="#ffc933" /></>,
  // anéis
  ({ x, y }) => <><g fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2"><circle cx="120" cy="40" r="18" /><circle cx="120" cy="40" r="32" /><circle cx="120" cy="40" r="48" /></g><circle cx={x - 12} cy={y + 8} r="5" fill="#ffc933" /></>,
  // barras
  ({ x, y }) => <><g fill="#fff" fillOpacity=".16">{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={74 + i * 14} y={74 - (i + 1) * 8 - (i === 5 ? 12 : 0)} width="9" height={(i + 1) * 8 + (i === 5 ? 12 : 0)} rx="2" />)}</g><circle cx={x} cy={y + 2} r="5" fill="#ffc933" /></>,
  // malha de pontos
  ({ x, y }) => <><g fill="#fff" fillOpacity=".22">{Array.from({ length: 5 }, (_, r) => Array.from({ length: 9 }, (_, c) => <circle key={`${r}-${c}`} cx={64 + c * 11} cy={14 + r * 11} r="1.6" />))}</g><circle cx={x} cy={y} r="5" fill="#ffc933" /></>,
]

export default function Capa({ url, titulo, className = '' }: { url: string | null; titulo: string; className?: string }) {
  if (url) return <img src={url} alt="" loading="lazy" className={`aspect-video w-full object-cover ${className}`} />
  const h = [...titulo].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
  const [a, b] = PALETAS[h % PALETAS.length]
  const Comp = COMPOSICOES[(h >>> 3) % COMPOSICOES.length]
  return (
    <div className={`relative aspect-video w-full overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden>
      <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">{Comp({ x: 128, y: 16 })}</svg>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8">
        <span className="line-clamp-2 font-display text-[15px] font-bold leading-tight text-white">{titulo}</span>
      </div>
    </div>
  )
}
