'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTaskStore } from '@/store'
import { cn } from '@/lib/utils'

type ViewMode = 'week' | 'month'

export default function PlannerPage() {
  const { tasks, loading, fetchTasks, toggleTask } = useTaskStore()
  const [view, setView] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

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

  // Week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekLabel = `${format(weekDays[0], 'dd. MMM', { locale: de })} – ${format(weekDays[6], 'dd. MMM yyyy', { locale: de })}`

  // Month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: de })

  function navigatePrev() {
    if (view === 'week') setCurrentDate((d) => subWeeks(d, 1))
    else setCurrentDate((d) => subMonths(d, 1))
  }

  function navigateNext() {
    if (view === 'week') setCurrentDate((d) => addWeeks(d, 1))
    else setCurrentDate((d) => addMonths(d, 1))
  }

  const headerLabel = view === 'week' ? weekLabel : monthLabel

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Planer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {view === 'week' ? 'Wochenübersicht' : 'Monatsübersicht'} deiner Aufgaben
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-3 py-2 text-sm font-medium transition',
                view === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              Woche
            </button>
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-3 py-2 text-sm font-medium transition',
                view === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              Monat
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm rounded-lg border hover:bg-muted transition"
          >
            Heute
          </button>
          <button
            onClick={navigatePrev}
            className="p-2 rounded-lg border hover:bg-muted transition"
            aria-label="Zurück"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium min-w-[200px] text-center capitalize">
            {headerLabel}
          </span>
          <button
            onClick={navigateNext}
            className="p-2 rounded-lg border hover:bg-muted transition"
            aria-label="Vor"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : view === 'week' ? (
        <WeekView
          days={weekDays}
          tasksByDate={tasksByDate}
          onToggle={toggleTask}
        />
      ) : (
        <MonthView
          days={calendarDays}
          currentDate={currentDate}
          tasksByDate={tasksByDate}
          onToggle={toggleTask}
        />
      )}
    </div>
  )
}

function WeekView({
  days,
  tasksByDate,
  onToggle,
}: {
  days: Date[]
  tasksByDate: Record<string, ReturnType<typeof useTaskStore.getState>['tasks']>
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayTasks = tasksByDate[dayStr] ?? []
        const isToday = isSameDay(day, new Date())
        return (
          <div
            key={dayStr}
            className={cn(
              'min-h-40 rounded-lg border p-3',
              isToday ? 'border-primary bg-primary/5' : 'bg-card'
            )}
          >
            <div className="mb-2">
              <p className="text-xs text-muted-foreground font-medium">
                {format(day, 'EEE', { locale: de })}
              </p>
              <p className={cn('text-lg font-bold', isToday && 'text-primary')}>
                {format(day, 'dd')}
              </p>
            </div>
            <div className="space-y-1">
              {dayTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => onToggle(task.id)}
                  className={cn(
                    'w-full text-left text-xs px-2 py-1 rounded flex items-center gap-1 hover:bg-accent transition-colors',
                    task.completed && 'opacity-50 line-through'
                  )}
                  title={task.title}
                >
                  <span
                    className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
                      'bg-red-500': task.priority === 'high',
                      'bg-yellow-500': task.priority === 'medium',
                      'bg-blue-500': task.priority === 'low',
                    })}
                  />
                  <span className="truncate">{task.title}</span>
                </button>
              ))}
              {dayTasks.length > 5 && (
                <p className="text-xs text-muted-foreground pl-2">
                  +{dayTasks.length - 5} weitere
                </p>
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
  days,
  currentDate,
  tasksByDate,
  onToggle,
}: {
  days: Date[]
  currentDate: Date
  tasksByDate: Record<string, ReturnType<typeof useTaskStore.getState>['tasks']>
  onToggle: (id: string) => void
}) {
  const today = new Date()

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate[dayStr] ?? []
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const pendingCount = dayTasks.filter((t) => !t.completed).length
          const completedCount = dayTasks.filter((t) => t.completed).length

          return (
            <div
              key={dayStr}
              className={cn(
                'min-h-[90px] rounded-lg border p-2 transition-colors',
                isToday ? 'border-primary bg-primary/5' : 'bg-card',
                !isCurrentMonth && 'opacity-40'
              )}
            >
              <p
                className={cn(
                  'text-sm font-semibold mb-1',
                  isToday && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onToggle(task.id)}
                    className={cn(
                      'w-full text-left text-xs px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-accent transition-colors',
                      task.completed && 'opacity-50 line-through'
                    )}
                    title={task.title}
                  >
                    <span
                      className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
                        'bg-red-500': task.priority === 'high',
                        'bg-yellow-500': task.priority === 'medium',
                        'bg-blue-500': task.priority === 'low',
                      })}
                    />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-1.5">
                    +{dayTasks.length - 3} mehr
                  </p>
                )}
              </div>
              {dayTasks.length > 0 && dayTasks.length <= 3 && (
                <div className="mt-1 flex gap-1">
                  {pendingCount > 0 && (
                    <span className="text-xs text-muted-foreground">{pendingCount} offen</span>
                  )}
                  {completedCount > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {completedCount} ✓
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
