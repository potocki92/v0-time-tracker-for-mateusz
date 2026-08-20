import { NextResponse } from 'next/server'
import { getProjectsDataServer } from '@/features/projects/server'

/**
 * Sciezka odczytu projektow dla React Query — patrz `app/api/dashboard/route.ts`.
 * Server Action doklejala do kazdego odczytu re-render RSC calej trasy;
 * GET route handler zwraca same dane.
 */
export async function GET() {
  try {
    const data = await getProjectsDataServer()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not authenticated') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
