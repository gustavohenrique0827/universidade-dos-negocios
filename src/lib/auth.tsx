import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

export type Role = 'aluno' | 'produtor' | 'admin'
type Profile = { id: string; nome: string | null; role: Role }
type AuthState = { session: Session | null; profile: Profile | null; loading: boolean; setProfile: (p: Profile | null) => void }

const AuthContext = createContext<AuthState>({ session: null, profile: null, loading: true, setProfile: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('id, nome, role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data as Profile | null)
        setLoading(false)
      })
  }, [userId])

  return <AuthContext.Provider value={{ session, profile, loading, setProfile }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
