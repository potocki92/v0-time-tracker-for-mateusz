'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AccountProfile } from '../_domain'
import { accountSettingsSchema, type AccountSettingsFormValues } from '../_domain'

type ProfileFormProps = {
  profile: AccountProfile
  isSaving: boolean
  onSave: (values: AccountSettingsFormValues) => Promise<void> | void
}

export function ProfileForm({ profile, isSaving, onSave }: ProfileFormProps) {
  const initialValues = useMemo(
    () => ({
      fullName: profile.full_name ?? '',
      username: profile.username ?? '',
    }),
    [profile.full_name, profile.username],
  )

  const [form, setForm] = useState<AccountSettingsFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(initialValues)
  }, [initialValues])

  const isDirty =
    form.fullName !== initialValues.fullName || form.username !== initialValues.username

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = accountSettingsSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formularz zawiera błędy')
      return
    }

    setError(null)
    await onSave(parsed.data)
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <section className="space-y-4 rounded-xl border p-4">
        <header>
          <h3 className="text-sm font-semibold">Profil</h3>
          <p className="text-xs text-muted-foreground">Podstawowe dane Twojego konta.</p>
        </header>

        <div className="space-y-2">
          <Label htmlFor="fullName">Imię i nazwisko</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            placeholder="np. Jan Kowalski"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Nazwa użytkownika</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
            placeholder="np. jan.kowalski"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-4">
        <header>
          <h3 className="text-sm font-semibold">Bezpieczeństwo konta</h3>
          <p className="text-xs text-muted-foreground">Aktualny adres email.</p>
        </header>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{profile.email ?? 'Brak adresu email'}</span>
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!isDirty || isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zapisywanie...
          </>
        ) : (
          'Zapisz zmiany'
        )}
      </Button>
    </form>
  )
}
