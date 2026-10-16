import { useEffect, useRef, type ReactNode } from 'react'
import Icon from './Icon'

/** Painel lateral para detalhes e edições rápidas, sem sair da página. */
export default function Drawer({ aberto, onFechar, titulo, children, rodape, largura = 'max-w-md' }: { aberto: boolean; onFechar: () => void; titulo: string; children: ReactNode; rodape?: ReactNode; largura?: string }) {
  const fechar = useRef<HTMLButtonElement>(null)
  const anterior = useRef<Element | null>(null)
  // onFechar costuma ser uma função nova a cada render; guardá-la em ref evita refazer o efeito
  // (e roubar o foco do campo que a pessoa está digitando).
  const aoFechar = useRef(onFechar)
  aoFechar.current = onFechar
  useEffect(() => {
    if (!aberto) return
    anterior.current = document.activeElement
    fechar.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar.current()
    document.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = ''; (anterior.current as HTMLElement | null)?.focus?.() }
  }, [aberto])
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <aside role="dialog" aria-modal="true" aria-label={titulo} className={`flex h-full w-full ${largura} flex-col border-l border-line bg-surface shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl">{titulo}</h2>
          <button ref={fechar} onClick={onFechar} aria-label="Fechar" className="rounded-md p-1.5 text-muted hover:bg-wash hover:text-ink"><Icon nome="fechar" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {rodape && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{rodape}</footer>}
      </aside>
    </div>
  )
}
