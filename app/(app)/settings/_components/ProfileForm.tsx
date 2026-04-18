'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { AccountProfile, AccountSettingsFormValues } from '../_domain'
import { accountSettingsSchema } from '../_domain'

type ProfileFormProps = {
  profile: AccountProfile
  isSaving: boolean
  onSave: (values: AccountSettingsFormValues) => Promise<void> | void
}

export function ProfileForm({ profile, isSaving, onSave }: ProfileFormProps) {
  const form = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
    },
  })

  useEffect(() => {
    form.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
    })
  }, [form, profile.firstName, profile.lastName, profile.username])

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          await onSave(values)
        })}
      >
        <section className="space-y-4 rounded-xl border p-4">
          <header>
            <h3 className="text-sm font-semibold">Profil</h3>
            <p className="text-xs text-muted-foreground">Podstawowe dane Twojego konta.</p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Jan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwisko</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Kowalski" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa użytkownika</FormLabel>
                <FormControl>
                  <Input placeholder="np. jan.kowalski" autoCapitalize="none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4 rounded-xl border p-4">
          <header>
            <h3 className="text-sm font-semibold">Adres email</h3>
            <p className="text-xs text-muted-foreground">
              Email jest synchronizowany z kontem i nie można go tu edytować.
            </p>
          </header>

          <Input value={profile.email} disabled readOnly />
        </section>

        <Button
          type="submit"
          disabled={!form.formState.isDirty || isSaving}
          className="w-full"
        >
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
    </Form>
  )
}
