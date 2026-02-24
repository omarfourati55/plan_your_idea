'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, CalendarDays, Lightbulb, Link2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ONBOARDING_KEY = 'dayflow_onboarding_done'

const slides = [
  {
    icon: CalendarDays,
    title: 'Dein Tag, strukturiert',
    description:
      'Plane deinen Tag mit der Tagesansicht. Erstelle Aufgaben in Sekunden, setze Prioritäten und behalte den Überblick.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: Lightbulb,
    title: 'Ideen festhalten',
    description:
      'Erfasse Ideen als Notizen, bevor sie verloren gehen. Organisiere sie mit Farben und Tags. Konvertiere sie mit einem Klick in Aufgaben.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
  {
    icon: Link2,
    title: 'Links & Artikel sammeln',
    description:
      'Speichere interessante Links mit Vorschaubild und Beschreibung. Markiere sie als "Später lesen" und behalte deinen Lesestapel im Blick.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
]

export function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) {
      setVisible(true)
    }
  }, [])

  function handleNext() {
    if (step < slides.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleDone()
    }
  }

  function handleDone() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  const current = slides[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
        {/* Skip button */}
        <div className="flex justify-end p-3">
          <button
            onClick={handleDone}
            className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-muted"
            aria-label="Onboarding überspringen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slide content */}
        <div className="px-8 pb-8">
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-6', current.bg)}>
            <Icon className={cn('h-8 w-8', current.color)} />
          </div>

          <h2 className="text-xl font-bold mb-3">{current.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Progress dots + button */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === step ? 'bg-primary w-6' : 'bg-muted-foreground/30'
                )}
                aria-label={`Schritt ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {step < slides.length - 1 ? (
              <>
                Weiter
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              'Los geht\'s!'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
