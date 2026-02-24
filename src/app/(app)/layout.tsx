import { Sidebar, BottomNav } from '@/components/layout/Navigation'
import { QuickCaptureFAB } from '@/components/layout/QuickCaptureFAB'
import { Onboarding } from '@/components/layout/Onboarding'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <QuickCaptureFAB />
      <Onboarding />
    </div>
  )
}
