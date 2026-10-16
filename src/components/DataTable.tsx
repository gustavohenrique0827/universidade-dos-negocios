import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { EsqueletoLista } from './Esqueleto'
import Icon from './Icon'

export type Coluna<T> = {
  id: string; titulo: string; render: (r: T) => ReactNode
  /** valor usado para ordenar; sem ele a coluna não é ordenável */
  valor?: (r: T) => string | number
  className?: string
}

type Props<T> = {
  dados: T[] | null
  colunas: Coluna<T>[]
  chave: (r: T) => string
  busca?: { placeholder: string; texto: (r: T) => string }
  filtros?: ReactNode
  porPagina?: number
  selecionavel?: boolean
  acoesSelecao?: (ids: string[], limpar: () => void) => ReactNode
  acoesLinha?: (r: T) => ReactNode
  onLinha?: (r: T) => void
  vazio: ReactNode
  rotulo: string
}

/** Tabela padrão: busca, ordenação, paginação, seleção múltipla e cartões no celular. */
export default function DataTable<T>({ dados, colunas, chave, busca, filtros, porPagina = 10, selecionavel, acoesSelecao, acoesLinha, onLinha, vazio, rotulo }: Props<T>) {
  const [texto, setTexto] = useState('')
  const [ord, setOrd] = useState<{ id: string; asc: boolean } | null>(null)
  const [pagina, setPagina] = useState(0)
  const [tamanho, setTamanho] = useState(porPagina)
  const [sel, setSel] = useState<Set<string>>(new Set())

  const linhas = useMemo(() => {
    let r = dados ?? []
    if (busca && texto.trim()) { const q = texto.toLowerCase(); r = r.filter((x) => busca.texto(x).toLowerCase().includes(q)) }
    const col = colunas.find((c) => c.id === ord?.id)
    if (col?.valor) r = [...r].sort((a, b) => { const x = col.valor!(a), y = col.valor!(b); return (x > y ? 1 : x < y ? -1 : 0) * (ord!.asc ? 1 : -1) })
    return r
  }, [dados, texto, ord, colunas, busca])

  const paginas = Math.max(1, Math.ceil(linhas.length / tamanho))
  useEffect(() => { setPagina(0) }, [texto, ord, tamanho, dados])
  const visiveis = linhas.slice(pagina * tamanho, (pagina + 1) * tamanho)
  const todasMarcadas = visiveis.length > 0 && visiveis.every((r) => sel.has(chave(r)))
  const alternar = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const marcarPagina = () => setSel((s) => { const n = new Set(s); visiveis.forEach((r) => todasMarcadas ? n.delete(chave(r)) : n.add(chave(r))); return n })
  const limpar = () => setSel(new Set())
  const ordenar = (id: string) => setOrd((o) => (o?.id === id ? (o.asc ? { id, asc: false } : null) : { id, asc: true }))

  return (
    <div>
      {(busca || filtros) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {busca && (
            <div className="relative w-full sm:w-72">
              <Icon nome="busca" tamanho={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={busca.placeholder} aria-label={busca.placeholder} className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25" />
            </div>
          )}
          {filtros}
        </div>
      )}

      {selecionavel && sel.size > 0 && acoesSelecao && (
        <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm">
          <span className="font-medium">{sel.size} {sel.size === 1 ? 'selecionado' : 'selecionados'}</span>
          <span className="flex flex-wrap items-center gap-2">{acoesSelecao([...sel], limpar)}<button onClick={limpar} className="rounded-md px-2 py-1 text-muted hover:text-ink">Limpar</button></span>
        </div>
      )}

      {dados === null ? <EsqueletoLista /> : linhas.length === 0 ? <>{vazio}</> : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{rotulo}</caption>
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <tr>
                  {selecionavel && <th scope="col" className="w-10 px-4 py-3"><input type="checkbox" checked={todasMarcadas} onChange={marcarPagina} aria-label="Selecionar todos desta página" className="size-4 accent-brand" /></th>}
                  {colunas.map((c) => (
                    <th key={c.id} scope="col" aria-sort={ord?.id === c.id ? (ord.asc ? 'ascending' : 'descending') : undefined} className={`px-4 py-3 font-medium ${c.className ?? ''}`}>
                      {c.valor ? (
                        <button onClick={() => ordenar(c.id)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink">{c.titulo}
                          <Icon nome={ord?.id === c.id ? (ord.asc ? 'cima' : 'baixo') : 'cima'} tamanho={12} className={ord?.id === c.id ? 'text-brand' : 'opacity-30'} /></button>
                      ) : c.titulo}
                    </th>
                  ))}
                  {acoesLinha && <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Ações</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visiveis.map((r) => {
                  const id = chave(r)
                  return (
                    <tr key={id} onClick={onLinha ? () => onLinha(r) : undefined} className={`${onLinha ? 'cursor-pointer' : ''} ${sel.has(id) ? 'bg-brand/5' : ''} hover:bg-wash/60`}>
                      {selecionavel && <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(id)} onChange={() => alternar(id)} aria-label="Selecionar linha" className="size-4 accent-brand" /></td>}
                      {colunas.map((c) => <td key={c.id} className={`px-4 py-3 ${c.className ?? ''}`}>{c.render(r)}</td>)}
                      {acoesLinha && <td className="px-4 py-3 text-right">{acoesLinha(r)}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden" aria-label={rotulo}>
            {visiveis.map((r) => {
              const id = chave(r)
              return (
                <li key={id} onClick={onLinha ? () => onLinha(r) : undefined} className={`rounded-xl border bg-surface p-4 ${sel.has(id) ? 'border-brand' : 'border-line'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-medium">{colunas[0].render(r)}</div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {selecionavel && <input type="checkbox" checked={sel.has(id)} onChange={() => alternar(id)} aria-label="Selecionar" className="size-4 accent-brand" />}
                      {acoesLinha?.(r)}
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    {colunas.slice(1).map((c) => <div key={c.id} className="min-w-0"><dt className="text-xs text-muted">{c.titulo}</dt><dd className="truncate">{c.render(r)}</dd></div>)}
                  </dl>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>{linhas.length} {linhas.length === 1 ? 'registro' : 'registros'}{texto && dados && linhas.length !== dados.length ? ` de ${dados.length}` : ''}</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">Por página
                <select value={tamanho} onChange={(e) => setTamanho(Number(e.target.value))} className="rounded-md border border-line bg-surface px-2 py-1 text-ink">{[10, 25, 50].map((n) => <option key={n}>{n}</option>)}</select></label>
              <span className="font-mono text-xs">{pagina + 1} / {paginas}</span>
              <button onClick={() => setPagina((p) => p - 1)} disabled={pagina === 0} aria-label="Página anterior" className="grid size-8 place-items-center rounded-md border border-line hover:border-brand disabled:opacity-30"><Icon nome="esquerda" tamanho={14} /></button>
              <button onClick={() => setPagina((p) => p + 1)} disabled={pagina >= paginas - 1} aria-label="Próxima página" className="grid size-8 place-items-center rounded-md border border-line hover:border-brand disabled:opacity-30"><Icon nome="direita" tamanho={14} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
