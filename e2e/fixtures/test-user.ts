export const STORAGE_STATE = 'e2e/.auth/user.json'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Brak zmiennej ${name} — patrz e2e/README.md`)
  return value
}

/**
 * User A z seeda — jedyne konto, na ktore loguje sie E2E. Te same zmienne czyta
 * suite RLS (`__test__/rls.test.ts`), stad prefiks `TEST_` zamiast `E2E_`:
 * jeden zestaw zmiennych zamiast dwoch trzymanych w synchronizacji.
 */
export const TEST_USER_A = {
  get email() {
    return required('TEST_USER_A_EMAIL')
  },
  get password() {
    return required('TEST_USER_A_PASSWORD')
  },
}

/** Klient zakladany przez `npm run e2e:seed` — punkt startowy kazdego przebiegu. */
export const E2E_CLIENT_NAME = 'E2E Klient Testowy'
