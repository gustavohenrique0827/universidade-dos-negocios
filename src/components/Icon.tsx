const CAMINHOS: Record<string, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  circle: 'M12 20a8 8 0 100-16 8 8 0 000 16z',
  voltar: 'M19 12H5M11 6l-6 6 6 6',
  avancar: 'M5 12h14M13 6l6 6-6 6',
  esquerda: 'M15 5l-7 7 7 7',
  direita: 'M9 5l7 7-7 7',
  cima: 'M12 19V5M6 11l6-6 6 6',
  baixo: 'M12 5v14M6 13l6 6 6-6',
  fechar: 'M6 6l12 12M18 6L6 18',
  mais: 'M12 5v14M5 12h14',
  baixar: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  busca: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  sair: 'M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M15 8l4 4-4 4M19 12H9',
  cadeado: 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
  escudo: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z',
  infinito: 'M7 8a4 4 0 100 8c4 0 6-8 10-8a4 4 0 110 8c-4 0-6-8-10-8z',
  diploma: 'M4 5h16v11H4zM8 20l4-3 4 3M9 9h6M9 12h4',
  sol: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 16a4 4 0 100-8 4 4 0 000 8z',
  lua: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  recolher: 'M11 6l-6 6 6 6M19 6l-6 6 6 6',
  expandir: 'M13 6l6 6-6 6M5 6l6 6-6 6',
  cursos: 'M4 5h16v11H4zM8 20h8M12 16v4',
  painel: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  produtos: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  vendas: 'M3 6h18M3 12h18M3 18h12',
  alunos: 'M16 20v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M10 10a3 3 0 100-6 3 3 0 000 6M20 20v-2a3 3 0 00-2-2.8',
  cupons: 'M3 9a2 2 0 002-2h14a2 2 0 002 2v6a2 2 0 00-2 2H5a2 2 0 00-2-2V9zM10 9l4 6',
  afiliados: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  financeiro: 'M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.5 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3',
  mercado: 'M3 9l1-5h16l1 5M4 9v11h16V9M9 20v-6h6v6',
  conta: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  loja: 'M5 7h14l-1 12H6L5 7zM9 7a3 3 0 016 0',
  grupo: 'M16 20v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M10 10a3 3 0 100-6 3 3 0 000 6M20 20v-2a3 3 0 00-2-2.8M16 4.2a3 3 0 010 5.6',
}

export default function Icon({ nome, tamanho = 18, className = '' }: { nome: keyof typeof CAMINHOS | 'play'; tamanho?: number; className?: string }) {
  if (nome === 'play') {
    return <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}><path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z" /></svg>
  }
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}
