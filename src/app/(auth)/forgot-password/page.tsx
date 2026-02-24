'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || !email) return
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border p-8 shadow-sm">
      <Link
        href="/login"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Login
      </Link>

      <h2 className="text-xl font-semibold mb-2">Passwort zurücksetzen</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
      </p>

      {sent ? (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            E-Mail gesendet!
          </p>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            Prüfe dein Postfach ({email}) und klicke auf den Link zum Zurücksetzen.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Senden...' : 'Reset-Link senden'}
          </button>
        </form>
      )}
    </div>
  )
}
