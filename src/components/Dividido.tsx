import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

/**
 * Layout de fluxo focado em tela cheia (acesso, checkout): conteúdo à esquerda e um painel da marca
 * à direita. Sem cabeçalho e rodapé do site, para a pessoa terminar o que veio fazer.
 */
export default function Dividido({ children, lateral, rodape, largura = 'sm', lateralInvertida = false, decorativo = false }: {
  children: ReactNode; lateral: ReactNode; rodape?: ReactNode; largura?: 'sm' | 'xl'; lateralInvertida?: boolean; decorativo?: boolean
}) {
  return (
    <div className={`grid min-h-screen ${lateralInvertida ? 'lg:grid-cols-[1.15fr_minmax(380px,1fr)]' : 'lg:grid-cols-[minmax(420px,1fr)_1.15fr]'}`}>
      <main id="conteudo" tabIndex={-1} className="flex flex-col px-6 py-6 outline-none sm:px-12">
        <Link to="/loja" aria-label="Universidade dos Negócios, voltar à loja" className="w-fit"><Logo /></Link>
        <div className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${largura === 'sm' ? 'max-w-sm' : 'max-w-xl'}`}>{children}</div>
        {rodape && <div className="text-center text-xs text-muted">{rodape}</div>}
      </main>
      <aside aria-hidden={decorativo || undefined} className={`relative overflow-hidden border-line bg-surface max-lg:border-t lg:border-l ${decorativo ? 'hidden lg:flex lg:flex-col lg:justify-between lg:p-14' : 'px-6 py-8 sm:px-12 lg:px-12 lg:py-10'}`}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/10 blur-3xl" />
        {lateral}
      </aside>
    </div>
  )
}
