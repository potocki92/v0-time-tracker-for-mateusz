'use client'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { WorkAutomationSection } from '@/features/work-automation'
import { useCloseModal, useModalState } from '@/hooks/stores/useUiStore'
import {
  useProfile,
  useSendWeeklySummaryEmail,
  useUpdateAvatar,
  useUpdateInvoiceAutomationSettings,
  useUpdateProfile,
  useUpdateWeeklySummaryEmail,
  useWeeklySummaryEmail,
} from '../hooks'
import { AppearanceSettings } from './AppearanceSettings'
import { LanguageSettings } from './LanguageSettings'
import { AvatarUpload } from './AvatarUpload'
import { InvoiceAutomationSettings } from './InvoiceAutomationSettings'
import { ProfileForm } from './ProfileForm'
import { WeeklySummaryEmailSettings } from './WeeklySummaryEmailSettings'

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
  const t = useTranslations('settings')
  const modal = useModalState('settings')
  const closeModal = useCloseModal()

  const profileQuery = useProfile()
  const updateProfile = useUpdateProfile()
  const updateAvatar = useUpdateAvatar()
  const updateInvoiceSettings = useUpdateInvoiceAutomationSettings()
  const weeklySummaryQuery = useWeeklySummaryEmail()
  const updateWeeklySummary = useUpdateWeeklySummaryEmail()
  const sendWeeklySummary = useSendWeeklySummaryEmail()

  const profile = profileQuery.data
  const weeklySummary = weeklySummaryQuery.data

  return (
    <Sheet open={modal.open} onOpenChange={(open) => !open && closeModal('settings')}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {profileQuery.isLoading && <SettingsSkeleton />}

          {profileQuery.isError && (
            <div className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
              {profileQuery.error instanceof Error
                ? profileQuery.error.message
                : t('loadFailed')}
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

              <LanguageSettings />

              <AppearanceSettings />

              <InvoiceAutomationSettings
                settings={profile.invoiceSettings}
                isSaving={updateInvoiceSettings.isPending}
                onSave={async (values) => {
                  await updateInvoiceSettings.mutateAsync(values)
                }}
              />
            </>
          )}

          <WorkAutomationSection />

          {weeklySummary && (
            <WeeklySummaryEmailSettings
              settings={weeklySummary}
              isSaving={updateWeeklySummary.isPending}
              isSending={sendWeeklySummary.isPending}
              onSave={async (values) => {
                await updateWeeklySummary.mutateAsync(values)
              }}
              onSendNow={() => sendWeeklySummary.mutate()}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
