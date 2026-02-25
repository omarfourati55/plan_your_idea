'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Brain } from 'lucide-react'
import { useTaskStore } from '@/store'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const TIMER_CONFIG: Record<TimerMode, { label: string; minutes: number; accent: string; ring: string }> = {
  work:       { label: 'Fokus',        minutes: 25, accent: 'from-rose-500 to-orange-500',  ring: 'text-rose-500' },
  shortBreak: { label: 'Kurze Pause',  minutes: 5,  accent: 'from-emerald-500 to-teal-500', ring: 'text-emerald-500' },
  longBreak:  { label: 'Lange Pause',  minutes: 15, accent: 'from-sky-500 to-blue-500',     ring: 'text-sky-500' },
}

export default function FocusPage() {
  const { tasks, fetchTasks, toggleTask } = useTaskStore()
  const [mode, setMode]                   = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft]           = useState(TIMER_CONFIG.work.minutes * 60)
  const [running, setRunning]             = useState(false)
  const [cycles, setCycles]               = useState(0)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const intervalRef  = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)

  useEffect(() => { fetchTasks() }, [fetchTasks])

  useEffect(() => {
    setTimeLeft(TIMER_CONFIG[mode].minutes * 60)
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [mode])

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* AudioContext unavailable */ }
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
            const next = cycles + 1
            setCycles(next)
            toast.success(`Pomodoro ${next} geschafft! 🎉`)
            setMode(next % 4 === 0 ? 'longBreak' : 'shortBreak')
          } else {
            toast.success('Pause vorbei – weiter geht\'s!')
            setMode('work')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, cycles, playBeep])

  const minutes  = Math.floor(timeLeft / 60)
  const seconds  = timeLeft % 60
  const total    = TIMER_CONFIG[mode].minutes * 60
  const progress = (total - timeLeft) / total
  const circumference = 2 * Math.PI * 45

  const todayStr    = format(new Date(), 'yyyy-MM-dd')
  const todayTasks  = tasks.filter((t) => t.due_date === todayStr && !t.completed && !t.parent_id)
  const currentTask = tasks.find((t) => t.id === currentTaskId)
  const config      = TIMER_CONFIG[mode]

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Fokus-Modus</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {cycles > 0
            ? `${cycles} Pomodoro${cycles !== 1 ? 's' : ''} heute geschafft 🔥`
            : 'Starte deinen ersten Pomodoro'}
        </p>
      </header>

      {/* Mode selector */}
      <div className="flex rounded-2xl border border-border/60 overflow-hidden mb-8 bg-card">
        {(Object.entries(TIMER_CONFIG) as Array<[TimerMode, typeof TIMER_CONFIG.work]>).map(([m, cfg]) => (
          <button
            key={m}
            onClick={() => !running && setMode(m)}
            disabled={running}
            className={cn(
              'flex-1 py-3 text-xs font-semibold transition-all duration-200',
              mode === m
                ? `bg-gradient-to-r ${cfg.accent} text-white shadow-sm`
                : 'text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40'
            )}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64">
          {/* Glow background */}
          <div className={cn(
            'absolute inset-8 rounded-full blur-2xl opacity-20 transition-opacity duration-1000',
            `bg-gradient-to-br ${config.accent}`,
            running && 'opacity-30'
          )} />

          <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
            {/* Track */}
            <circle cx="50" cy="50" r="45" fill="none"
              stroke="hsl(var(--muted))" strokeWidth="3.5" />
            {/* Progress */}
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={mode === 'work' ? '#f43f5e' : mode === 'shortBreak' ? '#10b981' : '#0ea5e9'} />
                <stop offset="100%" stopColor={mode === 'work' ? '#f97316' : mode === 'shortBreak' ? '#14b8a6' : '#3b82f6'} />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="text-5xl font-bold tabular-nums tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1.5 font-medium">{config.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => { setRunning(false); setTimeLeft(total); if (intervalRef.current) clearInterval(intervalRef.current) }}
            className="p-3 rounded-2xl border border-border/60 hover:bg-muted transition-all bg-card"
            aria-label="Zurücksetzen"
          >
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              'p-5 rounded-2xl text-white shadow-lg transition-all hover:scale-105 active:scale-95',
              `bg-gradient-to-br ${config.accent}`,
              `shadow-[hsl(var(--primary)/0.3)]`
            )}
            aria-label={running ? 'Pausieren' : 'Starten'}
          >
            {running
              ? <Pause className="h-7 w-7" />
              : <Play  className="h-7 w-7 ml-0.5" />
            }
          </button>

          <div className="p-3 rounded-2xl border border-border/60 bg-card">
            {mode === 'work'
              ? <Brain  className="h-5 w-5 text-rose-500" />
              : <Coffee className="h-5 w-5 text-emerald-500" />
            }
          </div>
        </div>
      </div>

      {/* Current task */}
      <div className="mb-6">
        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Aktuelle Aufgabe
        </h2>
        {currentTask ? (
          <div className="p-4 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 flex items-center justify-between gap-3">
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
          <p className="text-sm text-muted-foreground italic">Wähle eine Aufgabe unten aus</p>
        )}
      </div>

      {/* Task list */}
      {todayTasks.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Aufgaben heute · {todayTasks.length}
          </h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setCurrentTaskId(task.id === currentTaskId ? null : task.id)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150',
                  task.id === currentTaskId
                    ? 'border-violet-500/40 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-foreground'
                    : 'border-border/60 bg-card hover:border-violet-500/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
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
