import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCreateLink } from '@/lib/validators/ideas-links'
import { fetchOpenGraph } from '@/lib/utils/og'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const tag = searchParams.get('tag')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '50', 10), 100)

  let query = supabase
    .from('links')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,url.ilike.%${search}%`)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Links GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Links' }, { status: 500 })
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

  const validation = validateCreateLink(body)
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  // Fetch Open Graph data
  const ogData = await fetchOpenGraph(validation.data.url)

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: user.id,
      url: validation.data.url,
      title: ogData.title,
      description: ogData.description,
      image: ogData.image,
      favicon: ogData.favicon,
      tags: validation.data.tags ?? [],
    })
    .select()
    .single()

  if (error) {
    console.error('Links POST error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Links' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
