'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCloseModal, useModalState } from '@/hooks/stores/useUiStore'
import {
  useAccountProfile,
  useUpdateAccountProfile,
  useUploadAvatar,
} from '../_hooks'
import { AvatarUpload } from './AvatarUpload'
import { ProfileForm } from './ProfileForm'

export function SettingsDrawer() {
  const modal = useModalState('settings')
  const closeModal = useCloseModal()

  const profileQuery = useAccountProfile()
  const updateProfile = useUpdateAccountProfile()
  const uploadAvatar = useUploadAvatar()

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
          {profileQuery.isLoading && (
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              Ładowanie ustawień...
            </div>
          )}

          {profileQuery.isError && (
            <div className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
              Nie udało się pobrać danych konta.
            </div>
          )}

          {profile && (
            <>
              <AvatarUpload
                avatarUrl={profile.avatar_url}
                fallbackLabel={profile.full_name ?? profile.email ?? 'Użytkownik'}
                isUploading={uploadAvatar.isPending}
                onUpload={async (file) => {
                  await uploadAvatar.mutateAsync(file)
                }}
              />

              <ProfileForm
                profile={profile}
                isSaving={updateProfile.isPending}
                onSave={async (values) => {
                  await updateProfile.mutateAsync(values)
                }}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
