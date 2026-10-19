import { useState } from 'react'

type Ponto = { rotulo: string; valor: number }

/** Gráfico de área com tooltip. `formato` formata os valores do eixo e da dica. */
export default function AreaChart({ dados, formato, altura = 230, titulo }: { dados: Ponto[]; formato: (v: number) => string; altura?: number; titulo: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = altura, P = { t: 16, r: 16, b: 28, l: 68 }
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
    <div className="relative pt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label={`${titulo}. Total no período: ${formato(total)}.`} onMouseMove={mover} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6a1a" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#ff6a1a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ff6a1a" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="stroke-line/60" x1={P.l} x2={W - P.r} y1={y(topo * f)} y2={y(topo * f)} strokeDasharray={f ? '4 4' : undefined} />
            <text className="fill-muted/80 text-[10px] font-mono" x={P.l - 10} y={y(topo * f) + 4} textAnchor="end">
              {f === 0 ? '0' : formato(Math.round(topo * f))}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#chartGlow)" />
        <path d={linha} fill="none" stroke="#ff6a1a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {dados.map((d, i) => i % passo === 0 && (
          <text className="fill-muted/80 text-[10px] font-mono" key={i} x={x(i)} y={H - 6} textAnchor="middle">
            {d.rotulo}
          </text>
        ))}

        {hover !== null && h && (
          <g>
            <line stroke="rgba(255,255,255,0.2)" x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.valor)} r="6" fill="#ff6a1a" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover !== null && h && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-xl border border-brand/40 bg-surface/95 px-3 py-2 text-xs text-ink shadow-2xl backdrop-blur-md transition-all duration-75"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <div className="text-[11px] font-medium text-muted">{h.rotulo}</div>
          <div className="font-mono text-sm font-bold text-brand">{formato(h.valor)}</div>
        </div>
      )}
    </div>
  )
}
