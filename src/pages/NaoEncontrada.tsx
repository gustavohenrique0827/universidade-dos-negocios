import { Link } from 'react-router-dom'
import { useTitulo } from '../lib/titulo'

export default function NaoEncontrada() {
  useTitulo('Página não encontrada')
  return (
    <main className="relative mx-auto grid max-w-xl place-items-center overflow-visible px-4 py-24 text-center">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 size-80 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
      <svg viewBox="0 0 200 90" className="w-64" role="img" aria-label="Um ponto amarelo longe da curva"><path className="stroke-line" d="M10 80 C 50 80, 60 20, 100 20 S 150 80, 190 80" fill="none" strokeWidth="4" strokeLinecap="round" /><circle className="fill-outlier" cx="168" cy="14" r="7" /></svg>
      <h1 className="mt-6 text-5xl">Fora da curva demais.</h1>
      <p className="mt-3 text-muted">Não encontramos essa página. O endereço pode estar errado ou o conteúdo foi removido.</p>
      <div className="mt-6 flex gap-3"><Link to="/loja" className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand hover:bg-brand-dark">Ver cursos</Link><Link to="/" className="rounded-lg border border-line px-5 py-2.5 font-medium hover:border-brand">Ir para o início</Link></div>
    </main>
  )
}
