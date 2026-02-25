'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Sun, Moon, Monitor, LogOut, Download, Bell, Bot, Shield, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [notifications, setNotifications] = useState(true)
  const [aiEnabled, setAiEnabled]         = useState(false)
  const [briefingTime, setBriefingTime]   = useState('08:00')
  const [saving, setSaving]               = useState(false)
  const [exporting, setExporting]         = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const { data } = await res.json()
          if (data) {
            setNotifications(data.notifications_enabled ?? true)
            setAiEnabled(data.ai_enabled ?? false)
            setBriefingTime(data.daily_briefing_time ?? '08:00')
            if (data.dark_mode && ['light', 'dark', 'system'].includes(data.dark_mode)) {
              setTheme(data.dark_mode)
            }
          }
        }
      } catch {
        // defaults used
      }
    }
    loadSettings()
  }, [setTheme])

  async function handleSaveSettings(patch: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Fehler beim Speichern')
      }
    } catch {
      toast.error('Verbindungsfehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) { toast.error('Export fehlgeschlagen'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `dayflow-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export erfolgreich')
    } catch {
      toast.error('Export fehlgeschlagen')
    } finally {
      setExporting(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Abgemeldet')
    router.push('/login')
    router.refresh()
  }

  const themeOptions = [
    { value: 'light',  label: 'Hell',   icon: Sun },
    { value: 'dark',   label: 'Dunkel', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Passe DayFlow an deine Bedürfnisse an
        </p>
      </header>

      <div className="space-y-4">

        {/* Theme */}
        <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 flex items-center justify-center">
                <Monitor className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <h2 className="font-semibold text-sm">Erscheinungsbild</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setTheme(value); handleSaveSettings({ dark_mode: value }) }}
                  className={cn(
                    'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-150',
                    theme === value
                      ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <h2 className="font-semibold text-sm">Benachrichtigungen</h2>
              </div>
              <Toggle
                checked={notifications}
                onChange={(v) => { setNotifications(v); handleSaveSettings({ notifications_enabled: v }) }}
                label="Benachrichtigungen"
              />
            </div>
          </div>
          {notifications && (
            <div className="p-5 animate-fade-in">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Tages-Briefing Uhrzeit
              </label>
              <input
                type="time"
                value={briefingTime}
                onChange={(e) => setBriefingTime(e.target.value)}
                onBlur={() => handleSaveSettings({ daily_briefing_time: briefingTime })}
                className="bg-muted border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20 focus:border-primary/40 transition-all"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Empfange täglich ein KI-generiertes Briefing zu dieser Uhrzeit.
              </p>
            </div>
          )}
        </section>

        {/* KI */}
        <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">KI-Unterstützung</h2>
                  <span className="text-[10px] text-muted-foreground">Opt-in</span>
                </div>
              </div>
              <Toggle
                checked={aiEnabled}
                onChange={(v) => { setAiEnabled(v); handleSaveSettings({ ai_enabled: v }) }}
                label="KI aktivieren"
              />
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aktiviere Claude AI für Tages-Briefing, smarte Task-Priorisierung und den Ideen-Assistenten.
              Deine Daten werden nur verarbeitet, wenn diese Option aktiv ist.
            </p>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <h2 className="font-semibold text-sm">Daten & Datenschutz</h2>
            </div>
          </div>
          <div className="divide-y divide-border/40">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-3 w-full px-5 py-4 hover:bg-muted/50 transition text-left disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{exporting ? 'Exportiere...' : 'Daten exportieren'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Alle deine Daten als JSON herunterladen</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-4 hover:bg-destructive/5 transition text-left text-destructive"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Abmelden</p>
                <p className="text-xs text-destructive/60 mt-0.5">Aus diesem Gerät abmelden</p>
              </div>
              <ChevronRight className="h-4 w-4 text-destructive/40" />
            </button>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-1">
        {saving && <p className="text-xs text-muted-foreground">Wird gespeichert...</p>}
        <p className="text-xs text-muted-foreground">
          DayFlow v1.0 · Daten auf EU-Servern · DSGVO-konform
        </p>
      </div>
    </div>
  )
}

// ─── Toggle switch component ─────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
        aria-label={label}
      />
      <div className={cn(
        'w-11 h-6 rounded-full transition-all duration-200 relative',
        'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
        'after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm',
        'peer-checked:after:translate-x-5',
        checked ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-muted border border-border/60'
      )} />
    </label>
  )
}
