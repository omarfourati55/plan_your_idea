import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // Load idea
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (ideaError || !idea) {
    return NextResponse.json({ error: 'Idee nicht gefunden' }, { status: 404 })
  }

  // Create task from idea
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: idea.title,
      description: idea.content || null,
      priority: 'medium',
      tags: idea.tags,
    })
    .select()
    .single()

  if (taskError) {
    console.error('Convert idea to task error:', taskError)
    return NextResponse.json({ error: 'Fehler beim Konvertieren der Idee' }, { status: 500 })
  }

  return NextResponse.json({ data: task }, { status: 201 })
}
