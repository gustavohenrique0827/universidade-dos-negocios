import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Capa from '../components/Capa'
import Dividido from '../components/Dividido'
import Icon from '../components/Icon'
import { TelaCarregando } from '../components/Esqueleto'
import { useTitulo } from '../lib/titulo'
import { useAuth } from '../lib/auth'
import { MODO_DEMO, supabase } from '../lib/supabase'
import { Botao } from '../components/Botao'
import { LinkBotao } from '../components/Botao'
import { brl, campo, lerRef, METODO } from '../lib/util'

type Produto = { id: string; titulo: string; capa_url: string | null; preco_centavos: number; garantia_dias: number; parcelas_max: number; bump_titulo: string | null; bump_descricao: string | null; bump_preco_centavos: number | null }
type Pedido = { id: string; valor_centavos: number; status: string; metodo: string; parcelas: number }
type Metodo = 'pix' | 'cartao' | 'boleto'

export default function Checkout() {
  const { slug } = useParams()
  const { session, profile, loading } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState<Produto | null | undefined>(undefined)
  const [cupom, setCupom] = useState('')
  const [desconto, setDesconto] = useState(0)
  const [bump, setBump] = useState(false)
  const [metodo, setMetodo] = useState<Metodo>('pix')
  const [parcelas, setParcelas] = useState(1)
  const [erro, setErro] = useState('')
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id, titulo, capa_url, preco_centavos, garantia_dias, parcelas_max, bump_titulo, bump_descricao, bump_preco_centavos').eq('slug', slug!).eq('publicado', true).maybeSingle().then(({ data }) => setP(data))
  }, [slug])

  useTitulo('Finalizar compra')
  if (loading || p === undefined) return <TelaCarregando />
  if (!session) return <Navigate to="/login" state={{ voltar: `/checkout/${slug}` }} replace />
  if (p === null) return <p className="p-8 text-muted">Produto não encontrado. <Link to="/loja" className="text-brand">Ver todos os cursos</Link></p>

  const temBump = p.bump_titulo && p.bump_preco_centavos != null
  const base = p.preco_centavos - Math.floor((p.preco_centavos * desconto) / 100)
  const total = base + (bump && temBump ? p.bump_preco_centavos! : 0)

  async function aplicar() {
    const { data } = await supabase.rpc('validate_coupon', { p_product: p!.id, p_codigo: cupom })
    setDesconto(data ?? 0)
    setErro(data ? '' : 'Cupom inválido ou esgotado.')
  }

  async function finalizar() {
    setEnviando(true); setErro('')
    const { data, error } = await supabase.rpc('create_order', { p_product: p!.id, p_cupom: desconto ? cupom : null, p_ref: lerRef(slug!), p_metodo: metodo, p_parcelas: metodo === 'cartao' ? parcelas : 1, p_bump: bump })
    setEnviando(false)
    if (error) return setErro(error.message)
    const { data: o } = await supabase.from('orders').select('id, valor_centavos, status, metodo, parcelas').eq('id', data).single()
    if (o?.status === 'pago') return nav(`/curso/${p!.id}`)
    setPedido(o)
  }

  async function simularPagamento() {
    await supabase.rpc('demo_pay_order', { p_order: pedido!.id })
    nav(`/curso/${p!.id}`)
  }

  const rodape = (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5 text-ok font-medium">
        <Icon nome="cadeado" tamanho={13} /> Ambiente 100% Criptografado (256-bit)
      </span>
      <span>·</span>
      <span className="flex items-center gap-1.5">
        <Icon nome="escudo" tamanho={13} /> Compra Segura Garantida
      </span>
    </div>
  )

  if (pedido) {
    return (
      <Dividido
        rodape={rodape}
        lateralInvertida
        largura="xl"
        lateral={
          <div className="relative">
            <Resumo p={p} />
            <dl className="mt-6 space-y-2.5 border-t border-line/70 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Forma de pagamento</dt>
                <dd className="font-semibold text-ink">{METODO[pedido.metodo]}{pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ''}</dd>
              </div>
              <div className="flex items-end justify-between border-t border-line/70 pt-4">
                <dt className="text-base font-bold text-ink">Total do Pedido</dt>
                <dd className="font-mono text-3xl font-extrabold text-brand">{brl(pedido.valor_centavos)}</dd>
              </div>
            </dl>
          </div>
        }
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3.5 py-1 text-xs font-bold text-ok">
          <span className="size-2 rounded-full bg-ok animate-pulse" />
          Pedido Gerado com Sucesso
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
          Quase lá! Falta só o pagamento.
        </h1>
        <p className="mt-3 text-sm text-muted">
          {p.titulo} · <strong className="font-mono font-bold text-brand">{brl(pedido.valor_centavos)}</strong> · {METODO[pedido.metodo]}{pedido.parcelas > 1 ? ` (${pedido.parcelas}x)` : ''}
        </p>

        <div className="mt-6 rounded-2xl border border-outlier/30 bg-outlier/10 p-5 text-sm shadow-xs">
          <p className="font-bold text-ink">Liberação Instantânea</p>
          <p className="mt-1 text-muted text-xs leading-relaxed">
            Assim que a confirmação do pagamento for recebida pela operadora, seu acesso total às aulas e materiais será liberado instantaneamente na sua área de aluno.
          </p>
        </div>

        {MODO_DEMO && (
          <div className="mt-6 rounded-2xl border border-dashed border-brand/50 bg-brand/5 p-5 text-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Modo de Demonstração</p>
            <p className="mt-1 text-xs text-muted">
              Ambiente de testes ativo. Clique no botão abaixo para simular a confirmação imediata da compra.
            </p>
            <Botao className="mt-4" onClick={simularPagamento}>
              Simular Pagamento Aprovado
            </Botao>
          </div>
        )}

        <LinkBotao para="/meus-cursos" variante="secundario" className="mt-6 w-fit">
          Ir para Meus Cursos
        </LinkBotao>
      </Dividido>
    )
  }

  const lateral = (
    <div className="relative lg:sticky lg:top-8">
      <Resumo p={p} />
      <div className="mt-6 flex gap-2">
        <input
          className={`${campo} min-w-0 flex-1`}
          placeholder="Código do cupom"
          aria-label="Cupom de desconto"
          value={cupom}
          onChange={(e) => setCupom(e.target.value)}
        />
        <Botao variante="secundario" onClick={aplicar}>
          Aplicar
        </Botao>
      </div>
      <dl className="mt-6 space-y-2.5 border-t border-line/70 pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Valor do produto</dt>
          <dd className="font-mono font-medium text-ink">{brl(p.preco_centavos)}</dd>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-ok font-semibold">
            <dt className="flex items-center gap-1.5"><Icon nome="check" tamanho={14} /> Cupom ({desconto}%)</dt>
            <dd className="font-mono">− {brl(p.preco_centavos - base)}</dd>
          </div>
        )}
        {bump && temBump && (
          <div className="flex justify-between text-brand font-medium">
            <dt className="truncate max-w-[200px]">{p.bump_titulo}</dt>
            <dd className="font-mono">{brl(p.bump_preco_centavos!)}</dd>
          </div>
        )}
        <div className="flex items-end justify-between border-t border-line/70 pt-4">
          <dt className="text-base font-bold text-ink">Total</dt>
          <dd className="font-mono text-3xl font-extrabold text-ink">{brl(total)}</dd>
        </div>
        {metodo === 'cartao' && parcelas > 1 && (
          <p className="text-right text-xs text-muted font-medium">
            ou {parcelas}x de <span className="font-bold text-ink">{brl(Math.ceil(total / parcelas))}</span>
          </p>
        )}
      </dl>

      {erro && (
        <p role="alert" className="mt-4 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-xs font-semibold text-bad">
          {erro}
        </p>
      )}

      <Botao larga tamanho="g" className="mt-6 shadow-xl shadow-brand/25" carregando={enviando} onClick={finalizar}>
        {total === 0 ? 'Liberar Acesso Grátis' : 'Confirmar e Finalizar Compra'}
      </Botao>

      {p.garantia_dias > 0 && (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-wash/40 p-3 text-xs text-muted">
          <Icon nome="escudo" tamanho={16} className="text-ok shrink-0" />
          <span>Garantia incondicional de <strong>{p.garantia_dias} dias</strong>. Risco zero.</span>
        </div>
      )}
    </div>
  )

  return (
    <Dividido rodape={rodape} lateralInvertida largura="xl" lateral={lateral}>
      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-brand">
        Checkout Seguro
      </div>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
        Finalize sua inscrição
      </h1>
      <p className="mt-2 text-sm text-muted">
        Insira seus dados para liberar acesso imediato ao conteúdo.
      </p>

      <div className="mt-6 space-y-5">
        <Passo n={1} titulo="Seus dados de acesso">
          <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-wash/40 p-3.5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand/15 font-bold text-brand">
              {profile?.nome?.charAt(0) ?? '?'}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{profile?.nome}</p>
              <p className="text-xs text-muted">{session.user.email}</p>
            </div>
          </div>
        </Passo>

        <Passo n={2} titulo="Escolha a forma de pagamento">
          <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-wash/40 p-1.5">
            {(['pix', 'cartao', 'boleto'] as Metodo[]).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={metodo === m}
                onClick={() => { setMetodo(m); setParcelas(1) }}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-xs font-bold transition-all duration-150 cursor-pointer ${
                  metodo === m
                    ? 'bg-gradient-to-r from-brand to-brand-dark text-on-brand shadow-md shadow-brand/20'
                    : 'text-muted hover:text-ink hover:bg-wash/80'
                }`}
              >
                <span>{METODO[m]}</span>
              </button>
            ))}
          </div>

          {metodo === 'cartao' && (
            <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-muted">
              Número de parcelas
              <select
                value={parcelas}
                onChange={(e) => setParcelas(Number(e.target.value))}
                className={`${campo} mt-1.5 w-full font-normal capitalize text-ink`}
              >
                {Array.from({ length: p.parcelas_max }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x de {brl(Math.ceil(total / n))}{n === 1 ? ' (à vista sem juros)' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <p className="mt-3 text-xs text-muted leading-relaxed">
            {metodo === 'pix'
              ? 'Aprovação instantânea em qualquer horário. O QR Code Pix será gerado após confirmar.'
              : metodo === 'boleto'
              ? 'Compensação bancária padrão em até 2 dias úteis.'
              : 'Transação protegida por autenticação bancária 3D Secure.'}
          </p>
        </Passo>

        {temBump && (
          <label
            className={`group relative flex cursor-pointer gap-4 rounded-2xl border-2 p-5 shadow-sm transition-all duration-200 ${
              bump ? 'border-brand bg-brand/10 shadow-brand/10' : 'border-dashed border-outlier/60 bg-outlier/5 hover:border-brand/60'
            }`}
          >
            <input
              type="checkbox"
              checked={bump}
              onChange={(e) => setBump(e.target.checked)}
              className="mt-1 size-5 rounded-md accent-brand cursor-pointer shrink-0"
            />
            <div>
              <span className="inline-block rounded-md bg-brand px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-on-brand mb-1">
                Oferta Exclusiva desta Página
              </span>
              <span className="block text-sm font-bold text-ink">
                Sim, quero adicionar: {p.bump_titulo} por apenas {brl(p.bump_preco_centavos!)}
              </span>
              <span className="mt-1 block text-xs text-muted leading-relaxed">{p.bump_descricao}</span>
            </div>
          </label>
        )}
      </div>
    </Dividido>
  )
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line/80 bg-surface/90 p-5 shadow-md">
      <h2 className="flex items-center gap-3 text-base font-bold text-ink">
        <span className="grid size-7 place-items-center rounded-xl bg-brand/15 font-mono text-xs font-bold text-brand border border-brand/20">
          {n}
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Resumo({ p }: { p: Produto }) {
  return (
    <div className="relative">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted">Resumo do Pedido</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line shadow-md">
        <Capa url={p.capa_url} titulo={p.titulo} />
      </div>
      <h2 className="mt-4 text-xl font-bold leading-snug text-ink">{p.titulo}</h2>
    </div>
  )
}
