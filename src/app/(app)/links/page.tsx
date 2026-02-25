'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, ExternalLink, Search, Clock, Check, Link2, LayoutGrid, List } from 'lucide-react'
import { useLinkStore } from '@/store'
import { cn } from '@/lib/utils'
import type { Link, ReadStatus } from '@/types'
import toast from 'react-hot-toast'
import Image from 'next/image'

type ViewMode = 'list' | 'grid'

const statusLabels: Record<ReadStatus, string> = {
  unread: 'Ungelesen',
  later:  'Später',
  read:   'Gelesen',
}

const statusBadge: Record<ReadStatus, string> = {
  unread: 'bg-muted text-muted-foreground',
  later:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  read:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const statusFilters: Array<{ value: ReadStatus | 'all'; label: string }> = [
  { value: 'all',    label: 'Alle'      },
  { value: 'unread', label: 'Ungelesen' },
  { value: 'later',  label: 'Später'   },
  { value: 'read',   label: 'Gelesen'   },
]

export default function LinksPage() {
  const { links, loading, fetchLinks, createLink, updateLink, deleteLink } = useLinkStore()
  const [url, setUrl]                 = useState('')
  const [adding, setAdding]           = useState(false)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<ReadStatus | 'all'>('all')
  const [viewMode, setViewMode]       = useState<ViewMode>('list')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const filtered = links.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    const matchesSearch = !search ||
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
      if (link) { toast.success('Link gespeichert'); setUrl('') }
      else toast.error('Ungültige URL')
    } finally {
      setAdding(false)
    }
  }

  async function handleStatusChange(id: string, status: ReadStatus) {
    await updateLink(id, { status })
    toast.success(`Als "${statusLabels[status]}" markiert`)
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    await deleteLink(id)
    setDeleteConfirm(null)
    toast.success('Link gelöscht')
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-7">
        <h1 className="text-3xl font-bold">Links</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {links.length === 0 ? 'Noch keine Links gespeichert' : `${links.length} Link${links.length !== 1 ? 's' : ''} gespeichert`}
        </p>
      </header>

      {/* Add URL form */}
      <form onSubmit={handleAdd} className="mb-7 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... URL einfügen und speichern"
          type="url"
          className="flex-1 bg-card border border-border/60 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm outline-none transition-all"
          disabled={adding}
        />
        <button
          type="submit"
          disabled={!url.trim() || adding}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-md shadow-violet-500/25 hover:brightness-110 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {adding ? 'Lädt...' : 'Hinzufügen'}
        </button>
      </form>

      {/* Filters & view toggle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Links durchsuchen..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl text-sm outline-none transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex rounded-xl border border-border/60 overflow-hidden bg-card">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-all',
                statusFilter === f.value
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-border/60 overflow-hidden bg-card">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2.5 transition-all',
              viewMode === 'list'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                : 'text-muted-foreground hover:bg-muted'
            )}
            aria-label="Listenansicht"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2.5 transition-all',
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                : 'text-muted-foreground hover:bg-muted'
            )}
            aria-label="Kachelansicht"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3')}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('rounded-xl skeleton', viewMode === 'grid' ? 'h-56' : 'h-24')} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-5">
            <Link2 className="h-10 w-10 text-sky-400 opacity-70" />
          </div>
          <p className="font-semibold text-lg">{search || statusFilter !== 'all' ? 'Keine Links gefunden' : 'Noch keine Links'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || statusFilter !== 'all' ? 'Versuche andere Filter' : 'Füge Links über das Eingabefeld hinzu'}
          </p>
        </div>
      )}

      {/* Links */}
      {!loading && filtered.length > 0 && (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2')}>
          {filtered.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              viewMode={viewMode}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              deleteConfirm={deleteConfirm}
              onCancelDelete={() => setDeleteConfirm(null)}
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
  deleteConfirm,
  onCancelDelete,
}: {
  link: Link
  viewMode: ViewMode
  onStatusChange: (id: string, status: ReadStatus) => void
  onDelete: (id: string) => void
  deleteConfirm: string | null
  onCancelDelete: () => void
}) {
  const isConfirming = deleteConfirm === link.id
  const hostname = (() => {
    try { return new URL(link.url).hostname.replace('www.', '') } catch { return link.url }
  })()

  if (viewMode === 'list') {
    return (
      <div className={cn(
        'flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card transition-all duration-200 group',
        isConfirming ? 'ring-2 ring-destructive/40' : 'hover:shadow-card hover:border-violet-500/20'
      )}>
        {/* Thumbnail */}
        {link.image ? (
          <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
            <Image src={link.image} alt="" fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-muted flex items-center justify-center">
            {link.favicon ? (
              <Image src={link.favicon} alt="" width={24} height={24} className="rounded" />
            ) : (
              <Link2 className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1 group/link"
              >
                <span className="truncate">{link.title ?? hostname}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-60 flex-shrink-0" />
              </a>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{hostname}</p>
            </div>

            {/* Actions */}
            {isConfirming ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onDelete(link.id)}
                  className="px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium"
                >
                  Löschen
                </button>
                <button
                  onClick={onCancelDelete}
                  className="px-2.5 py-1 rounded-lg bg-muted text-xs text-muted-foreground"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onStatusChange(link.id, link.status === 'read' ? 'unread' : 'read')}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  title="Gelesen / Ungelesen"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onStatusChange(link.id, 'later')}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  title="Später lesen"
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(link.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                  title="Löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {link.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {link.description}
            </p>
          )}

          <span className={cn('inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-2', statusBadge[link.status])}>
            {statusLabels[link.status]}
          </span>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className={cn(
      'rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-200 group',
      isConfirming ? 'ring-2 ring-destructive/40' : 'hover:shadow-card-hover hover:border-violet-500/20'
    )}>
      {link.image ? (
        <div className="relative h-40 bg-muted">
          <Image src={link.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Link2 className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
      <div className="p-4">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2 leading-snug"
        >
          {link.title ?? hostname}
        </a>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{hostname}</p>
        {link.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{link.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusBadge[link.status])}>
            {statusLabels[link.status]}
          </span>

          {isConfirming ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => onDelete(link.id)}
                className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-medium"
              >
                Löschen
              </button>
              <button
                onClick={onCancelDelete}
                className="px-2 py-1 rounded-lg bg-muted text-[10px]"
              >
                Nein
              </button>
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => onStatusChange(link.id, link.status === 'read' ? 'unread' : 'read')}
                className="p-1 rounded-lg hover:bg-muted transition"
                title="Gelesen"
              >
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => onDelete(link.id)}
                className="p-1 rounded-lg hover:bg-destructive/10 transition"
                title="Löschen"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
