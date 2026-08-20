/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  eslint: {
    // Lint to osobny krok (npm run lint / CI). Build go nie powtarza.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    // Bez tego Next 15 trzyma segmenty dynamiczne na zerowym stale — te czytające cookies()
    // (czyli caly panel, bo Supabase server client czyta ciasteczka) nie trafiaja
    // do Router Cache w ogole. Efekt: powrot na /dashboard po 3 sekundach to
    // pelny round-trip RSC + skeleton z loading.tsx, mimo ze React Query ma dane.
    //
    // 120 s dobrane pod realny wzorzec uzycia: uzytkownik krazy miedzy sekcjami
    // w obrebie jednej sesji pracy. Swiezosc danych pilnuje React Query
    // (staleTime 2-15 min per profil w lib/query/queryConfig.ts), a hydracja
    // TanStack Query nie nadpisuje danych klienta starszym payloadem —
    // porownuje `dataUpdatedAt`. Stale RSC z Router Cache jest wiec bezpieczne.
    staleTimes: {
      dynamic: 120,
      static: 300,
    },
  },
}

export default nextConfig
