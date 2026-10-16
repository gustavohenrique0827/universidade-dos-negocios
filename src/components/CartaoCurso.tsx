import { Link } from 'react-router-dom'
import { brl } from '../lib/util'
import Capa from './Capa'
import Icon from './Icon'
import { Badge } from './Ui'

export type CursoCard = { id: string; titulo: string; slug: string; descricao: string | null; capa_url: string | null; preco_centavos: number; categoria: string | null; parcelas_max: number }

export function Preco({ p, grande = false }: { p: Pick<CursoCard, 'preco_centavos' | 'parcelas_max'>; grande?: boolean }) {
  if (p.preco_centavos === 0) return <Badge className="bg-ok/15 text-ok">Grátis</Badge>
  const parcela = Math.ceil(p.preco_centavos / p.parcelas_max)
  return (
    <div>
      <p className={`font-mono font-medium ${grande ? 'text-3xl' : 'text-lg'}`}>{brl(p.preco_centavos)}</p>
      {p.parcelas_max > 1 && <p className="text-xs text-muted">ou {p.parcelas_max}x de {brl(parcela)}</p>}
    </div>
  )
}

/** Card de curso: lista compacta no celular, cartão vertical a partir de `sm`. `semLink` serve para prévias. */
export default function CartaoCurso({ p, semLink = false }: { p: CursoCard; semLink?: boolean }) {
  const conteudo = (
    <>
      <div className="w-36 shrink-0 self-start overflow-hidden max-sm:m-3 max-sm:rounded-xl sm:w-full"><div className="transition duration-300 group-hover:scale-[1.03]"><Capa url={p.capa_url} titulo={p.titulo} /></div></div>
      <div className="flex min-w-0 flex-1 flex-col p-4 max-sm:pl-1 sm:p-5">
        {p.categoria && <p className="truncate font-mono text-[11px] uppercase tracking-widest text-muted">{p.categoria}</p>}
        <h3 className="mt-1 text-base leading-snug sm:text-lg">{p.titulo}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted max-sm:hidden">{p.descricao}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3 sm:pt-5">
          <Preco p={p} />
          <span className="flex items-center gap-1 text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:hidden">Ver curso <Icon nome="avancar" tamanho={15} /></span>
        </div>
      </div>
    </>
  )
  const classe = 'group flex h-full overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 sm:flex-col'
  return semLink
    ? <div className={classe}>{conteudo}</div>
    : <Link to={`/p/${p.slug}`} className={`${classe} hover:border-brand hover:shadow-xl hover:shadow-brand/10 sm:hover:-translate-y-1`}>{conteudo}</Link>
}
