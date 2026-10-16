import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Cert = { codigo: string; nome_aluno: string; titulo_curso: string; emitido_em: string }

export default function Certificado() {
  const { codigo } = useParams()
  const [c, setC] = useState<Cert | null | undefined>(undefined)

  useEffect(() => {
    supabase.rpc('verify_certificate', { p_codigo: codigo }).then(({ data }) => setC((data as Cert | null) ?? null))
  }, [codigo])

  if (c === undefined) return <p className="p-8 text-muted">Verificando…</p>
  if (c === null) return <p className="p-8 text-bad">Certificado não encontrado.</p>

  return (
    <main className="mx-auto mt-10 max-w-2xl rounded-xl border-4 border-double border-brand bg-surface p-10 text-center print:border-black print:bg-surface print:text-black">
      <p className="text-sm uppercase tracking-widest text-brand">Universidade dos Negócios</p>
      <h1 className="mt-4 text-3xl font-bold">Certificado de conclusão</h1>
      <p className="mt-8 text-muted">Certificamos que</p>
      <p className="mt-1 text-2xl font-semibold">{c.nome_aluno}</p>
      <p className="mt-4 text-muted">concluiu o curso</p>
      <p className="mt-1 text-xl">{c.titulo_curso}</p>
      <p className="mt-8 text-sm text-muted">Emitido em {new Date(c.emitido_em).toLocaleDateString('pt-BR')} · Código {c.codigo}</p>
      <button onClick={() => window.print()} className="mt-6 rounded-md border border-line px-3 py-1.5 text-sm print:hidden">Imprimir / salvar PDF</button>
    </main>
  )
}
