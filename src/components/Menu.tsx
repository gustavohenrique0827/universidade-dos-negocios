import { useEffect, useRef, useState, type ReactNode } from 'react'

export type ItemMenu = { rotulo: string; onClick: () => void; perigo?: boolean }

/** Menu de ações ("⋯") para linhas de tabela e cards. */
export default function Menu({ itens, rotulo = 'Mais ações', children }: { itens: ItemMenu[]; rotulo?: string; children?: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false)
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla) }
  }, [aberto])
  return (
    <div ref={raiz} className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setAberto(!aberto)} aria-haspopup="menu" aria-expanded={aberto} aria-label={rotulo} title={rotulo} className={`inline-flex items-center justify-center rounded-md text-muted hover:bg-wash hover:text-ink ${children ? 'px-1.5 py-1' : 'size-8'}`}>
        {children ?? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>}
      </button>
      {aberto && (
        <ul role="menu" className="absolute right-0 z-30 mt-1 min-w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
          {itens.map((i) => (
            <li key={i.rotulo} role="none"><button role="menuitem" onClick={() => { setAberto(false); i.onClick() }} className={`block w-full px-4 py-2 text-left text-sm hover:bg-wash ${i.perigo ? 'text-bad' : ''}`}>{i.rotulo}</button></li>
          ))}
        </ul>
      )}
    </div>
  )
}
