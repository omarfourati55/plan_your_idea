'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  CalendarRange,
  Lightbulb,
  Link2,
  Settings,
  Timer,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { href: '/today',    label: 'Heute',        icon: CalendarDays },
  { href: '/planner',  label: 'Planer',        icon: CalendarRange },
  { href: '/focus',    label: 'Fokus',         icon: Timer },
  { href: '/ideas',    label: 'Ideen',         icon: Lightbulb },
  { href: '/links',    label: 'Links',         icon: Link2 },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
]

const mobileNavItems = navItems.filter((i) => i.href !== '/focus')

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border/60 bg-card/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">DayFlow</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Dein Tagesplaner</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-2 h-px bg-border/60" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/60">
        <p className="text-[10px] text-muted-foreground text-center">
          v1.0 · DSGVO-konform · EU-Server
        </p>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/90 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 px-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 flex-1 py-1"
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30'
                  : 'text-muted-foreground'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[9px] font-semibold tracking-wide transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
