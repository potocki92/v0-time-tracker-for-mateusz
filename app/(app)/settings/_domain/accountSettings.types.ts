export type AccountProfile = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatarPath: string | null
  avatarUrl: string | null
}

export type AccountSettingsFormValues = {
  firstName: string
  lastName: string
  username: string
}
