import { Link } from 'react-router-dom'
import { brl } from '../lib/util'
import Capa from './Capa'
import Icon from './Icon'
import { Badge } from './Ui'

export type CursoCard = {
  id: string
  titulo: string
  slug: string
  descricao: string | null
  capa_url: string | null
  preco_centavos: number
  categoria: string | null
  parcelas_max: number
}

export function Preco({ p, grande = false }: { p: Pick<CursoCard, 'preco_centavos' | 'parcelas_max'>; grande?: boolean }) {
  if (p.preco_centavos === 0) {
    return <Badge className="bg-ok/15 text-ok border-ok/30 font-semibold" dot>100% Gratuito</Badge>
  }
  const parcela = Math.ceil(p.preco_centavos / p.parcelas_max)
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono font-bold text-ink tracking-tight ${grande ? 'text-3xl' : 'text-xl'}`}>
          {brl(p.preco_centavos)}
        </span>
      </div>
      {p.parcelas_max > 1 && (
        <p className="mt-0.5 text-xs text-muted font-medium">
          ou <span className="text-ink font-semibold">{p.parcelas_max}x</span> de <span className="text-ink font-semibold">{brl(parcela)}</span>
        </p>
      )}
    </div>
  )
}

/** Card de curso: lista compacta no celular, cartão vertical a partir de `sm`. `semLink` serve para prévias. */
export default function CartaoCurso({ p, semLink = false }: { p: CursoCard; semLink?: boolean }) {
  const conteudo = (
    <>
      <div className="relative w-36 shrink-0 self-start overflow-hidden max-sm:m-3 max-sm:rounded-xl sm:w-full border-b border-line/40">
        <div className="relative overflow-hidden">
          <Capa url={p.capa_url} titulo={p.titulo} className="transition-transform duration-300 group-hover:scale-102" />
        </div>

        {p.categoria && (
          <span className="absolute left-3 top-3 z-10 hidden rounded-full border border-white/10 bg-black/70 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur-md sm:inline-block">
            {p.categoria}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        {p.categoria && (
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted font-semibold sm:hidden">
            {p.categoria}
          </p>
        )}
        <h3 className="mt-1 text-base font-semibold leading-snug text-ink sm:text-[17px] group-hover:text-brand transition-colors line-clamp-2">
          {p.titulo}
        </h3>
        {p.descricao && (
          <p className="mt-2 line-clamp-2 text-xs text-muted leading-relaxed max-sm:hidden">
            {p.descricao}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4 sm:pt-5 border-t border-line/50">
          <Preco p={p} />
          <span className="flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition-all duration-200 group-hover:opacity-100 max-sm:hidden">
            Ver curso <Icon nome="avancar" tamanho={13} />
          </span>
        </div>
      </div>
    </>
  )

  const classe =
    'group flex h-full overflow-hidden rounded-2xl border border-line/70 bg-surface/60 transition-all duration-200 sm:flex-col'

  return semLink ? (
    <div className={classe}>{conteudo}</div>
  ) : (
    <Link
      to={`/p/${p.slug}`}
      className={`${classe} hover:border-line hover:bg-surface/90 hover:shadow-md hover:shadow-black/20 hover:-translate-y-0.5`}
    >
      {conteudo}
    </Link>
  )
}
