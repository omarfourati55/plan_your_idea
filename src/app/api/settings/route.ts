import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Profile not found, return defaults
    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? null,
        dark_mode: 'system',
        ai_enabled: false,
        notifications_enabled: true,
        daily_briefing_time: '08:00',
      }
    })
  }

  if (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
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

  const input = body as Record<string, unknown>
  const allowedFields = ['name', 'dark_mode', 'ai_enabled', 'notifications_enabled', 'daily_briefing_time', 'timezone']
  const update: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (field in input) {
      update[field] = input[field]
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 })
  }

  // Validate dark_mode
  if ('dark_mode' in update && !['light', 'dark', 'system'].includes(update.dark_mode as string)) {
    return NextResponse.json({ error: 'Ungültiger dark_mode Wert' }, { status: 422 })
  }

  // Validate boolean fields
  if ('ai_enabled' in update && typeof update.ai_enabled !== 'boolean') {
    return NextResponse.json({ error: 'ai_enabled muss ein Boolean sein' }, { status: 422 })
  }
  if ('notifications_enabled' in update && typeof update.notifications_enabled !== 'boolean') {
    return NextResponse.json({ error: 'notifications_enabled muss ein Boolean sein' }, { status: 422 })
  }

  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email, ...update })
    .select()
    .single()

  if (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
