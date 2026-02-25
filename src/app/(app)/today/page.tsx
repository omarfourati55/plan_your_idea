'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Plus, CheckCircle2, Circle, ChevronRight, ChevronDown,
  Clock, Tag, GripVertical, SlidersHorizontal, RefreshCw, Trash2, Pencil,
} from 'lucide-react'
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
import { cn, getPriorityColor, getPriorityLabel, isTaskComplete } from '@/lib/utils'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer'
import type { Task, TaskStatus } from '@/types'
import toast from 'react-hot-toast'

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-rose-500',
  medium: 'bg-amber-400',
  low:    'bg-sky-400',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default function TodayPage() {
  const { tasks, loading, error, fetchTasks, createTask, updateTask, toggleTask, deleteTask, moveTaskToDate } = useTaskStore()
  const [newTaskTitle, setNewTaskTitle]   = useState('')
  const [creating, setCreating]           = useState(false)
  const [localOrder, setLocalOrder]       = useState<string[]>([])
  const [showOptions, setShowOptions]     = useState(false)
  const [taskPriority, setTaskPriority]   = useState<'high' | 'medium' | 'low'>('medium')
  const [taskTime, setTaskTime]           = useState('')
  const [taskRecurring, setTaskRecurring] = useState<'daily' | 'weekly' | 'custom' | ''>('')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [editingTask, setEditingTask]     = useState<Task | null>(null)

  const today    = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const todayTasks = tasks.filter((t) => t.due_date === todayStr && !t.parent_id)
  // Use status to determine "done" vs "open"; fall back to completed for tasks without status
  const completedTasks = todayTasks.filter((t) => isTaskComplete(t.status ?? (t.completed ? 'done' : 'todo')))
  const rawPending     = todayTasks.filter((t) => !isTaskComplete(t.status ?? (t.completed ? 'done' : 'todo')))

  useEffect(() => {
    const ids = rawPending.map((t) => t.id)
    setLocalOrder((prev) => {
      const prevSet  = new Set(prev)
      const newIds   = ids.filter((id) => !prevSet.has(id))
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

  function toggleExpanded(id: string) {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

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

  async function handleMoveToTomorrow(id: string) {
    const tomorrow = format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')
    await moveTaskToDate(id, tomorrow)
    toast.success('Auf morgen verschoben')
  }

  async function handleDelete(id: string) {
    await deleteTask(id)
    toast.success('Aufgabe gelöscht')
  }

  async function handleCreateSubtask(parentId: string, title: string, dueDate: string | null) {
    if (!title.trim()) return
    await createTask({ title: title.trim(), parent_id: parentId, due_date: dueDate ?? undefined, priority: 'medium' })
  }

  async function handleStatusChange(id: string, newStatus: TaskStatus) {
    await updateTask(id, {
      status: newStatus,
      completed: isTaskComplete(newStatus),
    })
  }

  async function handleDrawerSave(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'due_date' | 'due_time' | 'tags'>>
  ) {
    await updateTask(id, {
      ...updates,
      completed: updates.status ? isTaskComplete(updates.status) : undefined,
    })
    toast.success('Gespeichert')
  }

  async function handleDrawerDelete(id: string) {
    await handleDelete(id)
  }

  const progress = todayTasks.length > 0
    ? Math.round((completedTasks.length / todayTasks.length) * 100)
    : 0

  const editingSubtasks = editingTask
    ? tasks.filter((t) => t.parent_id === editingTask.id)
    : []

  return (
    <>
      <div className="max-w-2xl mx-auto p-4 md:p-8 animate-fade-in">
        {/* Header */}
        <header className="mb-8">
          <p className="text-sm text-muted-foreground font-medium">
            {format(today, 'EEEE, dd. MMMM yyyy', { locale: de })}
          </p>
          <h1 className="text-3xl font-bold mt-1">{getGreeting()} 👋</h1>

          {todayTasks.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">
                  {completedTasks.length} von {todayTasks.length} erledigt
                </span>
                <span className="text-xs font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Quick Add */}
        <form onSubmit={handleQuickCreate} className="mb-8">
          <div className="flex gap-2">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="+ Neue Aufgabe für heute..."
              className="flex-1 bg-card border border-border/60 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              disabled={creating}
              maxLength={500}
            />
            <button
              type="button"
              onClick={() => setShowOptions((v) => !v)}
              className={cn(
                'rounded-xl px-3 transition-all border',
                showOptions
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-violet-500/25'
                  : 'hover:bg-muted border-border/60 text-muted-foreground'
              )}
              aria-label="Optionen"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || creating}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl px-4 py-3 hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all shadow-md shadow-violet-500/25 disabled:shadow-none"
              aria-label="Aufgabe hinzufügen"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showOptions && (
            <div className="mt-2 p-3 rounded-xl border border-border/60 bg-card flex flex-wrap gap-3 items-center animate-fade-in">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">Priorität</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="text-xs bg-muted border-0 rounded-lg px-2 py-1.5 outline-none focus:ring-2 ring-primary/20"
                >
                  <option value="high">🔴 Hoch</option>
                  <option value="medium">🟡 Mittel</option>
                  <option value="low">🔵 Niedrig</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <label className="text-xs font-medium text-muted-foreground">Uhrzeit</label>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="text-xs bg-muted border-0 rounded-lg px-2 py-1.5 outline-none focus:ring-2 ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
                <select
                  value={taskRecurring}
                  onChange={(e) => setTaskRecurring(e.target.value as 'daily' | 'weekly' | 'custom' | '')}
                  className="text-xs bg-muted border-0 rounded-lg px-2 py-1.5 outline-none focus:ring-2 ring-primary/20"
                >
                  <option value="">Keine Wiederholung</option>
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] rounded-xl skeleton" />
            ))}
          </div>
        )}

        {/* Pending Tasks */}
        {!loading && pendingTasks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Offen · {pendingTasks.length}
            </h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onToggle={(id) => toggleTask(id)}
                      onMoveToTomorrow={handleMoveToTomorrow}
                      onDelete={handleDelete}
                      expanded={expandedTasks.has(task.id)}
                      onToggleExpand={toggleExpanded}
                      subtasks={tasks.filter((t) => t.parent_id === task.id)}
                      onCreateSubtask={handleCreateSubtask}
                      onEdit={(t) => setEditingTask(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        )}

        {/* Empty state */}
        {!loading && todayTasks.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-violet-400 opacity-70" />
            </div>
            <p className="font-semibold text-lg">Keine Aufgaben heute</p>
            <p className="text-sm text-muted-foreground mt-1">Trage deine erste Aufgabe oben ein</p>
          </div>
        )}

        {/* Completed Tasks */}
        {!loading && completedTasks.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Abgeschlossen · {completedTasks.length}
            </h2>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={(id) => toggleTask(id)}
                  onMoveToTomorrow={handleMoveToTomorrow}
                  onDelete={handleDelete}
                  expanded={expandedTasks.has(task.id)}
                  onToggleExpand={toggleExpanded}
                  subtasks={tasks.filter((t) => t.parent_id === task.id)}
                  onCreateSubtask={handleCreateSubtask}
                  onEdit={(t) => setEditingTask(t)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Task Edit Drawer */}
      <TaskEditDrawer
        task={editingTask}
        subtasks={editingSubtasks}
        onClose={() => setEditingTask(null)}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
        onToggleSubtask={(id) => toggleTask(id)}
        onAddSubtask={handleCreateSubtask}
      />
    </>
  )
}

// ─── Shared card props ───────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onMoveToTomorrow: (id: string) => void
  onDelete: (id: string) => void
  expanded: boolean
  onToggleExpand: (id: string) => void
  subtasks: Task[]
  onCreateSubtask: (parentId: string, title: string, dueDate: string | null) => Promise<void>
  onEdit: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  dragHandle?: React.ReactNode
}

function TaskCardBody({
  task, onToggle, onMoveToTomorrow, onDelete,
  expanded, onToggleExpand, subtasks, onCreateSubtask, onEdit, onStatusChange, dragHandle,
}: TaskCardProps) {
  const [subtaskInput, setSubtaskInput]   = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)

  const currentStatus: TaskStatus = task.status ?? (task.completed ? 'done' : 'todo')
  const taskIsDone = isTaskComplete(currentStatus)

  async function handleSubtaskSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = subtaskInput.trim()
    if (!title || addingSubtask) return
    setAddingSubtask(true)
    try {
      await onCreateSubtask(task.id, title, task.due_date)
      setSubtaskInput('')
    } finally {
      setAddingSubtask(false)
    }
  }

  return (
    <div className={cn(
      'rounded-xl border border-border/60 bg-card transition-all duration-200 group',
      taskIsDone ? 'opacity-55' : 'hover:shadow-card hover:border-violet-500/25',
      currentStatus === 'in_progress' && !taskIsDone && 'border-violet-500/30 bg-violet-500/[0.02]',
      currentStatus === 'waiting' && 'border-amber-500/30',
    )}>
      <div className="flex items-start gap-3 p-4">
        {dragHandle}

        {/* Priority dot */}
        <span className={cn(
          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
          PRIORITY_DOT[task.priority] ?? 'bg-muted-foreground/40'
        )} />

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
          aria-label={taskIsDone ? 'Wieder öffnen' : 'Als erledigt markieren'}
        >
          {taskIsDone
            ? <CheckCircle2 className="h-5 w-5 text-primary" />
            : <Circle className="h-5 w-5" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onToggleExpand(task.id)}
            className="w-full text-left flex items-center gap-1"
          >
            <p className={cn(
              'text-sm font-medium flex-1 leading-snug',
              taskIsDone && 'line-through text-muted-foreground',
              currentStatus === 'cancelled' && 'text-muted-foreground'
            )}>
              {task.title}
            </p>
            <ChevronDown className={cn(
              'h-3 w-3 text-muted-foreground/40 transition-transform flex-shrink-0',
              expanded && 'rotate-180'
            )} />
          </button>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Status Badge */}
            <StatusBadge
              status={currentStatus}
              onChange={(s) => onStatusChange(task.id, s)}
            />

            {task.due_time && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />{task.due_time.slice(0, 5)} Uhr
              </span>
            )}
            <span className={cn('text-[11px] font-semibold', getPriorityColor(task.priority))}>
              {getPriorityLabel(task.priority)}
            </span>
            {task.tags.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Tag className="h-3 w-3" />{task.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Bearbeiten"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!taskIsDone && (
            <button
              onClick={() => onMoveToTomorrow(task.id)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Auf morgen verschieben"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
            title="Löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3 animate-fade-in">
          {task.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {task.description}
            </p>
          )}
          {subtasks.length > 0 && (
            <ul className="space-y-1.5">
              {subtasks.map((sub) => (
                <li key={sub.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => onToggle(sub.id)}
                    className="rounded accent-primary"
                    aria-label={sub.title}
                  />
                  <span className={cn(sub.completed && 'line-through text-muted-foreground')}>
                    {sub.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleSubtaskSubmit} className="flex gap-2">
            <input
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              placeholder="+ Teilaufgabe..."
              className="flex-1 text-xs bg-muted/60 border border-border/40 rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-primary/20"
              disabled={addingSubtask}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!subtaskInput.trim() || addingSubtask}
              className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-xs hover:brightness-110 disabled:opacity-50 transition"
              aria-label="Teilaufgabe hinzufügen"
            >
              <Plus className="h-3 w-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function SortableTaskItem(props: Omit<TaskCardProps, 'dragHandle'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex:  isDragging ? 10 : undefined,
  }

  const dragHandle = (
    <button
      {...attributes}
      {...listeners}
      className="mt-1.5 flex-shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors touch-none"
      aria-label="Ziehen"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardBody {...props} dragHandle={dragHandle} />
    </div>
  )
}

function TaskItem(props: Omit<TaskCardProps, 'dragHandle'>) {
  return <TaskCardBody {...props} />
}
