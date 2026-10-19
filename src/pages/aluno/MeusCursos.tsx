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
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand via-brand to-brand-dark shadow-xs shadow-brand transition-all duration-300"
        style={{ width: `${Math.max(3, pct)}%` }}
      />
    </div>
  )
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

  useTitulo('Área do Aluno')
  if (cursos === null) return <TelaCarregando escuro />

  const emAndamento = cursos.filter((c) => c.proximo && c.ultimoEm).sort((a, b) => (b.ultimoEm! > a.ultimoEm! ? 1 : -1))
  const destaque = emAndamento[0] ?? cursos.find((c) => c.proximo) ?? cursos[0] ?? null
  const novos = cursos.filter((c) => !c.ultimoEm && c.proximo)
  const concluidos = cursos.filter((c) => c.pct === 100 && c.episodios.length > 0)
  const promo = !destaque ? descobrir[0] : null

  return (
    <main className="pb-20">
      {/* Featured / In-Progress Cinematic Hero Banner */}
      <section className="relative isolate flex min-h-[82vh] items-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Capa url={destaque?.capa_url ?? promo?.capa_url ?? null} titulo={destaque?.titulo ?? promo?.titulo ?? ''} className="!aspect-auto h-full scale-105 filter brightness-75" />
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/20 to-black/60" />
        </div>
        <div className="w-full max-w-4xl px-4 pb-20 pt-36 sm:px-8">
          {destaque ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand backdrop-blur-md">
                <span className="size-2 rounded-full bg-brand animate-pulse-subtle" />
                {destaque.ultimoEm ? 'Continue de onde parou' : 'Comece agora'}
              </div>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl text-ink">
                {destaque.titulo}
              </h1>
              {destaque.descricao && (
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-ink/80 leading-relaxed line-clamp-3">
                  {destaque.descricao}
                </p>
              )}
              {destaque.proximo && (
                <div className="mt-4 flex items-center gap-2 text-sm text-ink/75">
                  <span className="rounded-md bg-wash/80 px-2 py-0.5 font-mono text-xs font-semibold text-brand">
                    Módulo {destaque.proximo.moduloTitulo}
                  </span>
                  <span>·</span>
                  <span className="text-ink font-medium">Episódio {destaque.proximo.n}: {destaque.proximo.titulo}</span>
                </div>
              )}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                {destaque.proximo ? (
                  <Link
                    to={`/curso/${destaque.id}/aula/${destaque.proximo.id}`}
                    className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-base font-bold text-on-brand shadow-xl shadow-brand/30 hover:shadow-brand/50 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Icon nome="play" tamanho={20} />
                    {destaque.ultimoEm ? 'Continuar Assistindo' : 'Começar a Assistir'}
                  </Link>
                ) : (
                  <Link
                    to={`/curso/${destaque.id}`}
                    className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-base font-bold text-on-brand shadow-xl shadow-brand/30 hover:scale-105 transition-all"
                  >
                    Ver certificado e episódios
                  </Link>
                )}
                <Link
                  to={`/curso/${destaque.id}`}
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  Grade de Aulas
                </Link>
              </div>
              {destaque.pct > 0 && (
                <div className="mt-6 flex max-w-sm items-center gap-3.5">
                  <Barra pct={destaque.pct} />
                  <span className="font-mono text-xs font-bold text-brand">{destaque.pct}%</span>
                </div>
              )}
            </>
          ) : promo ? (
            <>
              <p className="font-mono text-xs uppercase tracking-widest text-brand font-bold">Olá, {profile?.nome?.split(' ')[0]}</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl text-ink">
                Seu primeiro negócio começa aqui.
              </h1>
              <p className="mt-4 max-w-xl text-base sm:text-lg text-ink/80 leading-relaxed">
                Você ainda não está matriculado em nenhum curso. Que tal começar por “{promo.titulo}”?
              </p>
              <Link
                to={`/p/${promo.slug}`}
                className="mt-7 inline-block rounded-xl bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-base font-bold text-on-brand shadow-xl shadow-brand/30 hover:scale-105 transition-all"
              >
                Conhecer o curso
              </Link>
            </>
          ) : (
            <h1 className="text-4xl sm:text-5xl font-bold">Em breve, novos cursos.</h1>
          )}
        </div>
      </section>

      {/* Rows of Content */}
      <div className="mx-auto -mt-6 max-w-[1500px] relative z-10 space-y-6">
        {emAndamento.length > 0 && (
          <Fileira titulo="Continue assistindo">
            {emAndamento.map((c) => (
              <Cartaz key={c.id}>
                <Link
                  to={`/curso/${c.id}/aula/${c.proximo!.id}`}
                  className="group block overflow-hidden rounded-2xl border border-line/80 bg-surface/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/10"
                >
                  <div className="relative overflow-hidden">
                    <Capa url={c.capa_url} titulo={c.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0">
                      <Barra pct={c.pct} />
                    </div>
                    <span
                      className="absolute left-3 top-3 grid size-10 place-items-center rounded-full bg-black/70 text-brand shadow-lg backdrop-blur-md transition-transform group-hover:scale-110"
                      aria-hidden
                    >
                      <Icon nome="play" tamanho={16} className="ml-0.5" />
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="truncate font-bold text-ink group-hover:text-brand transition-colors">{c.titulo}</p>
                    <p className="mt-1 truncate text-xs text-muted font-medium">
                      Ep. {c.proximo!.n} · {c.proximo!.titulo}
                    </p>
                  </div>
                </Link>
              </Cartaz>
            ))}
          </Fileira>
        )}

        {novos.length > 0 && (
          <Fileira titulo="Pronto para começar">
            {novos.map((c) => (
              <Cartaz key={c.id}>
                <Link
                  to={`/curso/${c.id}`}
                  className="group block overflow-hidden rounded-2xl border border-line/80 bg-surface/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/10"
                >
                  <Capa url={c.capa_url} titulo={c.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                  <div className="p-4">
                    <p className="truncate font-bold text-ink group-hover:text-brand transition-colors">{c.titulo}</p>
                    <p className="mt-1 text-xs text-muted font-medium">
                      {c.episodios.length} {c.episodios.length === 1 ? 'episódio' : 'episódios'}
                    </p>
                  </div>
                </Link>
              </Cartaz>
            ))}
          </Fileira>
        )}

        {cursos.length > 0 && (
          <Fileira titulo="Meus cursos">
            {cursos.map((c) => (
              <Cartaz key={c.id}>
                <Link
                  to={`/curso/${c.id}`}
                  className="group block overflow-hidden rounded-2xl border border-line/80 bg-surface/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/10"
                >
                  <div className="relative overflow-hidden">
                    <Capa url={c.capa_url} titulo={c.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                    {c.pct > 0 && (
                      <div className="absolute inset-x-0 bottom-0">
                        <Barra pct={c.pct} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="truncate font-bold text-ink group-hover:text-brand transition-colors">{c.titulo}</p>
                    <p className="mt-1 text-xs text-muted font-medium">
                      {c.pct === 100 ? (
                        <span className="text-ok font-semibold">100% Concluído</span>
                      ) : (
                        `${c.episodios.length} ${c.episodios.length === 1 ? 'episódio' : 'episódios'} · ${c.pct}%`
                      )}
                    </p>
                  </div>
                </Link>
              </Cartaz>
            ))}
          </Fileira>
        )}

        {concluidos.length > 0 && (
          <Fileira titulo="Concluídos com Certificado">
            {concluidos.map((c) => (
              <Cartaz key={c.id}>
                <Link
                  to={`/curso/${c.id}`}
                  className="group block overflow-hidden rounded-2xl border border-outlier/40 bg-surface/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-outlier hover:shadow-2xl hover:shadow-outlier/10"
                >
                  <Capa url={c.capa_url} titulo={c.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                  <div className="p-4">
                    <p className="truncate font-bold text-ink group-hover:text-outlier transition-colors">{c.titulo}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-outlier font-semibold">
                      <Icon nome="check" tamanho={14} /> Certificado emitido
                    </p>
                  </div>
                </Link>
              </Cartaz>
            ))}
          </Fileira>
        )}

        {descobrir.length > 0 && (
          <Fileira titulo="Descubra mais formações">
            {descobrir.map((p) => (
              <Cartaz key={p.id}>
                <Link
                  to={`/p/${p.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-line/80 bg-surface/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/10"
                >
                  <Capa url={p.capa_url} titulo={p.titulo} className="transition-transform duration-500 group-hover:scale-105" />
                  <div className="flex items-center justify-between gap-2 p-4">
                    <p className="truncate font-bold text-ink group-hover:text-brand transition-colors">{p.titulo}</p>
                    <span className="shrink-0 font-mono text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                      {p.preco_centavos === 0 ? 'Grátis' : brl(p.preco_centavos)}
                    </span>
                  </div>
                </Link>
              </Cartaz>
            ))}
          </Fileira>
        )}
      </div>
    </main>
  )
}
