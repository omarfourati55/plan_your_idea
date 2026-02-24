'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ExternalLink, Search, BookOpen, Clock, Check } from 'lucide-react'
import { useLinkStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Link, ReadStatus } from '@/types'
import toast from 'react-hot-toast'
import Image from 'next/image'

type ViewMode = 'list' | 'grid'

const statusLabels: Record<ReadStatus, string> = {
  unread: 'Ungelesen',
  later: 'Später lesen',
  read: 'Gelesen',
}

const statusFilters: Array<{ value: ReadStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Alle' },
  { value: 'unread', label: 'Ungelesen' },
  { value: 'later', label: 'Später' },
  { value: 'read', label: 'Gelesen' },
]

export default function LinksPage() {
  const { links, loading, fetchLinks, createLink, updateLink, deleteLink } = useLinkStore()
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReadStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const filtered = links.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    const matchesSearch =
      !search ||
      l.url.toLowerCase().includes(search.toLowerCase()) ||
      (l.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.description ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed || adding) return

    setAdding(true)
    try {
      const link = await createLink({ url: trimmed })
      if (link) {
        toast.success('Link gespeichert')
        setUrl('')
      } else {
        toast.error('Ungültige URL')
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(id: string, status: ReadStatus) {
    await updateLink(id, { status })
    toast.success(`Als "${statusLabels[status]}" markiert`)
  }

  async function handleDelete(id: string) {
    await deleteLink(id)
    toast.success('Link gelöscht')
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Links</h1>
        <p className="text-muted-foreground text-sm mt-1">{links.length} Links gespeichert</p>
      </header>

      {/* Add URL form */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... URL einfügen und speichern"
          type="url"
          className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-primary"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={!url.trim() || adding}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {adding ? 'Lädt...' : 'Hinzufügen'}
        </button>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Links durchsuchen..."
            className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-lg text-sm outline-none focus:ring-2 ring-primary"
          />
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition',
                statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={cn('px-3 py-2 text-xs transition', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            aria-label="Listenansicht"
          >
            ☰
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn('px-3 py-2 text-xs transition', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            aria-label="Kachelansicht"
          >
            ⊞
          </button>
        </div>
      </div>

      {loading && (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3')}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">Keine Links gefunden</p>
          <p className="text-sm mt-1">Füge Links über das Eingabefeld hinzu</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3')}>
          {filtered.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              viewMode={viewMode}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LinkCard({
  link,
  viewMode,
  onStatusChange,
  onDelete,
}: {
  link: Link
  viewMode: ViewMode
  onStatusChange: (id: string, status: ReadStatus) => void
  onDelete: (id: string) => void
}) {
  const hostname = (() => {
    try { return new URL(link.url).hostname } catch { return link.url }
  })()

  if (viewMode === 'list') {
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors group">
        {link.image && (
          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <Image src={link.image} alt="" fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm hover:underline flex items-center gap-1 group/link"
              >
                <span className="truncate">{link.title ?? hostname}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 flex-shrink-0" />
              </a>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{hostname}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onStatusChange(link.id, link.status === 'read' ? 'unread' : 'read')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Als gelesen markieren">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onStatusChange(link.id, 'later')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Später lesen">
                <Clock className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(link.id)} className="p-1.5 rounded hover:bg-destructive hover:text-destructive-foreground transition text-muted-foreground" title="Löschen">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {link.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{link.description}</p>
          )}
          <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full mt-2', {
            'bg-muted': link.status === 'unread',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400': link.status === 'later',
            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': link.status === 'read',
          })}>
            {statusLabels[link.status]}
          </span>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow group">
      {link.image && (
        <div className="relative h-36 bg-muted">
          <Image src={link.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" />
        </div>
      )}
      <div className="p-4">
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:underline line-clamp-2">
          {link.title ?? hostname}
        </a>
        <p className="text-xs text-muted-foreground mt-1">{hostname}</p>
        {link.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{link.description}</p>
        )}
        <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full', {
            'bg-muted': link.status === 'unread',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400': link.status === 'later',
            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': link.status === 'read',
          })}>
            {statusLabels[link.status]}
          </span>
          <div className="flex gap-1">
            <button onClick={() => onStatusChange(link.id, link.status === 'read' ? 'unread' : 'read')} className="p-1 rounded hover:bg-muted transition" title="Gelesen">
              <Check className="h-3 w-3" />
            </button>
            <button onClick={() => onDelete(link.id)} className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition" title="Löschen">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
