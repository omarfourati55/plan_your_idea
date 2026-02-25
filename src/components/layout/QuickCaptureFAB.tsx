'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Link2, Lightbulb, Loader2 } from 'lucide-react'
import { cn, isValidUrl } from '@/lib/utils'
import { useIdeaStore, useLinkStore } from '@/store'
import toast from 'react-hot-toast'

export function QuickCaptureFAB() {
  const [open, setOpen]       = useState(false)
  const [value, setValue]     = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)
  const createIdea            = useIdeaStore((s) => s.createIdea)
  const createLink            = useLinkStore((s) => s.createLink)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return
    setLoading(true)
    try {
      if (isValidUrl(trimmed)) {
        const link = await createLink({ url: trimmed })
        if (link) { toast.success('Link gespeichert'); setValue(''); setOpen(false) }
        else toast.error('Fehler beim Speichern des Links')
      } else {
        const idea = await createIdea({ title: trimmed })
        if (idea) { toast.success('Idee gespeichert'); setValue(''); setOpen(false) }
        else toast.error('Fehler beim Speichern der Idee')
      }
    } finally {
      setLoading(false)
    }
  }

  const isUrl  = isValidUrl(value.trim())
  const hasVal = value.trim().length > 0

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-3">
        {/* Popup */}
        {open && (
          <div className="bg-card border border-border/60 rounded-2xl shadow-2xl p-5 w-80 animate-slide-up">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold">Quick Capture</p>
              {hasVal && (
                <div className={cn(
                  'ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                  isUrl
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  {isUrl
                    ? <><Link2 className="h-3 w-3" /> Link</>
                    : <><Lightbulb className="h-3 w-3" /> Idee</>
                  }
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Idee oder URL eingeben..."
                className="flex-1 bg-muted/60 border border-border/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                disabled={loading}
                maxLength={2048}
              />
              <button
                type="submit"
                disabled={!hasVal || loading}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl px-3.5 py-2.5 text-sm font-medium disabled:opacity-50 hover:brightness-110 transition-all shadow-md shadow-violet-500/20 flex items-center"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Los'}
              </button>
            </form>

            <p className="text-[11px] text-muted-foreground mt-2.5">
              URL → als Link · Text → als Idee speichern
            </p>
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Quick Capture schließen' : 'Quick Capture öffnen'}
          className={cn(
            'h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200',
            open
              ? 'bg-muted text-muted-foreground rotate-45 shadow-md'
              : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white hover:scale-110 hover:brightness-110 shadow-violet-500/40'
          )}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  )
}
