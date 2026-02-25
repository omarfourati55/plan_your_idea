import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isYesterday, parseISO, startOfDay, endOfDay } from 'date-fns'
import type { Priority, TaskStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Heute'
  if (isTomorrow(d)) return 'Morgen'
  if (isYesterday(d)) return 'Gestern'
  return format(d, 'dd.MM.yyyy')
}

export function formatDateTime(date: string | Date | null, time?: string | null): string {
  if (!date) return ''
  const dateStr = formatDate(date)
  if (!time) return dateStr
  return `${dateStr}, ${time.slice(0, 5)} Uhr`
}

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'low':
      return 'text-blue-500'
    default:
      return 'text-muted-foreground'
  }
}

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'Hoch'
    case 'medium':
      return 'Mittel'
    case 'low':
      return 'Niedrig'
  }
}

export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date()
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function groupTasksByDate(tasks: Array<{ due_date: string | null; [key: string]: unknown }>) {
  const groups: Record<string, typeof tasks> = {
    overdue: [],
    today: [],
    tomorrow: [],
    future: [],
    someday: [],
  }

  const now = new Date()

  for (const task of tasks) {
    if (!task.due_date) {
      groups.someday.push(task)
      continue
    }

    const taskDate = parseISO(task.due_date)
    if (isToday(taskDate)) {
      groups.today.push(task)
    } else if (isTomorrow(taskDate)) {
      groups.tomorrow.push(task)
    } else if (taskDate < startOfDay(now)) {
      groups.overdue.push(task)
    } else {
      groups.future.push(task)
    }
  }

  return groups
}

export function getStatusConfig(status: TaskStatus): {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  pulse: boolean
} {
  switch (status) {
    case 'todo':
      return { label: 'Offen', color: 'text-muted-foreground', bgColor: 'bg-muted/60', borderColor: 'border-border/60', icon: '○', pulse: false }
    case 'in_progress':
      return { label: 'In Arbeit', color: 'text-violet-500', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30', icon: '◉', pulse: true }
    case 'waiting':
      return { label: 'Wartet', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: '⏸', pulse: false }
    case 'done':
      return { label: 'Erledigt', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', icon: '✓', pulse: false }
    case 'cancelled':
      return { label: 'Abgebrochen', color: 'text-rose-500', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', icon: '✗', pulse: false }
  }
}

export function isTaskComplete(status: TaskStatus): boolean {
  return status === 'done' || status === 'cancelled'
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
