import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">WorkFlow Pro</h1>
        </div>

        {/* Error Card */}
        <Card className="border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="space-y-4 text-center pb-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl">Wystapil blad</CardTitle>
              <CardDescription className="text-base">
                Cos poszlo nie tak podczas uwierzytelniania. Sprobuj ponownie.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11">
              <Link href="/auth/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrot do logowania
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60">
          WorkFlow Pro v3.0
        </p>
      </div>
    </div>
  )
}
