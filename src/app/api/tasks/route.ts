import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCreateTask } from '@/lib/validators/tasks'
import { checkRateLimit, getRateLimitKey } from '@/lib/utils/rate-limit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const completed = searchParams.get('completed')
  const priority = searchParams.get('priority')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '50', 10), 100)

  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .is('parent_id', null)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (date) {
    query = query.eq('due_date', date)
  }

  if (completed !== null) {
    query = query.eq('completed', completed === 'true')
  }

  if (priority) {
    query = query.eq('priority', priority)
  }

  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Aufgaben' }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    hasMore: (count ?? 0) > offset + pageSize,
  })
}

export async function POST(request: NextRequest) {
  const { allowed, remaining } = checkRateLimit(getRateLimitKey(request))
  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warte eine Minute.' },
      { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } }
    )
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const validation = validateCreateTask(body)
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      ...validation.data!,
    })
    .select()
    .single()

  if (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
