import { useCallback, useEffect, useState } from 'react'

export type Tema = 'dark' | 'light'
const CHAVE = 'un_tema'

export const temaAtual = (): Tema => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

/** Alterna entre tema escuro (padrão) e claro; a escolha fica salva no navegador. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(temaAtual)
  useEffect(() => { document.documentElement.dataset.theme = tema }, [tema])
  const alternar = useCallback(() => {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(CHAVE, novo) } catch { /* modo privado: segue sem persistir */ }
    setTema(novo)
  }, [])
  return { tema, alternar }
}
