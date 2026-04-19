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
     *
     * UWAGA: `/` celowo NIE jest w matcherze — root to publiczny landing page.
     * Obsługa zalogowanego usera na `/` odbywa się w samym page.tsx
     * (server component czyta sesję i pokazuje CTA "Przejdź do panelu").
     */
    '/dashboard/:path*',
    '/calendar/:path*',
    '/invoices/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
}
