'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, LogOut, Download, Bell, Bot } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [briefingTime, setBriefingTime] = useState('08:00')

  async function handleExport() {
    toast.success('Export wird vorbereitet...')
    // Data export – would fetch all data and create JSON
    const data = {
      exported_at: new Date().toISOString(),
      note: 'DayFlow Daten-Export',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dayflow-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground text-sm mt-1">Passe DayFlow an deine Bedürfnisse an</p>
      </header>

      <div className="space-y-6">
        {/* Theme */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Erscheinungsbild</h2>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Hell', icon: Sun },
              { value: 'dark', label: 'Dunkel', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                  theme === value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Benachrichtigungen</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
                aria-label="Benachrichtigungen"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
          {notifications && (
            <div className="mt-3">
              <label className="block text-sm text-muted-foreground mb-1">Tages-Briefing Uhrzeit</label>
              <input
                type="time"
                value={briefingTime}
                onChange={(e) => setBriefingTime(e.target.value)}
                className="bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary"
              />
            </div>
          )}
        </section>

        {/* KI */}
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">KI-Unterstützung (Opt-in)</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="sr-only peer"
                aria-label="KI aktivieren"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Claude AI für Tages-Briefing, Task-Priorisierung und Ideen-Assistent aktivieren.
            Deine Daten werden nur für KI-Features verwendet, wenn du dies aktivierst.
          </p>
        </section>

        {/* Data */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Daten & Datenschutz</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition text-left"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Daten exportieren</p>
                <p className="text-xs text-muted-foreground">Alle deine Daten als JSON herunterladen</p>
              </div>
            </button>
            <hr className="border-border" />
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition text-left text-destructive">
              <LogOut className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Abmelden</p>
                <p className="text-xs text-muted-foreground">Aus diesem Gerät abmelden</p>
              </div>
            </button>
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          DayFlow v1.0 · Daten auf EU-Servern · DSGVO-konform
        </p>
      </div>
    </div>
  )
}
