'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ArrowRight, Search, Lightbulb } from 'lucide-react'
import { useIdeaStore, useTaskStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Idea, IdeaColor } from '@/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const colorClasses: Record<IdeaColor, string> = {
  default: 'bg-card border-border/60',
  red:     'bg-rose-50   dark:bg-rose-950/20   border-rose-200   dark:border-rose-900/50',
  yellow:  'bg-amber-50  dark:bg-amber-950/20  border-amber-200  dark:border-amber-900/50',
  green:   'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
  blue:    'bg-sky-50    dark:bg-sky-950/20    border-sky-200    dark:border-sky-900/50',
  purple:  'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/50',
}

const colorOptions: Array<{ value: IdeaColor; dot: string; label: string }> = [
  { value: 'default', dot: 'bg-muted-foreground/40', label: 'Standard' },
  { value: 'red',     dot: 'bg-rose-400',            label: 'Rot'      },
  { value: 'yellow',  dot: 'bg-amber-400',           label: 'Gelb'     },
  { value: 'green',   dot: 'bg-emerald-400',         label: 'Grün'     },
  { value: 'blue',    dot: 'bg-sky-400',             label: 'Blau'     },
  { value: 'purple',  dot: 'bg-violet-400',          label: 'Lila'     },
]

export default function IdeasPage() {
  const { ideas, loading, fetchIdeas, createIdea, deleteIdea, convertIdeaToTask } = useIdeaStore()
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [color, setColor]       = useState<IdeaColor>('default')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  const filteredIdeas = ideas.filter(
    (i) => !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.content.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t || creating) return
    setCreating(true)
    try {
      const idea = await createIdea({ title: t, content: content.trim(), color })
      if (idea) {
        toast.success('Idee erstellt')
        setTitle('')
        setContent('')
        setColor('default')
        setShowForm(false)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    await deleteIdea(id)
    setDeleteConfirm(null)
    toast.success('Idee gelöscht')
  }

  async function handleConvert(id: string) {
    const task = await convertIdeaToTask(id)
    if (task) {
      await fetchTasks()
      toast.success('Als Aufgabe gespeichert')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-7 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Ideen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ideas.length === 0 ? 'Noch keine Ideen' : `${ideas.length} Idee${ideas.length !== 1 ? 'n' : ''} gesammelt`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-md shadow-violet-500/25 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          Neue Idee
        </button>
      </header>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-7 p-5 border border-border/60 rounded-2xl bg-card shadow-card space-y-4 animate-scale-in"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel der Idee..."
            className="w-full bg-muted/60 border border-border/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            maxLength={500}
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Details, Gedanken, Notizen..."
            rows={3}
            className="w-full bg-muted/60 border border-border/40 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
            maxLength={10000}
          />
          {/* Color picker */}
          <div className="flex items-center gap-2 flex-wrap">
            {colorOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                  color === c.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/40 hover:border-border text-muted-foreground'
                )}
                title={c.label}
              >
                <span className={cn('w-2.5 h-2.5 rounded-full', c.dot)} />
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm rounded-xl border border-border/60 hover:bg-muted transition text-muted-foreground"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!title.trim() || creating}
              className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {creating ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ideen durchsuchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl text-sm outline-none transition-all"
        />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl skeleton break-inside-avoid" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredIdeas.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <Lightbulb className="h-10 w-10 text-amber-400 opacity-70" />
          </div>
          <p className="font-semibold text-lg">{search ? 'Keine Ideen gefunden' : 'Noch keine Ideen'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Versuche einen anderen Suchbegriff' : 'Klicke auf "Neue Idee" um loszulegen'}
          </p>
        </div>
      )}

      {/* Masonry grid */}
      {!loading && filteredIdeas.length > 0 && (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onDelete={handleDelete}
              onConvert={handleConvert}
              deleteConfirm={deleteConfirm}
              onCancelDelete={() => setDeleteConfirm(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function IdeaCard({
  idea,
  onDelete,
  onConvert,
  deleteConfirm,
  onCancelDelete,
}: {
  idea: Idea
  onDelete: (id: string) => void
  onConvert: (id: string) => void
  deleteConfirm: string | null
  onCancelDelete: () => void
}) {
  const isConfirming = deleteConfirm === idea.id

  return (
    <div className={cn(
      'rounded-2xl border p-4 mb-4 break-inside-avoid group transition-all duration-200 hover:-translate-y-0.5',
      colorClasses[idea.color],
      isConfirming && 'ring-2 ring-destructive/40'
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-snug flex-1">{idea.title}</h3>
        <div className={cn(
          'transition-opacity flex items-center gap-1 flex-shrink-0',
          isConfirming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {isConfirming ? (
            <>
              <button
                onClick={() => onDelete(idea.id)}
                className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium"
              >
                Löschen
              </button>
              <button
                onClick={onCancelDelete}
                className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs"
              >
                Abbrechen
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onConvert(idea.id)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition text-muted-foreground hover:text-foreground"
                title="Als Aufgabe speichern"
                aria-label="Als Aufgabe konvertieren"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(idea.id)}
                className="p-1.5 rounded-xl hover:bg-destructive/10 dark:hover:bg-destructive/20 transition text-muted-foreground hover:text-destructive"
                title="Idee löschen"
                aria-label="Idee löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {idea.content && (
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {idea.content}
        </p>
      )}

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {idea.tags.map((tag) => (
            <span key={tag} className="text-xs bg-black/5 dark:bg-white/10 rounded-full px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/60 mt-3">
        {format(new Date(idea.created_at), 'dd. MMM yyyy', { locale: de })}
      </p>
    </div>
  )
}
