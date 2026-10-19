export const brl = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const REF_KEY = 'un_ref'
export function guardarRef(slug: string, codigo: string) {
  try { localStorage.setItem(REF_KEY, JSON.stringify({ slug, codigo })) } catch { /* ignore */ }
}
export function lerRef(slug: string): string | null {
  try {
    const r = JSON.parse(localStorage.getItem(REF_KEY) ?? 'null')
    return r?.slug === slug ? r.codigo : null
  } catch { return null }
}

export const campo = 'rounded-xl border border-line bg-surface/80 px-3.5 py-2.5 text-sm text-ink outline-none transition duration-150 placeholder:text-muted/60 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15 shadow-inner'
export const botao = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-center text-sm font-bold text-on-brand shadow-lg shadow-brand/20 transition-all duration-200 hover:shadow-brand/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
export const botaoSec = 'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface/90 px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:border-brand/60 hover:bg-wash hover:text-brand hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
export const cartao = 'rounded-2xl border border-line/90 bg-surface/85 backdrop-blur-md shadow-xl shadow-black/20 transition-all duration-200'

export const TAXA_PLATAFORMA = 0.099
export const liquido = (valor: number, comissao = 0) => Math.floor(valor * (1 - TAXA_PLATAFORMA)) - comissao

export const dataBR = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')
export const dataHoraBR = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export const STATUS_PEDIDO: Record<string, { rotulo: string; cor: string }> = {
  pago: { rotulo: 'Aprovada', cor: 'bg-ok/10 text-ok' },
  pendente: { rotulo: 'Aguardando pagamento', cor: 'bg-outlier/20 text-outlier' },
  cancelado: { rotulo: 'Cancelada', cor: 'bg-wash text-muted' },
  reembolsado: { rotulo: 'Reembolsada', cor: 'bg-bad/10 text-bad' },
}
export const METODO: Record<string, string> = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' }

export function baixarCSV(nome: string, linhas: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = '﻿' + linhas.map((l) => l.map(esc).join(';')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = nome
  a.click()
  URL.revokeObjectURL(a.href)
}
