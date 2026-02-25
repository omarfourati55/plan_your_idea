'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, Trash2, Calendar, Clock, Tag, AlignLeft,
  RefreshCw, Plus, CheckSquare, Square,
} from 'lucide-react'
import { cn, getStatusConfig } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import type { Task, TaskStatus, Priority } from '@/types'

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done', 'cancelled']

interface TaskEditDrawerProps {
  task: Task | null
  subtasks: Task[]
  onClose: () => void
  onSave: (id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'due_date' | 'due_time' | 'tags'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleSubtask: (id: string) => void
  onAddSubtask: (parentId: string, title: string, dueDate: string | null) => Promise<void>
}

export function TaskEditDrawer({
  task,
  subtasks,
  onClose,
  onSave,
  onDelete,
  onToggleSubtask,
  onAddSubtask,
}: TaskEditDrawerProps) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState<Priority>('medium')
  const [status, setStatus]           = useState<TaskStatus>('todo')
  const [dueDate, setDueDate]         = useState('')
  const [dueTime, setDueTime]         = useState('')
  const [tagInput, setTagInput]       = useState('')
  const [tags, setTags]               = useState<string[]>([])
  const [saving, setSaving]           = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [dirty, setDirty]             = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority)
    setStatus(task.status ?? 'todo')
    setDueDate(task.due_date ?? '')
    setDueTime(task.due_time?.slice(0, 5) ?? '')
    setTags(task.tags ?? [])
    setDirty(false)
    setTimeout(() => titleRef.current?.focus(), 50)
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Esc closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSave() {
    if (!task || !title.trim() || saving) return
    setSaving(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        tags,
      })
      setDirty(false)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    await onDelete(task.id)
    onClose()
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t || tags.includes(t) || tags.length >= 10) return
    setTags((prev) => [...prev, t])
    setTagInput('')
    setDirty(true)
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t))
    setDirty(true)
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !subtaskInput.trim()) return
    await onAddSubtask(task.id, subtaskInput.trim(), task.due_date)
    setSubtaskInput('')
  }

  const isOpen = !!task

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal
        aria-label="Aufgabe bearbeiten"
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border/80 shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <span className="text-sm font-semibold text-muted-foreground">Aufgabe bearbeiten</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {task && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Title */}
            <div>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
                className="w-full text-xl font-semibold bg-transparent outline-none border-b-2 border-transparent focus:border-violet-500/50 transition-colors pb-1"
                placeholder="Aufgabentitel..."
                maxLength={500}
              />
            </div>

            {/* Status */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Status</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {ALL_STATUSES.map((s) => {
                  const cfg = getStatusConfig(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setStatus(s); setDirty(true) }}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all',
                        s === status
                          ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color} shadow-sm`
                          : 'border-border/50 bg-card hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <span className={cn('text-base', cfg.pulse && s === status && 'animate-pulse')}>
                        {cfg.icon}
                      </span>
                      <span className="text-[10px] font-semibold leading-tight">{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Priorität</p>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                  const colors: Record<Priority, string> = {
                    high:   'text-rose-500 bg-rose-500/10 border-rose-500/30',
                    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
                    low:    'text-sky-500 bg-sky-500/10 border-sky-500/30',
                  }
                  const labels: Record<Priority, string> = { high: '🔴 Hoch', medium: '🟡 Mittel', low: '🔵 Niedrig' }
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPriority(p); setDirty(true) }}
                      className={cn(
                        'flex-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-all',
                        p === priority
                          ? colors[p]
                          : 'border-border/50 bg-card text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {labels[p]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Fälligkeit</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => { setDueDate(e.target.value); setDirty(true) }}
                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                  />
                </div>
                <div className="flex items-center gap-2 w-36 bg-muted/50 border border-border/50 rounded-xl px-3 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => { setDueTime(e.target.value); setDirty(true) }}
                    className="flex-1 bg-transparent text-sm outline-none min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <AlignLeft className="h-3 w-3" /> Beschreibung
              </p>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDirty(true) }}
                placeholder="Notizen zur Aufgabe..."
                rows={4}
                maxLength={5000}
                className="w-full bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 resize-none transition-all"
              />
            </div>

            {/* Tags */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:text-rose-500 transition-colors ml-0.5"
                      aria-label={`Tag ${t} entfernen`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag() }
                    if (e.key === ',') { e.preventDefault(); addTag() }
                  }}
                  placeholder="Tag hinzufügen..."
                  className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-500/50 transition-colors"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 bg-muted border border-border/50 rounded-xl hover:bg-accent disabled:opacity-40 transition text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckSquare className="h-3 w-3" /> Teilaufgaben {subtasks.length > 0 && `(${subtasks.filter((s) => s.completed).length}/${subtasks.length})`}
              </p>
              {subtasks.length > 0 && (
                <ul className="space-y-1.5 mb-2.5">
                  {subtasks.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 group transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleSubtask(sub.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={sub.completed ? 'Wieder öffnen' : 'Erledigt'}
                      >
                        {sub.completed
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                      <span className={cn(
                        'text-sm flex-1',
                        sub.completed && 'line-through text-muted-foreground'
                      )}>
                        {sub.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="+ Neue Teilaufgabe..."
                  className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-500/50 transition-colors"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!subtaskInput.trim()}
                  className="px-3 py-2 bg-muted border border-border/50 rounded-xl hover:bg-accent disabled:opacity-40 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        {task && (
          <div className="px-5 py-4 border-t border-border/60 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition"
              aria-label="Aufgabe löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border/60 text-sm hover:bg-muted transition"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || saving || !dirty}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                dirty && title.trim()
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:brightness-110'
                  : 'bg-muted text-muted-foreground cursor-default'
              )}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
