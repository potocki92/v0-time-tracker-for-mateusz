import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'
import { BRAND, Logo } from '@/components/brand/logo'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo priority size="lg" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{BRAND.name}</h1>
        </div>

        {/* Success Card */}
        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-4 text-center pb-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl">Sprawdz swoja skrzynke!</CardTitle>
              <CardDescription className="text-base">
                Wyslalismy link potwierdzajacy na Twoj adres email. Kliknij w link aby aktywowac konto.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Nie widzisz emaila?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Sprawdz folder spam</li>
                <li>Upewnij sie ze podales poprawny adres</li>
                <li>Poczekaj kilka minut</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full h-11">
              <Link href="/auth/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrot do logowania
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">
          {BRAND.name} v3.0
        </p>
      </div>
    </div>
  )
}
