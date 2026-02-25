'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  format, addDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, addWeeks, subWeeks,
  addMonths, subMonths, isSameDay, isSameMonth,
  eachDayOfInterval,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react'
import { useTaskStore } from '@/store'
import { cn, getStatusConfig, isTaskComplete } from '@/lib/utils'
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer'
import type { Task, TaskStatus } from '@/types'
import toast from 'react-hot-toast'

type ViewMode = 'week' | 'month'


export default function PlannerPage() {
  const { tasks, loading, fetchTasks, toggleTask, updateTask, deleteTask, createTask } = useTaskStore()
  const [view, setView]               = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => { fetchTasks() }, [fetchTasks])

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
    await deleteTask(id)
    toast.success('Aufgabe gelöscht')
  }

  async function handleAddSubtask(parentId: string, title: string, dueDate: string | null) {
    await createTask({ title, parent_id: parentId, due_date: dueDate ?? undefined, priority: 'medium' })
  }

  const editingSubtasks = editingTask
    ? tasks.filter((t) => t.parent_id === editingTask.id)
    : []

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {}
    for (const task of tasks) {
      if (task.due_date) {
        if (!map[task.due_date]) map[task.due_date] = []
        map[task.due_date].push(task)
      }
    }
    return map
  }, [tasks])

  const weekStart  = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekLabel  = `${format(weekDays[0], 'dd. MMM', { locale: de })} – ${format(weekDays[6], 'dd. MMM yyyy', { locale: de })}`
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: de })
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
  })

  function navigatePrev() {
    setCurrentDate((d) => view === 'week' ? subWeeks(d, 1) : subMonths(d, 1))
  }
  function navigateNext() {
    setCurrentDate((d) => view === 'week' ? addWeeks(d, 1) : addMonths(d, 1))
  }

  return (
    <>
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Planer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {view === 'week' ? 'Wochenübersicht' : 'Monatsübersicht'} deiner Aufgaben
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-xl border border-border/60 overflow-hidden bg-card">
            {(['week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3.5 py-2 text-xs font-semibold transition-all',
                  view === v
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {v === 'week' ? 'Woche' : 'Monat'}
              </button>
            ))}
          </div>

          {/* Today */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border/60 hover:bg-muted transition bg-card"
          >
            Heute
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={navigatePrev} className="p-2 rounded-xl border border-border/60 hover:bg-muted transition bg-card" aria-label="Zurück">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[180px] text-center capitalize px-2">
              {view === 'week' ? weekLabel : monthLabel}
            </span>
            <button onClick={navigateNext} className="p-2 rounded-xl border border-border/60 hover:bg-muted transition bg-card" aria-label="Vor">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl skeleton" />
          ))}
        </div>
      ) : view === 'week' ? (
        <WeekView days={weekDays} tasksByDate={tasksByDate} onToggle={toggleTask} onEdit={setEditingTask} />
      ) : (
        <MonthView days={calendarDays} currentDate={currentDate} tasksByDate={tasksByDate} onToggle={toggleTask} onEdit={setEditingTask} />
      )}

      {!loading && Object.keys(tasksByDate).length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <CalendarRange className="h-10 w-10 text-violet-400 opacity-70" />
          </div>
          <p className="font-semibold text-lg">Noch keine Aufgaben geplant</p>
          <p className="text-sm text-muted-foreground mt-1">Erstelle Aufgaben in der Tagesansicht</p>
        </div>
      )}
    </div>

    <TaskEditDrawer
      task={editingTask}
      subtasks={editingSubtasks}
      onClose={() => setEditingTask(null)}
      onSave={handleDrawerSave}
      onDelete={handleDrawerDelete}
      onToggleSubtask={(id) => toggleTask(id)}
      onAddSubtask={handleAddSubtask}
    />
    </>
  )
}

function WeekView({
  days, tasksByDate, onToggle, onEdit,
}: {
  days: Date[]
  tasksByDate: Record<string, ReturnType<typeof useTaskStore.getState>['tasks']>
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayStr   = format(day, 'yyyy-MM-dd')
        const dayTasks = tasksByDate[dayStr] ?? []
        const isToday  = isSameDay(day, new Date())
        return (
          <div
            key={dayStr}
            className={cn(
              'min-h-40 rounded-xl border p-3 transition-all',
              isToday
                ? 'border-violet-500/40 bg-gradient-to-b from-violet-500/5 to-fuchsia-500/5'
                : 'border-border/60 bg-card hover:border-border'
            )}
          >
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                {format(day, 'EEE', { locale: de })}
              </p>
              <p className={cn(
                'text-xl font-bold mt-0.5',
                isToday && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent'
              )}>
                {format(day, 'dd')}
              </p>
            </div>
            <div className="space-y-1">
              {dayTasks.slice(0, 5).map((task) => {
                const status = task.status ?? (task.completed ? 'done' : 'todo')
                const cfg = getStatusConfig(status as TaskStatus)
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'w-full text-left text-[11px] px-2 py-1 rounded-lg flex items-center gap-1.5 group/task',
                      isTaskComplete(status as TaskStatus) && 'opacity-40 line-through'
                    )}
                    title={task.title}
                  >
                    <button
                      onClick={() => onToggle(task.id)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-70 transition-opacity"
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 border', cfg.bgColor, cfg.borderColor)} />
                      <span className="truncate">{task.title}</span>
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="opacity-0 group-hover/task:opacity-100 flex-shrink-0 p-0.5 rounded hover:bg-muted transition-all"
                      title="Bearbeiten"
                    >
                      <svg className="h-2.5 w-2.5 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
                      </svg>
                    </button>
                  </div>
                )
              })}
              {dayTasks.length > 5 && (
                <p className="text-[10px] text-muted-foreground pl-2">+{dayTasks.length - 5} mehr</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function MonthView({
  days, currentDate, tasksByDate, onToggle, onEdit,
}: {
  days: Date[]
  currentDate: Date
  tasksByDate: Record<string, ReturnType<typeof useTaskStore.getState>['tasks']>
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
}) {
  const today = new Date()
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} className="text-center text-[11px] font-semibold text-muted-foreground py-2">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayStr        = format(day, 'yyyy-MM-dd')
          const dayTasks      = tasksByDate[dayStr] ?? []
          const isToday       = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const pendingCount  = dayTasks.filter((t) => !t.completed).length

          return (
            <div
              key={dayStr}
              className={cn(
                'min-h-[90px] rounded-xl border p-2 transition-all',
                isToday
                  ? 'border-violet-500/40 bg-gradient-to-b from-violet-500/5 to-fuchsia-500/5'
                  : 'border-border/60 bg-card',
                !isCurrentMonth && 'opacity-35'
              )}
            >
              <p className={cn(
                'text-sm font-bold mb-1.5',
                isToday && 'bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent'
              )}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const status = task.status ?? (task.completed ? 'done' : 'todo')
                  const cfg = getStatusConfig(status as TaskStatus)
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-lg flex items-center gap-1 group/mtask',
                        isTaskComplete(status as TaskStatus) && 'opacity-40 line-through'
                      )}
                      title={task.title}
                    >
                      <button
                        onClick={() => onToggle(task.id)}
                        className="flex items-center gap-1 flex-1 min-w-0 hover:bg-accent transition-colors rounded px-0.5"
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 border', cfg.bgColor, cfg.borderColor)} />
                        <span className="truncate">{task.title}</span>
                      </button>
                      <button
                        onClick={() => onEdit(task)}
                        className="opacity-0 group-hover/mtask:opacity-100 flex-shrink-0 p-0.5 rounded hover:bg-muted transition-all"
                        title="Bearbeiten"
                      >
                        <svg className="h-2 w-2 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1.5">+{dayTasks.length - 3} mehr</p>
                )}
              </div>
              {pendingCount > 0 && dayTasks.length <= 3 && (
                <div className="mt-1.5 flex gap-1">
                  <span className="text-[9px] text-muted-foreground">{pendingCount} offen</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
