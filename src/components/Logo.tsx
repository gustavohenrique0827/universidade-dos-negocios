export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0 transition-transform duration-300 hover:scale-105">
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a1d26" />
          <stop offset="1" stopColor="#101218" />
        </linearGradient>
        <linearGradient id="logoBrand" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ff8340" />
          <stop offset="1" stopColor="#ff6a1a" />
        </linearGradient>
        <filter id="logoGlow" x="38" y="4" width="26" height="26" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logoBg)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <path d="M10 46 C 22 46, 24 20, 32 20 S 42 46, 54 46" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" className="text-ink" />
      <circle cx="50" cy="15" r="7" fill="url(#logoBrand)" filter="url(#logoGlow)" />
      <circle cx="50" cy="15" r="6" fill="#ff6a1a" />
      <circle cx="51.5" cy="13.5" r="2" fill="#ffe0b2" opacity="0.8" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="group flex items-center gap-2.5 select-none">
      <LogoMark />
      <span className="font-display text-[15px] font-extrabold leading-none tracking-tight">
        <span className="block text-ink/90 group-hover:text-ink transition-colors">Universidade</span>
        <span className="text-gradient-brand mt-0.5 block font-bold">dos Negócios</span>
      </span>
    </span>
  )
}
