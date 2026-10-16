import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Capa from '../components/Capa'
import Dividido from '../components/Dividido'
import Icon from '../components/Icon'
import { TelaCarregando } from '../components/Esqueleto'
import { useTitulo } from '../lib/titulo'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
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

  const rodape = <span className="flex items-start justify-center gap-1.5"><Icon nome="cadeado" tamanho={13} className="mt-0.5 shrink-0" /><span>Ambiente seguro. Seus dados de pagamento não ficam armazenados na plataforma.</span></span>

  if (pedido) {
    return (
      <Dividido rodape={rodape} lateralInvertida largura="xl" lateral={<div className="relative"><Resumo p={p} />
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Forma de pagamento</dt><dd>{METODO[pedido.metodo]}{pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ''}</dd></div>
          <div className="flex items-end justify-between border-t border-line pt-3"><dt className="text-base font-semibold">Total</dt><dd className="font-mono text-3xl font-medium">{brl(pedido.valor_centavos)}</dd></div>
        </dl></div>}>
        <p className="font-mono text-xs uppercase tracking-widest text-brand">Pedido recebido</p>
        <h1 className="mt-2 text-4xl leading-tight">Falta só o pagamento.</h1>
        <p className="mt-3 text-muted">{p.titulo} · <strong className="font-mono text-ink">{brl(pedido.valor_centavos)}</strong> · {METODO[pedido.metodo]}{pedido.parcelas > 1 ? ` em ${pedido.parcelas}x` : ''}</p>
        <p className="mt-5 rounded-xl border border-outlier/40 bg-outlier/10 p-4 text-sm">Assim que o pagamento for aprovado, seu acesso é liberado automaticamente em “Meus cursos”.</p>
        {import.meta.env.VITE_DEMO === 'true' && (
          <div className="mt-5 rounded-xl border border-dashed border-brand/60 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Modo demonstração</p>
            <p className="mt-1 text-muted">Não há gateway conectado. Use o botão para simular a aprovação do pagamento.</p>
            <Botao className="mt-3" onClick={simularPagamento}>Simular pagamento aprovado</Botao>
          </div>
        )}
        <LinkBotao para="/meus-cursos" variante="secundario" className="mt-6 w-fit">Ir para meus cursos</LinkBotao>
      </Dividido>
    )
  }

  const lateral = (
    <div className="relative lg:sticky lg:top-10">
      <Resumo p={p} />
      <div className="mt-5 flex gap-2">
        <input className={`${campo} min-w-0 flex-1`} placeholder="Cupom de desconto" aria-label="Cupom de desconto" value={cupom} onChange={(e) => setCupom(e.target.value)} />
        <Botao variante="secundario" onClick={aplicar}>Aplicar</Botao>
      </div>
      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Produto</dt><dd className="font-mono">{brl(p.preco_centavos)}</dd></div>
        {desconto > 0 && <div className="flex justify-between text-ok"><dt>Cupom ({desconto}%)</dt><dd className="font-mono">− {brl(p.preco_centavos - base)}</dd></div>}
        {bump && temBump && <div className="flex justify-between"><dt className="text-muted">{p.bump_titulo}</dt><dd className="font-mono">{brl(p.bump_preco_centavos!)}</dd></div>}
        <div className="flex items-end justify-between border-t border-line pt-3"><dt className="text-base font-semibold">Total</dt><dd className="font-mono text-3xl font-medium">{brl(total)}</dd></div>
        {metodo === 'cartao' && parcelas > 1 && <p className="text-right text-xs text-muted">{parcelas}x de {brl(Math.ceil(total / parcelas))}</p>}
      </dl>
      {erro && <p role="alert" className="mt-4 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{erro}</p>}
      <Botao larga tamanho="g" className="mt-5" carregando={enviando} onClick={finalizar}>{total === 0 ? 'Liberar acesso grátis' : 'Finalizar compra'}</Botao>
      {p.garantia_dias > 0 && <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted"><Icon nome="escudo" tamanho={14} /> Garantia incondicional de {p.garantia_dias} dias</p>}
    </div>
  )

  return (
    <Dividido rodape={rodape} lateralInvertida largura="xl" lateral={lateral}>
      <p className="font-mono text-xs uppercase tracking-widest text-brand">Checkout</p>
      <h1 className="mt-2 text-4xl leading-tight">Finalizar compra</h1>
      <div className="mt-6 space-y-4">
        <Passo n={1} titulo="Seus dados">
          <p className="text-sm"><span className="font-semibold">{profile?.nome}</span> <span className="text-muted">· {session.user.email}</span></p>
        </Passo>
        <Passo n={2} titulo="Forma de pagamento">
          <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-paper p-1">
            {(['pix', 'cartao', 'boleto'] as Metodo[]).map((m) => (
              <button key={m} role="radio" aria-checked={metodo === m} onClick={() => { setMetodo(m); setParcelas(1) }}
                className={`rounded-lg py-2.5 text-sm font-semibold transition ${metodo === m ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'}`}>{METODO[m]}</button>
            ))}
          </div>
          {metodo === 'cartao' && (
            <label className="mt-4 block text-sm font-medium">Parcelas
              <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className={`${campo} mt-1 w-full`}>
                {Array.from({ length: p.parcelas_max }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x de {brl(Math.ceil(total / n))}{n === 1 ? ' à vista' : ''}</option>)}
              </select>
            </label>
          )}
          <p className="mt-3 text-sm text-muted">{metodo === 'pix' ? 'Aprovação em segundos. O QR Code é gerado no próximo passo.' : metodo === 'boleto' ? 'Compensação em até 2 dias úteis. O boleto é gerado no próximo passo.' : 'Os dados do cartão são informados no ambiente seguro do banco, no próximo passo.'}</p>
        </Passo>
        {temBump && (
          <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 border-dashed p-5 transition ${bump ? 'border-brand bg-brand/10' : 'border-outlier/70'}`}>
            <input type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} className="mt-1 size-5 accent-brand" />
            <span><span className="block font-semibold">Sim, quero adicionar: {p.bump_titulo} por apenas {brl(p.bump_preco_centavos!)}</span><span className="text-sm text-muted">{p.bump_descricao}</span></span>
          </label>
        )}
      </div>
    </Dividido>
  )
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="flex items-center gap-3 text-lg"><span className="grid size-7 place-items-center rounded-full bg-brand/15 font-mono text-sm text-brand">{n}</span>{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Resumo({ p }: { p: Produto }) {
  return (
    <div className="relative">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Resumo do pedido</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line"><Capa url={p.capa_url} titulo={p.titulo} /></div>
      <h2 className="mt-4 text-2xl leading-snug">{p.titulo}</h2>
    </div>
  )
}
