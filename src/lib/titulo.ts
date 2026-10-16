import { useEffect } from 'react'

/** Define o título da aba do navegador para a página atual. */
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Universidade dos Negócios` : 'Universidade dos Negócios'
  }, [titulo])
}
