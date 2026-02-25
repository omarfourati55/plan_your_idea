'use client'

import { useEffect, useRef, useState } from 'react'
import { cn, getStatusConfig } from '@/lib/utils'
import type { TaskStatus } from '@/types'

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done', 'cancelled']

interface StatusBadgeProps {
  status: TaskStatus
  onChange: (status: TaskStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, onChange, disabled, size = 'sm' }: StatusBadgeProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cfg = getStatusConfig(status)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border font-medium transition-all',
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
          cfg.bgColor,
          cfg.borderColor,
          cfg.color,
          !disabled && 'hover:brightness-110 cursor-pointer',
          disabled && 'opacity-50 cursor-default'
        )}
        aria-label={`Status: ${cfg.label}`}
      >
        <span className={cn(
          'text-[10px] leading-none',
          cfg.pulse && 'animate-pulse'
        )}>
          {cfg.icon}
        </span>
        <span>{cfg.label}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[160px] rounded-xl border border-border/80 bg-popover shadow-lg shadow-black/10 overflow-hidden animate-fade-in">
          {ALL_STATUSES.map((s) => {
            const c = getStatusConfig(s)
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(s)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-muted',
                  s === status && 'bg-muted'
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] border flex-shrink-0',
                  c.bgColor, c.borderColor, c.color,
                  c.pulse && 'animate-pulse'
                )}>
                  {c.icon}
                </span>
                <span className={c.color}>{c.label}</span>
                {s === status && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
