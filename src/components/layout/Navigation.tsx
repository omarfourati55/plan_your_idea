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
} from 'lucide-react'

const navItems = [
  { href: '/today', label: 'Heute', icon: CalendarDays },
  { href: '/planner', label: 'Planer', icon: CalendarRange },
  { href: '/focus', label: 'Fokus', icon: Timer },
  { href: '/ideas', label: 'Ideen', icon: Lightbulb },
  { href: '/links', label: 'Links', icon: Link2 },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
]

// Mobile bottom nav only shows 5 items (no focus – accessible via URL)
const mobileNavItems = navItems.filter((i) => i.href !== '/focus')

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 border-r bg-card h-screen sticky top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">DayFlow</h1>
        <p className="text-xs text-muted-foreground mt-1">Dein Tagesplaner</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 flex-1',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
