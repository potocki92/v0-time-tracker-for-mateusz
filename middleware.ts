import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match tylko routes które potrzebują sesji:
     * - chroniona strefa app
     * - auth flows (redirect po login)
     * - root (redirect / → /dashboard lub /auth/login)
     */
    '/',
    '/dashboard/:path*',
    '/calendar/:path*',
    '/invoices/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
}
