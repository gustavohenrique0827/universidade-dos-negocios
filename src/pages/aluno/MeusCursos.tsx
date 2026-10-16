import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Capa from '../../components/Capa'
import { TelaCarregando } from '../../components/Esqueleto'
import Icon from '../../components/Icon'
import { useTitulo } from '../../lib/titulo'
import { Cartaz, Fileira } from '../../components/Fileira'
import { useAuth } from '../../lib/auth'
import { carregarCursos, type CursoEstudo } from '../../lib/estudo'
import { supabase } from '../../lib/supabase'
import { brl } from '../../lib/util'

type Descoberta = { id: string; titulo: string; slug: string; descricao: string | null; capa_url: string | null; preco_centavos: number; categoria: string | null }

function Barra({ pct }: { pct: number }) {
  return <div className="h-1 w-full bg-white/20"><div className="h-1 bg-brand" style={{ width: `${pct}%` }} /></div>
}

export default function MeusCursos() {
  const { profile } = useAuth()
  const [cursos, setCursos] = useState<CursoEstudo[] | null>(null)
  const [descobrir, setDescobrir] = useState<Descoberta[]>([])

  useEffect(() => {
    (async () => {
      const c = await carregarCursos()
      setCursos(c)
      const { data } = await supabase.from('products').select('id, titulo, slug, descricao, capa_url, preco_centavos, categoria').eq('publicado', true)
      const meus = new Set(c.map((x) => x.id))
      setDescobrir(((data ?? []) as Descoberta[]).filter((p) => !meus.has(p.id)))
    })()
  }, [])

  useTitulo('Início')
  if (cursos === null) return <TelaCarregando escuro />

  const emAndamento = cursos.filter((c) => c.proximo && c.ultimoEm).sort((a, b) => (b.ultimoEm! > a.ultimoEm! ? 1 : -1))
  const destaque = emAndamento[0] ?? cursos.find((c) => c.proximo) ?? cursos[0] ?? null
  const novos = cursos.filter((c) => !c.ultimoEm && c.proximo)
  const concluidos = cursos.filter((c) => c.pct === 100 && c.episodios.length > 0)
  const promo = !destaque ? descobrir[0] : null

  return (
    <main className="pb-16">
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Capa url={destaque?.capa_url ?? promo?.capa_url ?? null} titulo={destaque?.titulo ?? promo?.titulo ?? ''} className="!aspect-auto h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-black/50" />
        </div>
        <div className="w-full max-w-3xl px-4 pb-16 pt-32 sm:px-8">
          {destaque ? (
            <>
              <p className="font-mono text-xs uppercase tracking-widest text-brand">{destaque.ultimoEm ? 'Continue de onde parou' : 'Comece agora'}</p>
              <h1 className="mt-3 text-5xl leading-[1.02] sm:text-7xl">{destaque.titulo}</h1>
              {destaque.descricao && <p className="mt-4 max-w-xl text-lg text-ink/80">{destaque.descricao}</p>}
              {destaque.proximo && <p className="mt-4 text-sm text-ink/70">{destaque.proximo.moduloTitulo} · Episódio {destaque.proximo.n}: <span className="text-ink">{destaque.proximo.titulo}</span></p>}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {destaque.proximo ? (
                  <Link to={`/curso/${destaque.id}/aula/${destaque.proximo.id}`} className="inline-flex items-center gap-2 rounded-md bg-brand px-7 py-3 text-lg font-bold text-on-brand hover:bg-brand-dark"><Icon nome="play" tamanho={18} /> {destaque.ultimoEm ? 'Continuar' : 'Assistir'}</Link>
                ) : <Link to={`/curso/${destaque.id}`} className="rounded-md bg-brand px-7 py-3 text-lg font-bold text-on-brand hover:bg-brand-dark">Ver certificado e episódios</Link>}
                <Link to={`/curso/${destaque.id}`} className="rounded-md bg-white/15 px-6 py-3 text-lg font-semibold backdrop-blur hover:bg-white/25">Episódios</Link>
              </div>
              {destaque.pct > 0 && <div className="mt-5 flex max-w-xs items-center gap-3"><Barra pct={destaque.pct} /><span className="font-mono text-xs">{destaque.pct}%</span></div>}
            </>
          ) : promo ? (
            <>
              <p className="font-mono text-xs uppercase tracking-widest text-brand">Olá, {profile?.nome?.split(' ')[0]}</p>
              <h1 className="mt-3 text-5xl leading-[1.02] sm:text-7xl">Seu primeiro curso está a um clique.</h1>
              <p className="mt-4 max-w-xl text-lg text-ink/80">Você ainda não tem cursos. Que tal começar por “{promo.titulo}”?</p>
              <Link to={`/p/${promo.slug}`} className="mt-6 inline-block rounded-md bg-brand px-7 py-3 text-lg font-bold text-on-brand hover:bg-brand-dark">Conhecer o curso</Link>
            </>
          ) : <h1 className="text-5xl">Em breve, novos cursos.</h1>}
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-[1500px]">
        {emAndamento.length > 0 && (
          <Fileira titulo="Continue assistindo">
            {emAndamento.map((c) => (
              <Cartaz key={c.id}>
                <Link to={`/curso/${c.id}/aula/${c.proximo!.id}`} className="block overflow-hidden rounded-md bg-surface ring-brand/0 transition hover:ring-2 hover:ring-brand">
                  <div className="relative"><Capa url={c.capa_url} titulo={c.titulo} /><div className="absolute inset-x-0 bottom-0"><Barra pct={c.pct} /></div><span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-black/60 text-sm backdrop-blur" aria-hidden><Icon nome="play" tamanho={14} className="ml-0.5" /></span></div>
                  <div className="p-3"><p className="truncate font-semibold">{c.titulo}</p><p className="truncate text-xs text-muted">Ep. {c.proximo!.n} · {c.proximo!.titulo}</p></div>
                </Link>
              </Cartaz>
            ))}
          </Fileira>
        )}
        {novos.length > 0 && (
          <Fileira titulo="Pronto para começar">
            {novos.map((c) => <Cartaz key={c.id}><Link to={`/curso/${c.id}`} className="block overflow-hidden rounded-md bg-surface transition hover:ring-2 hover:ring-brand"><Capa url={c.capa_url} titulo={c.titulo} /><div className="p-3"><p className="truncate font-semibold">{c.titulo}</p><p className="text-xs text-muted">{c.episodios.length} {c.episodios.length === 1 ? 'episódio' : 'episódios'}</p></div></Link></Cartaz>)}
          </Fileira>
        )}
        {cursos.length > 0 && (
          <Fileira titulo="Meus cursos">
            {cursos.map((c) => <Cartaz key={c.id}><Link to={`/curso/${c.id}`} className="block overflow-hidden rounded-md bg-surface transition hover:ring-2 hover:ring-brand"><div className="relative"><Capa url={c.capa_url} titulo={c.titulo} />{c.pct > 0 && <div className="absolute inset-x-0 bottom-0"><Barra pct={c.pct} /></div>}</div><div className="p-3"><p className="truncate font-semibold">{c.titulo}</p><p className="text-xs text-muted">{c.pct === 100 ? 'Concluído' : `${c.episodios.length} ${c.episodios.length === 1 ? 'episódio' : 'episódios'} · ${c.pct}%`}</p></div></Link></Cartaz>)}
          </Fileira>
        )}
        {concluidos.length > 0 && (
          <Fileira titulo="Concluídos">
            {concluidos.map((c) => <Cartaz key={c.id}><Link to={`/curso/${c.id}`} className="block overflow-hidden rounded-md bg-surface transition hover:ring-2 hover:ring-outlier"><Capa url={c.capa_url} titulo={c.titulo} /><div className="p-3"><p className="truncate font-semibold">{c.titulo}</p><p className="flex items-center gap-1 text-xs text-outlier"><Icon nome="check" tamanho={13} /> Certificado disponível</p></div></Link></Cartaz>)}
          </Fileira>
        )}
        {descobrir.length > 0 && (
          <Fileira titulo="Descubra mais cursos">
            {descobrir.map((p) => <Cartaz key={p.id}><Link to={`/p/${p.slug}`} className="block overflow-hidden rounded-md bg-surface transition hover:ring-2 hover:ring-brand"><Capa url={p.capa_url} titulo={p.titulo} /><div className="flex items-center justify-between gap-2 p-3"><p className="truncate font-semibold">{p.titulo}</p><span className="shrink-0 font-mono text-sm text-brand">{p.preco_centavos === 0 ? 'Grátis' : brl(p.preco_centavos)}</span></div></Link></Cartaz>)}
          </Fileira>
        )}
      </div>
    </main>
  )
}
