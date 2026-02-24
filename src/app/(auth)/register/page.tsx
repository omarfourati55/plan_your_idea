'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/today`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Bitte bestätige deine E-Mail-Adresse')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border p-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Konto erstellen</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name"
            className="w-full bg-muted rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-primary"
            disabled={loading}
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@beispiel.de"
            className="w-full bg-muted rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-primary"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mindestens 8 Zeichen"
              minLength={8}
              className="w-full bg-muted rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-primary pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mindestens 8 Zeichen</p>
        </div>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Bereits ein Konto?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Anmelden
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Durch die Registrierung stimmst du unseren Datenschutzbestimmungen zu.
        Deine Daten werden auf EU-Servern gespeichert.
      </p>
    </div>
  )
}
