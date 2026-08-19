export const STORAGE_STATE = 'e2e/.auth/user.json'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Brak zmiennej ${name} — patrz e2e/README.md`)
  return value
}

export const E2E_USER = {
  get email() {
    return required('E2E_USER_EMAIL')
  },
  get password() {
    return required('E2E_USER_PASSWORD')
  },
}

/** Klient zakladany przez `npm run e2e:seed` — punkt startowy kazdego przebiegu. */
export const E2E_CLIENT_NAME = 'E2E Klient Testowy'
