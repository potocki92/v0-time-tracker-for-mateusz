/**
 * Minimalna atrapa klienta Supabase — dokladnie te operacje, ktorych uzywa
 * repozytorium automatu. Trzyma wiersze w pamieci i egzekwuje UNIQUE na
 * `work_entries (user_id, date, entry_kind)`, zeby test rownoleglych przebiegow
 * sprawdzal to samo, co robi baza.
 *
 * Uprawnienia i wspolbieznosc na PRAWDZIWEJ bazie sprawdza suite RLS
 * (`__test__/rls.test.ts`); tutaj chodzi o zachowanie logiki przebiegu.
 */

export type Row = Record<string, unknown>

interface Filter {
  column: string
  op: 'eq' | 'gte' | 'lte'
  value: unknown
}

const UNIQUE_VIOLATION = '23505'

function matches(row: Row, filters: Filter[]): boolean {
  return filters.every(({ column, op, value }) => {
    const actual = row[column]
    if (op === 'eq') return actual === value
    if (op === 'gte') return String(actual) >= String(value)
    return String(actual) <= String(value)
  })
}

function conflictKeys(onConflict: string | undefined): string[] {
  return (onConflict ?? '').split(',').map((key) => key.trim()).filter(Boolean)
}

export interface FakeSupabase {
  from(table: string): FakeTable
  rows(table: string): Row[]
}

interface FakeTable {
  select(columns?: string): FakeQuery
  insert(payload: Row): { select(columns?: string): { single(): Promise<Result<Row>> } }
  upsert(payload: Row, options?: { onConflict?: string }): Promise<Result<null>>
}

type Result<T> = { data: T | null; error: { message: string; code?: string } | null }

interface FakeQuery extends PromiseLike<Result<Row[]>> {
  eq(column: string, value: unknown): FakeQuery
  gte(column: string, value: unknown): FakeQuery
  lte(column: string, value: unknown): FakeQuery
  order(column: string, options?: { ascending?: boolean }): FakeQuery
  limit(count: number): FakeQuery
  maybeSingle(): Promise<Result<Row>>
  single(): Promise<Result<Row>>
}

export interface FakeOptions {
  /** Tabele, ktore maja zwrocic blad odczytu zamiast danych. */
  failingTables?: string[]
}

export function createFakeSupabase(
  seed: Record<string, Row[]> = {},
  { failingTables = [] }: FakeOptions = {},
): FakeSupabase {
  const db: Record<string, Row[]> = {}
  for (const [table, rows] of Object.entries(seed)) db[table] = rows.map((row) => ({ ...row }))

  const table = (name: string): Row[] => (db[name] ??= [])

  function query(name: string): FakeQuery {
    const filters: Filter[] = []
    let sort: { column: string; ascending: boolean } | null = null
    let take: number | null = null

    const resolve = (): Result<Row[]> => {
      if (failingTables.includes(name)) {
        return { data: null, error: { message: `odczyt ${name} nieudany` } }
      }
      let rows = table(name).filter((row) => matches(row, filters))
      if (sort) {
        const { column, ascending } = sort
        rows = [...rows].sort((a, b) =>
          (ascending ? 1 : -1) * String(a[column]).localeCompare(String(b[column])),
        )
      }
      if (take !== null) rows = rows.slice(0, take)
      return { data: rows.map((row) => ({ ...row })), error: null }
    }

    const builder: FakeQuery = {
      eq(column, value) {
        filters.push({ column, op: 'eq', value })
        return builder
      },
      gte(column, value) {
        filters.push({ column, op: 'gte', value })
        return builder
      },
      lte(column, value) {
        filters.push({ column, op: 'lte', value })
        return builder
      },
      order(column, options) {
        sort = { column, ascending: options?.ascending ?? true }
        return builder
      },
      limit(count) {
        take = count
        return builder
      },
      async maybeSingle() {
        const result = resolve()
        if (result.error) return { data: null, error: result.error }
        return { data: result.data?.[0] ?? null, error: null }
      },
      async single() {
        const result = await builder.maybeSingle()
        if (!result.error && !result.data) {
          return { data: null, error: { message: 'no rows', code: 'PGRST116' } }
        }
        return result
      },
      then(onFulfilled, onRejected) {
        return Promise.resolve(resolve()).then(onFulfilled, onRejected)
      },
    }

    return builder
  }

  return {
    rows: (name: string) => table(name),
    from(name: string): FakeTable {
      return {
        select: () => query(name),
        insert(payload) {
          return {
            select: () => ({
              async single(): Promise<Result<Row>> {
                if (name === 'work_entries') {
                  const duplicate = table(name).some(
                    (row) =>
                      row.user_id === payload.user_id &&
                      row.date === payload.date &&
                      (row.entry_kind ?? 'real') === (payload.entry_kind ?? 'real'),
                  )
                  if (duplicate) {
                    return {
                      data: null,
                      error: { message: 'duplicate key', code: UNIQUE_VIOLATION },
                    }
                  }
                }

                const row = { id: `${name}-${table(name).length + 1}`, ...payload }
                table(name).push(row)
                return { data: { ...row }, error: null }
              },
            }),
          }
        },
        async upsert(payload, options): Promise<Result<null>> {
          const keys = conflictKeys(options?.onConflict)
          const existing = keys.length
            ? table(name).find((row) => keys.every((key) => row[key] === payload[key]))
            : undefined

          if (existing) Object.assign(existing, payload)
          else table(name).push({ id: `${name}-${table(name).length + 1}`, ...payload })

          return { data: null, error: null }
        },
      }
    },
  }
}
