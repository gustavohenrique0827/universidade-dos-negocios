import { useState } from 'react'

type Ponto = { rotulo: string; valor: number }

/** Gráfico de área com tooltip. `formato` formata os valores do eixo e da dica. */
export default function AreaChart({ dados, formato, altura = 220, titulo }: { dados: Ponto[]; formato: (v: number) => string; altura?: number; titulo: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = altura, P = { t: 12, r: 12, b: 26, l: 64 }
  const max = Math.max(1, ...dados.map((d) => d.valor))
  const topo = Math.ceil(max * 1.1)
  const x = (i: number) => P.l + (dados.length <= 1 ? 0 : (i * (W - P.l - P.r)) / (dados.length - 1))
  const y = (v: number) => P.t + (1 - v / topo) * (H - P.t - P.b)
  const linha = dados.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.valor).toFixed(1)}`).join(' ')
  const area = `${linha} L${x(dados.length - 1).toFixed(1)} ${H - P.b} L${x(0).toFixed(1)} ${H - P.b} Z`
  const total = dados.reduce((n, d) => n + d.valor, 0)
  const passo = Math.max(1, Math.ceil(dados.length / 6))

  function mover(e: React.MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(Math.max(0, Math.min(dados.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (dados.length - 1)))))
  }

  const h = hover !== null ? dados[hover] : null
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${titulo}. Total no período: ${formato(total)}.`} onMouseMove={mover} onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => <g key={f}><line className="stroke-line" x1={P.l} x2={W - P.r} y1={y(topo * f)} y2={y(topo * f)} strokeDasharray={f ? '3 4' : undefined} /><text className="fill-muted" x={P.l - 8} y={y(topo * f) + 4} fontSize="11" textAnchor="end" fontFamily="JetBrains Mono, monospace">{f === 0 ? '0' : formato(Math.round(topo * f))}</text></g>)}
        <path className="fill-brand" d={area} opacity=".1" />
        <path className="stroke-brand" d={linha} fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {dados.map((d, i) => i % passo === 0 && <text className="fill-muted" key={i} x={x(i)} y={H - 8} fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{d.rotulo}</text>)}
        {hover !== null && h && (
          <g>
            <line className="stroke-ink" x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} strokeOpacity=".25" />
            <circle className="stroke-surface fill-outlier" cx={x(hover)} cy={y(h.valor)} r="5" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && h && (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-wash px-2.5 py-1.5 text-xs text-ink shadow-lg" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <div className="text-on-brand/70">{h.rotulo}</div><div className="font-mono font-medium">{formato(h.valor)}</div>
        </div>
      )}
    </div>
  )
}
