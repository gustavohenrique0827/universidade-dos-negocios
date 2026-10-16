/** A curva de sino é "todo mundo". O ponto amarelo é quem saiu dela. */
export default function CurveHero() {
  return (
    <svg viewBox="0 0 640 300" className="w-full" role="img" aria-label="Uma curva de sino com um ponto amarelo posicionado acima dela, fora da curva">
      <line className="stroke-line" x1="0" y1="260" x2="640" y2="260" strokeWidth="2" />
      <path d="M20 260 C 150 260, 200 70, 320 70 S 490 260, 620 260" fill="none" strokeWidth="5" strokeLinecap="round" pathLength={1} className="stroke-ink curve-line" />
      <path className="fill-brand" d="M20 260 C 150 260, 200 70, 320 70 S 490 260, 620 260 Z" opacity=".1" />
      <g className="outlier-dot">
        <circle className="fill-outlier" cx="520" cy="60" r="16" />
        <circle className="stroke-outlier" cx="520" cy="60" r="28" fill="none" strokeWidth="2" opacity=".5" />
      </g>
      <text className="fill-muted" x="478" y="22" fontFamily="JetBrains Mono, monospace" fontSize="13">fora da curva</text>
      <text className="fill-muted" x="268" y="286" fontFamily="JetBrains Mono, monospace" fontSize="13">a média</text>
    </svg>
  )
}
