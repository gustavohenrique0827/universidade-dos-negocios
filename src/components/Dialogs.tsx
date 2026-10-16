import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from './Icon'

type Pergunta = { tipo: 'confirmar'; titulo: string; texto?: string; acao: string; perigo?: boolean } | { tipo: 'texto'; titulo: string; rotulo: string; inicial?: string; acao: string; multilinha?: boolean }
type Aviso = { id: number; texto: string; erro?: boolean }
type Ctx = {
  confirmar: (titulo: string, o?: { texto?: string; acao?: string; perigo?: boolean }) => Promise<boolean>
  perguntar: (titulo: string, rotulo: string, o?: { inicial?: string; acao?: string; multilinha?: boolean }) => Promise<string | null>
  avisar: (texto: string, erro?: boolean) => void
}

const DialogCtx = createContext<Ctx | null>(null)
export const useDialogs = () => useContext(DialogCtx)!

/** Substitui confirm()/prompt()/alert() do navegador por diálogos e avisos da própria interface. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<(Pergunta & { resolver: (v: unknown) => void }) | null>(null)
  const [valor, setValor] = useState('')
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const campo = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const cancelar = useRef<HTMLButtonElement>(null)
  const foco = useRef<Element | null>(null)

  const abrir = useCallback((q: Pergunta) => new Promise<unknown>((resolver) => { foco.current = document.activeElement; setValor(q.tipo === 'texto' ? q.inicial ?? '' : ''); setP({ ...q, resolver }) }), [])
  const fechar = (v: unknown) => { p?.resolver(v); setP(null); (foco.current as HTMLElement | null)?.focus?.() }

  const ctx: Ctx = {
    confirmar: (titulo, o) => abrir({ tipo: 'confirmar', titulo, texto: o?.texto, acao: o?.acao ?? 'Confirmar', perigo: o?.perigo }) as Promise<boolean>,
    perguntar: (titulo, rotulo, o) => abrir({ tipo: 'texto', titulo, rotulo, inicial: o?.inicial, acao: o?.acao ?? 'Salvar', multilinha: o?.multilinha }) as Promise<string | null>,
    avisar: (texto, erro) => {
      const id = Date.now() + Math.random()
      setAvisos((a) => [...a, { id, texto, erro }])
      setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), erro ? 6000 : 3500)
    },
  }

  useEffect(() => {
    if (!p) return
    ;(p.tipo === 'texto' ? campo.current : p.perigo ? cancelar.current : botao.current)?.focus()
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { p.resolver(p.tipo === 'confirmar' ? false : null); setP(null) } }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [p])

  return (
    <DialogCtx.Provider value={ctx}>
      {children}
      {p && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && fechar(p.tipo === 'confirmar' ? false : null)}>
          <form role="dialog" aria-modal="true" aria-labelledby="dlg-t" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl"
            onSubmit={(e) => { e.preventDefault(); fechar(p.tipo === 'confirmar' ? true : valor.trim()) }}>
            <h2 id="dlg-t" className="text-xl">{p.titulo}</h2>
            {p.tipo === 'confirmar' && p.texto && <p className="mt-2 text-sm text-muted">{p.texto}</p>}
            {p.tipo === 'texto' && (
              <label className="mt-4 block text-sm font-medium">{p.rotulo}
                {p.multilinha
                  ? <textarea ref={campo} value={valor} onChange={(e) => setValor(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal outline-none focus:border-brand" />
                  : <input ref={campo} value={valor} onChange={(e) => setValor(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal outline-none focus:border-brand" />}
              </label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelar} type="button" onClick={() => fechar(p.tipo === 'confirmar' ? false : null)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-ink/40">Cancelar</button>
              <button ref={botao} className={`rounded-lg px-4 py-2 text-sm font-semibold ${p.tipo === 'confirmar' && p.perigo ? 'bg-bad text-on-brand' : 'bg-brand text-on-brand hover:bg-brand-dark'}`}>{p.acao}</button>
            </div>
          </form>
        </div>
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} role={a.erro ? 'alert' : 'status'} className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl ${a.erro ? 'border-bad/40 bg-surface text-bad' : 'border-line bg-surface text-ink'}`}>
            <Icon nome={a.erro ? 'fechar' : 'check'} tamanho={16} className={a.erro ? '' : 'text-ok'} />{a.texto}
          </div>
        ))}
      </div>
    </DialogCtx.Provider>
  )
}
