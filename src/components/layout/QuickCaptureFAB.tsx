'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { cn, isValidUrl } from '@/lib/utils'
import { useTaskStore, useIdeaStore, useLinkStore } from '@/store'
import toast from 'react-hot-toast'

export function QuickCaptureFAB() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const createTask = useTaskStore((s) => s.createTask)
  const createIdea = useIdeaStore((s) => s.createIdea)
  const createLink = useLinkStore((s) => s.createLink)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return

    setLoading(true)
    try {
      if (isValidUrl(trimmed)) {
        const link = await createLink({ url: trimmed })
        if (link) {
          toast.success('Link gespeichert')
          setValue('')
          setOpen(false)
        } else {
          toast.error('Fehler beim Speichern des Links')
        }
      } else {
        const idea = await createIdea({ title: trimmed })
        if (idea) {
          toast.success('Idee gespeichert')
          setValue('')
          setOpen(false)
        } else {
          toast.error('Fehler beim Speichern der Idee')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const isUrl = isValidUrl(value.trim())

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="bg-card border rounded-xl shadow-xl p-4 w-80 animate-in slide-in-from-bottom-2">
            <p className="text-sm font-medium mb-2">
              Quick Capture
              {value.trim() && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  → {isUrl ? '🔗 Link' : '💡 Idee'}
                </span>
              )}
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Idee oder URL eingeben..."
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary"
                disabled={loading}
                maxLength={2048}
              />
              <button
                type="submit"
                disabled={!value.trim() || loading}
                className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? '...' : 'Los'}
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              URL → als Link speichern, Text → als Idee speichern
            </p>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Quick Capture schließen' : 'Quick Capture öffnen'}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all',
            open
              ? 'bg-destructive text-destructive-foreground rotate-45'
              : 'bg-primary text-primary-foreground hover:scale-105'
          )}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  )
}
