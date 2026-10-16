import { useId, type ReactNode } from 'react'

export const estiloControle = (erro?: string) =>
  `w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:ring-2 ${erro ? 'border-bad focus:ring-bad/25' : 'border-line focus:border-brand focus:ring-brand/25'} disabled:opacity-60`

type ControleProps = { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; className: string }

/**
 * Campo de formulário padrão: rótulo, marca de obrigatório, dica e erro junto ao campo.
 * O controle (input, select, textarea) vem como função para receber os atributos de acessibilidade.
 */
export default function Campo({ rotulo, obrigatorio, dica, erro, children, className = '' }: { rotulo: string; obrigatorio?: boolean; dica?: string; erro?: string; children: (p: ControleProps) => ReactNode; className?: string }) {
  const id = useId()
  const desc = erro ? `${id}-e` : dica ? `${id}-d` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{rotulo}{obrigatorio && <span aria-hidden className="ml-0.5 text-bad">*</span>}</label>
      {children({ id, 'aria-invalid': erro ? true : undefined, 'aria-describedby': desc, className: estiloControle(erro) })}
      {erro ? <p id={`${id}-e`} role="alert" className="mt-1 text-xs text-bad">{erro}</p> : dica ? <p id={`${id}-d`} className="mt-1 text-xs text-muted">{dica}</p> : null}
    </div>
  )
}
