import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ThemeProvider } from '@/components/theme-provider'
import { ColorThemeProvider } from '@/components/color-theme-provider'
import { ColorThemeInitScript } from '@/components/color-theme-init-script'
import { Toaster } from '@/components/ui/sonner'
import { GlobalJsonLd } from '@/components/seo/json-ld'
import { APP_LOCALES, type AppLocale } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { buildLocalizedMetadata } from '@/lib/seo/metadata'
import { SITE } from '@/lib/seo/site'
import '../globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
})

/**
 * Statyczny prerender wszystkich jezykow. Bez tego kazda wersja landingu
 * renderowalaby sie dynamicznie i stracilibysmy cel architektoniczny strony
 * marketingowej: statyczna i szybka.
 */
export function generateStaticParams() {
  return APP_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  return {
    ...(await buildLocalizedMetadata({ locale, path: '/' })),
    generator: 'Next.js',
    manifest: '/manifest.webmanifest',
    other: {
      'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SITE.themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: SITE.themeColor.dark },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Wlacza statyczne renderowanie tego poddrzewa dla danego jezyka.
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'navigation' })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ColorThemeInitScript />
        <GlobalJsonLd locale={locale as AppLocale} />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {t('skipToMain')}
        </a>
        {/* Root NIE montuje `NextIntlClientProvider`. Skip link renderuje sie
            serwerowo, a slownik dla przegladarki dobiera KAZDA grupa tras
            osobno — landing nie pobiera kluczy faktur, panel nie pobiera
            kluczy marketingowych, a strony auth ani jednych, ani drugich. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            {children}
            <Toaster richColors position="top-center" />
          </ColorThemeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
