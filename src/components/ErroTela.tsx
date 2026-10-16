import { Component, type ReactNode } from 'react'

/** Evita tela em branco: qualquer erro de renderização cai aqui, com saída para o usuário. */
export default class ErroTela extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false }
  static getDerivedStateFromError() { return { erro: true } }
  componentDidCatch(e: unknown) { console.error('Erro de renderização:', e) }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <main className="grid min-h-screen place-items-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl">Algo saiu do previsto.</h1>
          <p className="mt-3 text-muted">Não conseguimos carregar esta página. Tente recarregar; se continuar, fale com o suporte.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand hover:bg-brand-dark">Recarregar</button>
            <a href="/loja" className="rounded-lg border border-line px-5 py-2.5 font-medium hover:border-brand">Ir para a loja</a>
          </div>
        </div>
      </main>
    )
  }
}
