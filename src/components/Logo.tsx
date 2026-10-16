export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect className="stroke-line fill-surface" width="64" height="64" rx="14" strokeWidth="2" />
      <path className="stroke-ink" d="M6 46 C 20 46, 22 18, 32 18 S 44 46, 58 46" fill="none" strokeWidth="4" strokeLinecap="round" />
      <circle className="fill-brand" cx="50" cy="14" r="6" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[15px] font-bold leading-none tracking-tight">
        Universidade<br /><span className="text-brand">dos Negócios</span>
      </span>
    </span>
  )
}
