import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { BRAND, Logo } from '@/components/brand/logo'

export default function AuthErrorPage() {
  return (
    <main
      id="main-content"
      role="alert"
      aria-live="assertive"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4"
    >
      <div className="w-full max-w-md space-y-8">
        <header className="flex flex-col items-center gap-3">
          <Logo priority size="lg" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{BRAND.name}</h1>
        </header>

        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-4 text-center pb-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl leading-none font-semibold">Wystapil blad</h2>
              <CardDescription className="text-base">
                Cos poszlo nie tak podczas uwierzytelniania. Sprobuj ponownie.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11">
              <Link href="/auth/login">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Powrot do logowania
              </Link>
            </Button>
          </CardContent>
        </Card>

        <footer>
          <p className="text-center text-xs text-muted-foreground/60">
            {BRAND.name} v3.0
          </p>
        </footer>
      </div>
    </main>
  )
}
