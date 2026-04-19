'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { BRAND, Logo } from '@/components/brand/logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Nieprawidłowy email lub hasło')
        return
      }

      if (!data.session) {
        toast.error('Nie udało się utworzyć sesji. Spróbuj ponownie.')
        return
      }

      toast.success('Zalogowano pomyślnie!')

      // Full page navigation ensures middleware sees fresh auth cookies.
      window.location.assign('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4"
    >
      <div className="w-full max-w-md space-y-8">
        <header className="flex flex-col items-center gap-3">
          <Logo priority size="xl" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{BRAND.name}</h1>
          <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
        </header>

        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-1 pb-4">
            <h2 className="text-xl leading-none font-semibold">Zaloguj się</h2>
            <CardDescription>
              Wprowadź swoje dane aby kontynuować
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleLogin}
              className="space-y-4"
              aria-label="Formularz logowania"
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@przyklad.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logowanie...
                  </>
                ) : (
                  'Zaloguj się'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <nav aria-label="Odnośniki do rejestracji" className="text-center">
          <p className="text-sm text-muted-foreground">
            Nie masz jeszcze konta?{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Zarejestruj się
            </Link>
          </p>
        </nav>

        <footer>
          <p className="text-center text-xs text-muted-foreground/60">
            {BRAND.name} v3.0
          </p>
        </footer>
      </div>
    </main>
  )
}
