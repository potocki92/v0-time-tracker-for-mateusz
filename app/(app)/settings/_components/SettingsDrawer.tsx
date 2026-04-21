'use client'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCloseModal, useModalState } from '@/hooks/stores/useUiStore'
import { useProfile, useUpdateAvatar, useUpdateInvoiceAutomationSettings, useUpdateProfile } from '../_hooks'
import { AppearanceSettings } from './AppearanceSettings'
import { AvatarUpload } from './AvatarUpload'
import { InvoiceAutomationSettings } from './InvoiceAutomationSettings'
import { ProfileForm } from './ProfileForm'

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function SettingsDrawer() {
  const modal = useModalState('settings')
  const closeModal = useCloseModal()

  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()
  const updateAvatar = useUpdateAvatar()
  const updateInvoiceSettings = useUpdateInvoiceAutomationSettings()

  const profile = profileQuery.data

  return (
    <Sheet open={modal.open} onOpenChange={(open) => !open && closeModal('settings')}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Ustawienia konta</SheetTitle>
          <SheetDescription>
            Zarządzaj profilem, avatarem i podstawowymi informacjami konta.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {profileQuery.isLoading && <SettingsSkeleton />}

          {profileQuery.isError && (
            <div className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
              {profileQuery.error instanceof Error
                ? profileQuery.error.message
                : 'Nie udało się pobrać danych konta.'}
            </div>
          )}

          {profile && (
            <>
              <AvatarUpload
                avatarUrl={profile.avatarUrl}
                fallbackLabel={`${profile.firstName} ${profile.lastName}`.trim() || profile.email}
                isUploading={updateAvatar.isPending}
                onUpload={async (file) => {
                  await updateAvatar.mutateAsync(file)
                }}
              />

              <ProfileForm
                profile={profile}
                isSaving={updateProfile.isPending}
                onSave={async (values) => {
                  await updateProfile.mutateAsync(values)
                }}
              />

              <AppearanceSettings />

              <InvoiceAutomationSettings
                settings={profile.invoiceSettings}
                clients={profile.invoiceAutomationClients}
                isSaving={updateInvoiceSettings.isPending}
                onSave={async (values) => {
                  await updateInvoiceSettings.mutateAsync(values)
                }}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
