export type AccountProfile = {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
  avatar_url: string | null
}

export type AccountSettingsFormValues = {
  fullName: string
  username: string
}
