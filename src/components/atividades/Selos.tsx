import type { EstadoAtividade } from '../../lib/atividades'

const ESTADOS: Record<EstadoAtividade['estado'], { rotulo: string; classe: string }> = {
  nova: { rotulo: 'Não iniciada', classe: 'bg-wash text-muted' },
  pendente: { rotulo: 'Em correção', classe: 'bg-outlier/20 text-outlier' },
  aprovado: { rotulo: 'Aprovado', classe: 'bg-ok/15 text-ok' },
  reprovado: { rotulo: 'Não aprovado', classe: 'bg-bad/15 text-bad' },
}

export function SeloEstado({ estado, nota }: { estado: EstadoAtividade['estado']; nota?: number | null }) {
  const e = ESTADOS[estado]
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${e.classe}`}>{e.rotulo}{nota != null && estado !== 'nova' && estado !== 'pendente' ? ` · ${nota}%` : ''}</span>
}

export function SeloObrigatoria() {
  return <span className="inline-flex items-center whitespace-nowrap rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand">Obrigatória para o certificado</span>
}
