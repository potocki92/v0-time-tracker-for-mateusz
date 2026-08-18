'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { avatarFileSchema } from '../domain'

type AvatarUploadProps = {
  avatarUrl: string | null
  fallbackLabel: string
  isUploading: boolean
  onUpload: (file: File) => Promise<void> | void
}

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (!parts[0]) return 'U'

  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function AvatarUpload({
  avatarUrl,
  fallbackLabel,
  isUploading,
  onUpload,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isImageLoading, setIsImageLoading] = useState(Boolean(avatarUrl))

  useEffect(() => {
    setIsImageLoading(Boolean(avatarUrl))
  }, [avatarUrl])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const parsed = avatarFileSchema.safeParse(file)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? 'Nieprawidłowy plik')
    }

    await onUpload(file)
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="relative h-16 w-16">
        {isImageLoading && <Skeleton className="absolute inset-0 h-16 w-16 rounded-full" />}

        <Avatar className="h-16 w-16">
          {avatarUrl && (
            <AvatarImage
              src={avatarUrl}
              alt={fallbackLabel}
              onLoadingStatusChange={(status) => {
                if (status === 'loaded' || status === 'error') {
                  setIsImageLoading(false)
                }
              }}
            />
          )}
          <AvatarFallback>{getInitials(fallbackLabel)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Zdjęcie profilowe</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            void handleFileChange(event).catch((error: unknown) => {
              toast.error(
                error instanceof Error ? error.message : 'Nie udało się wgrać pliku',
              )
            })
          }}
        />

        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wgrywanie...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Zmień avatar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
