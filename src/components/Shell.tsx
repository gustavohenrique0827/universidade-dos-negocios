import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTema } from '../lib/tema'
import Breadcrumbs, { type Migalha } from './Breadcrumbs'
import Icon from './Icon'
import { Logo, LogoMark } from './Logo'
import Menu from './Menu'

type Item = { rotulo: string; icone: Parameters<typeof Icon>[0]['nome']; para?: string; fim?: boolean; filhos?: { rotulo: string; para: string }[] }
type Grupo = { titulo: string; itens: Item[] }

const MIGALHAS: Record<string, Migalha[]> = {
  '/painel': [{ rotulo: 'Visão geral' }],
  '/painel/produtos': [{ rotulo: 'Produtos' }],
  '/painel/vendas': [{ rotulo: 'Vendas', para: '/painel/vendas' }, { rotulo: 'Pedidos' }],
  '/painel/cupons': [{ rotulo: 'Vendas', para: '/painel/vendas' }, { rotulo: 'Cupons' }],
  '/painel/alunos': [{ rotulo: 'Clientes' }, { rotulo: 'Alunos' }],
  '/painel/afiliados': [{ rotulo: 'Afiliados', para: '/painel/afiliados' }, { rotulo: 'Meus afiliados' }],
  '/afiliacao': [{ rotulo: 'Afiliados', para: '/painel/afiliados' }, { rotulo: 'Marketplace' }],
  '/painel/financeiro': [{ rotulo: 'Financeiro' }],
  '/conta': [{ rotulo: 'Minha conta' }],
}

function migalhasDe(caminho: string): Migalha[] {
  if (MIGALHAS[caminho]) return MIGALHAS[caminho]
  if (/^\/painel\/produtos\/.+/.test(caminho)) return [{ rotulo: 'Produtos', para: '/painel/produtos' }, { rotulo: 'Editar produto' }]
  return []
}

export default function Shell() {
  const { profile } = useAuth()
  const { tema, alternar } = useTema()
  const nav = useNavigate()
  const local = useLocation()
  const [gaveta, setGaveta] = useState(false)
  const [recolhido, setRecolhido] = useState(() => { try { return localStorage.getItem('un_menu') === '1' } catch { return false } })
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})
  const produtor = profile?.role !== 'aluno'

  useEffect(() => { setGaveta(false) }, [local.pathname])
  useEffect(() => { try { localStorage.setItem('un_menu', recolhido ? '1' : '0') } catch { /* sem persistência */ } }, [recolhido])

  const grupos: Grupo[] = useMemo(() => [
    { titulo: 'Estudar', itens: [{ rotulo: 'Meus cursos', icone: 'cursos', para: '/meus-cursos' }] },
    ...(produtor ? [{
      titulo: 'Gestão', itens: [
        { rotulo: 'Visão geral', icone: 'painel', para: '/painel', fim: true },
        { rotulo: 'Produtos', icone: 'produtos', para: '/painel/produtos' },
        { rotulo: 'Vendas', icone: 'vendas', filhos: [{ rotulo: 'Pedidos', para: '/painel/vendas' }, { rotulo: 'Cupons', para: '/painel/cupons' }] },
        { rotulo: 'Clientes', icone: 'alunos', filhos: [{ rotulo: 'Alunos', para: '/painel/alunos' }] },
        { rotulo: 'Afiliados', icone: 'afiliados', filhos: [{ rotulo: 'Meus afiliados', para: '/painel/afiliados' }, { rotulo: 'Marketplace', para: '/afiliacao' }] },
        { rotulo: 'Financeiro', icone: 'financeiro', para: '/painel/financeiro' },
      ],
    } as Grupo] : [{ titulo: 'Afiliação', itens: [{ rotulo: 'Marketplace', icone: 'mercado', para: '/afiliacao' }] } as Grupo]),
  ], [produtor])

  const ativoFilho = (i: Item) => !!i.filhos?.some((f) => local.pathname === f.para || local.pathname.startsWith(f.para + '/'))
  const estaAberto = (i: Item) => abertos[i.rotulo] ?? ativoFilho(i)

  async function virarProdutor() { await supabase.rpc('become_producer'); window.location.assign('/painel') }

  const classeItem = (ativo: boolean) =>
    `group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
      recolhido ? 'lg:justify-center lg:px-0' : ''
    } ${
      ativo
        ? 'bg-gradient-to-r from-brand/15 via-brand/10 to-transparent text-brand border-l-2 border-brand font-semibold shadow-xs'
        : 'text-ink/75 hover:bg-wash/70 hover:text-ink hover:translate-x-0.5'
    }`
  const dica = (t: string) =>
    recolhido ? (
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-line bg-surface/95 px-2.5 py-1 text-xs font-semibold text-ink opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block"
      >
        {t}
      </span>
    ) : null

  const migalhas = migalhasDe(local.pathname)

  const menu = (
    <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
      {grupos.map((g) => (
        <div key={g.titulo}>
          <p className={`mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted/70 ${recolhido ? 'lg:sr-only' : ''}`}>
            {g.titulo}
          </p>
          <div className="space-y-1">
            {g.itens.map((i) => i.filhos ? (
              <div key={i.rotulo}>
                {recolhido ? (
                  <Link to={i.filhos[0].para} className={`${classeItem(ativoFilho(i))} max-lg:hidden`} aria-label={i.rotulo}>
                    <Icon nome={i.icone} tamanho={18} />
                    {dica(i.rotulo)}
                  </Link>
                ) : null}
                <button
                  onClick={() => setAbertos({ ...abertos, [i.rotulo]: !estaAberto(i) })}
                  aria-expanded={estaAberto(i)}
                  className={`${classeItem(ativoFilho(i))} ${recolhido ? 'lg:hidden' : ''}`}
                >
                  <Icon nome={i.icone} tamanho={18} />
                  <span className="flex-1 text-left">{i.rotulo}</span>
                  <Icon nome="baixo" tamanho={13} className={`text-muted transition-transform duration-200 ${estaAberto(i) ? 'rotate-180' : ''}`} />
                </button>
                {estaAberto(i) && (
                  <ul className={`my-1 ml-5 border-l border-line/80 pl-3 space-y-1 ${recolhido ? 'lg:hidden' : ''}`}>
                    {i.filhos.map((f) => (
                      <li key={f.para}>
                        <NavLink
                          to={f.para}
                          end
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              isActive ? 'font-bold text-brand bg-brand/10' : 'text-muted hover:text-ink hover:bg-wash/50'
                            }`
                          }
                        >
                          {f.rotulo}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <NavLink key={i.rotulo} to={i.para!} end={i.fim} aria-label={i.rotulo} className={({ isActive }) => classeItem(isActive)}>
                <Icon nome={i.icone} tamanho={18} />
                <span className={recolhido ? 'lg:sr-only' : ''}>{i.rotulo}</span>
                {dica(i.rotulo)}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      {!produtor && !recolhido && (
        <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/10 to-surface p-4 shadow-lg">
          <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-brand/20 blur-xl" />
          <p className="text-sm font-bold text-ink">Tem algo para ensinar?</p>
          <p className="mt-1 text-xs text-muted leading-relaxed">Crie seu curso e comece a faturar hoje.</p>
          <button
            onClick={virarProdutor}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-brand to-brand-dark py-2 text-xs font-bold text-on-brand shadow-md shadow-brand/20 hover:shadow-brand/35 transition-all"
          >
            Quero vender
          </button>
        </div>
      )}
    </nav>
  )

  return (
    <div className="min-h-screen">
      {gaveta && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setGaveta(false)}
          aria-hidden
        />
      )}
      <aside
        aria-label="Menu lateral"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line/80 bg-paper/95 backdrop-blur-xl transition-all duration-200 ${
          gaveta ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } lg:translate-x-0 ${recolhido ? 'lg:w-[76px]' : 'lg:w-64'}`}
      >
        <div className={`flex h-16 items-center border-b border-line/70 px-5 ${recolhido ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <Link to="/loja" aria-label="Universidade dos Negócios, loja" className="transition-transform hover:scale-[1.02]">
            {recolhido ? <span className="hidden lg:block"><LogoMark size={32} /></span> : null}
            <span className={recolhido ? 'lg:hidden' : ''}><Logo /></span>
          </Link>
          <button
            onClick={() => setGaveta(false)}
            aria-label="Fechar menu"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-wash hover:text-ink lg:hidden"
          >
            <Icon nome="fechar" tamanho={16} />
          </button>
        </div>
        {menu}
        <div className="hidden border-t border-line/70 p-3 lg:block">
          <button
            onClick={() => setRecolhido(!recolhido)}
            aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted hover:bg-wash hover:text-ink transition-colors ${
              recolhido ? 'justify-center px-0' : ''
            }`}
          >
            <Icon nome={recolhido ? 'expandir' : 'recolher'} tamanho={16} />
            {!recolhido && 'Recolher menu'}
          </button>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${recolhido ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-paper/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setGaveta(true)}
              aria-label="Abrir menu"
              className="flex size-9 items-center justify-center rounded-xl border border-line bg-surface/80 p-2 text-ink hover:bg-wash lg:hidden"
            >
              <Icon nome="menu" tamanho={18} />
            </button>
            <Breadcrumbs itens={migalhas} />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/loja"
              className="hidden items-center gap-2 rounded-xl border border-line/70 bg-surface/60 px-3.5 py-1.5 text-xs font-semibold text-muted hover:border-brand/40 hover:bg-wash hover:text-ink transition-all sm:inline-flex"
            >
              <Icon nome="loja" tamanho={14} /> Ver loja
            </Link>
            <button
              onClick={alternar}
              aria-label={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
              className="flex size-9 items-center justify-center rounded-xl text-muted hover:bg-wash hover:text-ink transition-colors"
            >
              <Icon nome={tema === 'dark' ? 'sol' : 'lua'} tamanho={16} />
            </button>
            <div className="h-5 w-px bg-line/80 mx-1" aria-hidden />
            <Menu
              rotulo="Menu da conta"
              itens={[
                { rotulo: 'Minha conta', onClick: () => nav('/conta') },
                { rotulo: 'Sair', onClick: async () => { await supabase.auth.signOut(); nav('/loja') } }
              ]}
            >
              <span className="flex items-center gap-2.5 rounded-xl border border-line/60 bg-surface/50 py-1 pl-1 pr-3 transition-colors hover:bg-wash">
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-on-brand shadow-xs" aria-hidden>
                  {profile?.nome?.charAt(0) ?? '?'}
                </span>
                <span className="hidden max-w-28 truncate text-xs font-semibold text-ink sm:inline">
                  {profile?.nome?.split(' ')[0]}
                </span>
                <Icon nome="baixo" tamanho={12} className="text-muted" />
              </span>
            </Menu>
          </div>
        </header>
        <main id="conteudo" tabIndex={-1} className="px-4 py-6 outline-none sm:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{<Outlet />}</div>
        </main>
      </div>
    </div>
  )
}
