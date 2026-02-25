'use client'

import { useState } from 'react'
import { ChevronRight, CalendarDays, Lightbulb, Link2, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const ONBOARDING_KEY = 'dayflow_onboarding_done'

const slides = [
  {
    icon: CalendarDays,
    title: 'Dein Tag, strukturiert',
    description: 'Plane deinen Tag mit der Tagesansicht. Erstelle Aufgaben in Sekunden, setze Prioritäten und behalte den Überblick.',
    gradient: 'from-violet-500 to-fuchsia-500',
    bg: 'from-violet-500/10 to-fuchsia-500/10',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-500',
  },
  {
    icon: Lightbulb,
    title: 'Ideen sofort festhalten',
    description: 'Erfasse Ideen als Notizen, bevor sie verloren gehen. Organisiere sie mit Farben und konvertiere sie mit einem Klick in Aufgaben.',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-500/10 to-orange-500/10',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: Link2,
    title: 'Links clever sammeln',
    description: 'Speichere Links mit Vorschaubild. Markiere sie als "Später lesen" und behalte deinen Lesestapel im Blick.',
    gradient: 'from-sky-500 to-blue-500',
    bg: 'from-sky-500/10 to-blue-500/10',
    border: 'border-sky-500/20',
    iconColor: 'text-sky-500',
  },
]

export function Onboarding() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(ONBOARDING_KEY)
  })
  const [step, setStep] = useState(0)

  function handleNext() {
    if (step < slides.length - 1) setStep((s) => s + 1)
    else handleDone()
  }

  function handleDone() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  const current = slides[step]
  const Icon    = current.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="bg-card rounded-3xl border border-border/60 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">

        {/* Gradient top bar */}
        <div className={cn('h-1 bg-gradient-to-r', current.gradient)} />

        {/* Skip */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">DayFlow</span>
          </div>
          <button
            onClick={handleDone}
            className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-xl hover:bg-muted"
            aria-label="Onboarding überspringen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pt-6 pb-6">
          <div className={cn(
            'w-16 h-16 rounded-3xl bg-gradient-to-br border flex items-center justify-center mb-6',
            current.bg, current.border
          )}>
            <Icon className={cn('h-8 w-8', current.iconColor)} />
          </div>
          <h2 className="text-xl font-bold mb-3 leading-tight">{current.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Progress + button */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step
                    ? `w-6 bg-gradient-to-r ${current.gradient}`
                    : 'w-1.5 bg-muted-foreground/20'
                )}
                aria-label={`Schritt ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className={cn(
              'flex items-center gap-2 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg transition-all hover:brightness-110 active:scale-95',
              `bg-gradient-to-r ${current.gradient}`
            )}
          >
            {step < slides.length - 1 ? (
              <><span>Weiter</span><ChevronRight className="h-4 w-4" /></>
            ) : (
              <span>Los geht&apos;s!</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
