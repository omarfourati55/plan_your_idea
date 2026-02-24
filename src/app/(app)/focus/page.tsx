'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Brain } from 'lucide-react'
import { useTaskStore } from '@/store'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const TIMER_CONFIG: Record<TimerMode, { label: string; minutes: number; color: string }> = {
  work: { label: 'Fokus', minutes: 25, color: 'text-red-500' },
  shortBreak: { label: 'Kurze Pause', minutes: 5, color: 'text-green-500' },
  longBreak: { label: 'Lange Pause', minutes: 15, color: 'text-blue-500' },
}

export default function FocusPage() {
  const { tasks, fetchTasks, toggleTask } = useTaskStore()
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(TIMER_CONFIG.work.minutes * 60)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    setTimeLeft(TIMER_CONFIG[mode].minutes * 60)
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [mode])

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = 880
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {
      // AudioContext might not be available
    }
  }, [])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          playBeep()

          if (mode === 'work') {
            const newCycles = cycles + 1
            setCycles(newCycles)
            toast.success(`Pomodoro ${newCycles} abgeschlossen! Zeit für eine Pause.`)
            setMode(newCycles % 4 === 0 ? 'longBreak' : 'shortBreak')
          } else {
            toast.success('Pause beendet! Weiter geht\'s.')
            setMode('work')
          }

          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, mode, cycles, playBeep])

  function handleStartPause() {
    setRunning((r) => !r)
  }

  function handleReset() {
    setRunning(false)
    setTimeLeft(TIMER_CONFIG[mode].minutes * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const totalSeconds = TIMER_CONFIG[mode].minutes * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = tasks.filter((t) => t.due_date === todayStr && !t.completed && !t.parent_id)
  const currentTask = tasks.find((t) => t.id === currentTaskId)

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Fokus-Modus</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {cycles} Pomodoros heute abgeschlossen
        </p>
      </header>

      {/* Mode selector */}
      <div className="flex rounded-xl border overflow-hidden mb-8">
        {(Object.entries(TIMER_CONFIG) as Array<[TimerMode, typeof TIMER_CONFIG.work]>).map(([m, config]) => (
          <button
            key={m}
            onClick={() => !running && setMode(m)}
            disabled={running}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition',
              mode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted disabled:opacity-50'
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={cn('transition-all duration-1000', TIMER_CONFIG[mode].color)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-muted-foreground mt-1">{TIMER_CONFIG[mode].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleReset}
            className="p-3 rounded-full border hover:bg-muted transition"
            aria-label="Timer zurücksetzen"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleStartPause}
            className="p-5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition shadow-lg"
            aria-label={running ? 'Timer pausieren' : 'Timer starten'}
          >
            {running ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
          </button>
          <div className="p-3 rounded-full border">
            {mode === 'work' ? (
              <Brain className="h-5 w-5 text-red-500" />
            ) : (
              <Coffee className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Current task */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Aktuelle Aufgabe
        </h2>
        {currentTask ? (
          <div className="p-4 rounded-xl border bg-card flex items-center justify-between gap-3">
            <p className="font-medium text-sm">{currentTask.title}</p>
            <button
              onClick={() => toggleTask(currentTask.id)}
              className="text-muted-foreground hover:text-primary transition"
              aria-label="Aufgabe erledigen"
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Aufgabe ausgewählt</p>
        )}
      </div>

      {/* Today task list */}
      {todayTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Aufgaben für heute ({todayTasks.length})
          </h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setCurrentTaskId(task.id === currentTaskId ? null : task.id)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border text-sm transition',
                  task.id === currentTaskId
                    ? 'border-primary bg-primary/5 font-medium'
                    : 'bg-card hover:bg-accent/50'
                )}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
