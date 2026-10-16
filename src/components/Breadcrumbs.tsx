import { Link } from 'react-router-dom'
import Icon from './Icon'

export type Migalha = { rotulo: string; para?: string }

export default function Breadcrumbs({ itens }: { itens: Migalha[] }) {
  return (
    <nav aria-label="Você está em" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
        {itens.map((m, i) => (
          <li key={m.rotulo} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <Icon nome="direita" tamanho={12} />}
            {m.para && i < itens.length - 1 ? <Link to={m.para} className="truncate hover:text-ink">{m.rotulo}</Link> : <span aria-current={i === itens.length - 1 ? 'page' : undefined} className={`truncate ${i === itens.length - 1 ? 'font-medium text-ink' : ''}`}>{m.rotulo}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
