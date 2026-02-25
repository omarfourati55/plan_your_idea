import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const [tasksResult, ideasResult, linksResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('links').select('*').eq('user_id', user.id).order('created_at'),
  ])

  if (tasksResult.error || ideasResult.error || linksResult.error) {
    const err = tasksResult.error ?? ideasResult.error ?? linksResult.error
    console.error('Export GET error:', err)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Exports' }, { status: 500 })
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    tasks: tasksResult.data ?? [],
    ideas: ideasResult.data ?? [],
    links: linksResult.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="dayflow-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
