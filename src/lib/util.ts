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

export const campo = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
export const botao = 'inline-block rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-on-brand transition hover:bg-brand-dark disabled:opacity-50'
export const botaoSec = 'inline-block rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand hover:text-brand'
export const cartao = 'rounded-xl border border-line bg-surface'

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
