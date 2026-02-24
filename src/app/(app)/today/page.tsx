'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus, CheckCircle2, Circle, ChevronRight, Clock, Tag, GripVertical, SlidersHorizontal, RefreshCw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/store'
import { cn, getPriorityColor, getPriorityLabel } from '@/lib/utils'
import type { Task } from '@/types'
import toast from 'react-hot-toast'

export default function TodayPage() {
  const { tasks, loading, fetchTasks, createTask, toggleTask, moveTaskToDate } = useTaskStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [localOrder, setLocalOrder] = useState<string[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [taskTime, setTaskTime] = useState('')
  const [taskRecurring, setTaskRecurring] = useState<'daily' | 'weekly' | 'custom' | ''>('')

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const todayTasks = tasks.filter((t) => t.due_date === todayStr && !t.parent_id)
  const completedTasks = todayTasks.filter((t) => t.completed)
  const rawPending = todayTasks.filter((t) => !t.completed)

  // Maintain drag order for pending tasks
  useEffect(() => {
    const ids = rawPending.map((t) => t.id)
    setLocalOrder((prev) => {
      const prevSet = new Set(prev)
      const newIds = ids.filter((id) => !prevSet.has(id))
      const filtered = prev.filter((id) => ids.includes(id))
      return [...filtered, ...newIds]
    })
  }, [rawPending.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingTasks = localOrder
    .map((id) => rawPending.find((t) => t.id === id))
    .filter((t): t is Task => !!t)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || creating) return

    setCreating(true)
    try {
      const task = await createTask({
        title,
        due_date: todayStr,
        priority: taskPriority,
        due_time: taskTime || undefined,
        recurring: taskRecurring || null,
      })
      if (task) {
        setNewTaskTitle('')
        setTaskTime('')
        setTaskRecurring('')
        setTaskPriority('medium')
        setShowOptions(false)
        toast.success('Aufgabe erstellt')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(id: string) {
    await toggleTask(id)
  }

  async function handleMoveToTomorrow(id: string) {
    const tomorrow = format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')
    await moveTaskToDate(id, tomorrow)
    toast.success('Aufgabe auf morgen verschoben')
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">
          {format(today, 'EEEE, dd. MMMM yyyy', { locale: de })}
        </p>
        <h1 className="text-3xl font-bold mt-1">Heute</h1>
        <p className="text-muted-foreground mt-1">
          {pendingTasks.length} offen · {completedTasks.length} erledigt
        </p>
      </header>

      {/* Quick Add */}
      <form onSubmit={handleQuickCreate} className="mb-6">
        <div className="flex gap-2">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="+ Neue Aufgabe für heute..."
            className="flex-1 bg-muted border border-transparent focus:border-primary rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            disabled={creating}
            maxLength={500}
          />
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className={cn(
              'rounded-lg px-3 py-3 transition-colors border',
              showOptions ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            )}
            aria-label="Optionen anzeigen"
            title="Optionen"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={!newTaskTitle.trim() || creating}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
            aria-label="Aufgabe hinzufügen"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {showOptions && (
          <div className="mt-2 p-3 rounded-lg border bg-muted/50 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Priorität</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="text-xs bg-background border rounded px-2 py-1 outline-none focus:ring-1 ring-primary"
              >
                <option value="high">Hoch</option>
                <option value="medium">Mittel</option>
                <option value="low">Niedrig</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Uhrzeit</label>
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="text-xs bg-background border rounded px-2 py-1 outline-none focus:ring-1 ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
              <label className="text-xs font-medium text-muted-foreground">Wiederholung</label>
              <select
                value={taskRecurring}
                onChange={(e) => setTaskRecurring(e.target.value as 'daily' | 'weekly' | 'custom' | '')}
                className="text-xs bg-background border rounded px-2 py-1 outline-none focus:ring-1 ring-primary"
              >
                <option value="">Keine</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="custom">Benutzerdefiniert</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Pending Tasks with Drag & Drop */}
      {!loading && pendingTasks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Offen ({pendingTasks.length})
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onMoveToTomorrow={handleMoveToTomorrow}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* Empty state */}
      {!loading && todayTasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Keine Aufgaben für heute</p>
          <p className="text-sm mt-1">Trage deine erste Aufgabe ein</p>
        </div>
      )}

      {/* Completed Tasks */}
      {!loading && completedTasks.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Erledigt ({completedTasks.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onMoveToTomorrow={handleMoveToTomorrow}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SortableTaskItem({
  task,
  onToggle,
  onMoveToTomorrow,
}: {
  task: Task
  onToggle: (id: string) => void
  onMoveToTomorrow: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group',
          isDragging && 'shadow-lg'
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors touch-none"
          aria-label="Aufgabe ziehen"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Als erledigt markieren"
        >
          <Circle className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{task.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {task.due_time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.due_time.slice(0, 5)} Uhr
              </span>
            )}
            <span className={cn('text-xs font-medium', getPriorityColor(task.priority))}>
              {getPriorityLabel(task.priority)}
            </span>
            {task.tags.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                {task.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onMoveToTomorrow(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0"
          title="Auf morgen verschieben"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function TaskItem({
  task,
  onToggle,
  onMoveToTomorrow,
}: {
  task: Task
  onToggle: (id: string) => void
  onMoveToTomorrow: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group',
        task.completed && 'opacity-60'
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label={task.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            task.completed && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {task.due_time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.due_time.slice(0, 5)} Uhr
            </span>
          )}
          <span className={cn('text-xs font-medium', getPriorityColor(task.priority))}>
            {getPriorityLabel(task.priority)}
          </span>
          {task.tags.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              {task.tags.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>

      {!task.completed && (
        <button
          onClick={() => onMoveToTomorrow(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0"
          title="Auf morgen verschieben"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
