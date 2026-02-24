'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ArrowRight, Search } from 'lucide-react'
import { useIdeaStore, useTaskStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Idea, IdeaColor } from '@/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const colorClasses: Record<IdeaColor, string> = {
  default: 'bg-card border',
  red: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
  green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
}

const colorOptions: Array<{ value: IdeaColor; label: string; dot: string }> = [
  { value: 'default', label: 'Standard', dot: 'bg-border' },
  { value: 'red', label: 'Rot', dot: 'bg-red-400' },
  { value: 'yellow', label: 'Gelb', dot: 'bg-yellow-400' },
  { value: 'green', label: 'Grün', dot: 'bg-green-400' },
  { value: 'blue', label: 'Blau', dot: 'bg-blue-400' },
  { value: 'purple', label: 'Lila', dot: 'bg-purple-400' },
]

export default function IdeasPage() {
  const { ideas, loading, fetchIdeas, createIdea, deleteIdea, convertIdeaToTask } = useIdeaStore()
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<IdeaColor>('default')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  const filteredIdeas = ideas.filter(
    (i) =>
      !search ||
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
    await deleteIdea(id)
    toast.success('Idee gelöscht')
  }

  async function handleConvert(id: string) {
    const task = await convertIdeaToTask(id)
    if (task) {
      await fetchTasks()
      toast.success('Idee als Aufgabe gespeichert')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Ideen</h1>
          <p className="text-muted-foreground text-sm mt-1">{ideas.length} Ideen gespeichert</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Neue Idee
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border rounded-xl bg-card space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel der Idee..."
            className="w-full bg-muted rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 ring-primary"
            maxLength={500}
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Details, Gedanken, Notizen..."
            rows={3}
            className="w-full bg-muted rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 ring-primary resize-none"
            maxLength={10000}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {colorOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition',
                  color === c.value ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'
                )}
                title={c.label}
              >
                <span className={cn('w-3 h-3 rounded-full', c.dot)} />
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!title.trim() || creating}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ideen durchsuchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-lg text-sm outline-none focus:ring-2 ring-primary"
        />
      </div>

      {loading && (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse break-inside-avoid" />
          ))}
        </div>
      )}

      {!loading && filteredIdeas.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">Noch keine Ideen</p>
          <p className="text-sm mt-1">Erfasse deine erste Idee mit dem Button oben</p>
        </div>
      )}

      {!loading && filteredIdeas.length > 0 && (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onDelete={handleDelete}
              onConvert={handleConvert}
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
}: {
  idea: Idea
  onDelete: (id: string) => void
  onConvert: (id: string) => void
}) {
  return (
    <div className={cn('rounded-xl border p-4 mb-4 break-inside-avoid group', colorClasses[idea.color])}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-snug">{idea.title}</h3>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onConvert(idea.id)}
            className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-foreground"
            title="Als Aufgabe speichern"
            aria-label="Als Aufgabe konvertieren"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-1.5 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition text-muted-foreground"
            title="Idee löschen"
            aria-label="Idee löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {idea.content && (
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{idea.content}</p>
      )}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {idea.tags.map((tag) => (
            <span key={tag} className="text-xs bg-background/60 rounded-full px-2 py-0.5 border">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-3">
        {format(new Date(idea.created_at), 'dd.MM.yyyy', { locale: de })}
      </p>
    </div>
  )
}
