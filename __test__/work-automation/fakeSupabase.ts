/**
 * Minimalna atrapa klienta Supabase — dokladnie te operacje, ktorych uzywa
 * repozytorium automatu. Trzyma wiersze w pamieci i egzekwuje te same klucze,
 * co baza, zeby testy rownoleglych przebiegow sprawdzaly prawdziwa gwarancje,
 * a nie zycznie atrapy.
 *
 * Uprawnienia i wspolbieznosc na PRAWDZIWEJ bazie sprawdza suite RLS
 * (`__test__/rls.test.ts`); tutaj chodzi o zachowanie logiki przebiegu.
 */

export type Row = Record<string, unknown>

/**
 * Klucze pilnowane przy INSERT — odpowiednik ograniczen z migracji:
 * `UNIQUE (user_id, date, entry_kind)` na wpisach i
 * `PRIMARY KEY (user_id, local_date)` na dzienniku decyzji.
 */
const UNIQUE_KEYS: Record<string, string[]> = {
  work_entries: ['user_id', 'date', 'entry_kind'],
  work_automation_runs: ['user_id', 'local_date'],
}

/** Brak `entry_kind` znaczy w bazie `real` (DEFAULT kolumny). */
function keyValue(row: Row, column: string): unknown {
  if (column === 'entry_kind') return row[column] ?? 'real'
  return row[column]
}

function violatesUnique(rows: Row[], table: string, payload: Row): boolean {
  const keys = UNIQUE_KEYS[table]
  if (!keys) return false
  return rows.some((row) => keys.every((key) => keyValue(row, key) === keyValue(payload, key)))
}

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
  insert(payload: Row): FakeInsert
  update(payload: Row): FakeUpdate
  upsert(payload: Row, options?: { onConflict?: string }): Promise<Result<null>>
}

/** `insert` bywa czekany wprost (dziennik) albo przez `.select().single()` (wpisy). */
interface FakeInsert extends PromiseLike<Result<null>> {
  select(columns?: string): { single(): Promise<Result<Row>> }
}

interface FakeUpdate extends PromiseLike<Result<null>> {
  eq(column: string, value: unknown): FakeUpdate
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
        insert(payload): FakeInsert {
          const run = (): Result<Row> => {
            if (violatesUnique(table(name), name, payload)) {
              return { data: null, error: { message: 'duplicate key', code: UNIQUE_VIOLATION } }
            }

            const row = { id: `${name}-${table(name).length + 1}`, ...payload }
            table(name).push(row)
            return { data: { ...row }, error: null }
          }

          return {
            select: () => ({ single: async () => run() }),
            then(onFulfilled, onRejected) {
              const { error } = run()
              return Promise.resolve({ data: null, error }).then(onFulfilled, onRejected)
            },
          }
        },
        update(payload): FakeUpdate {
          const filters: Filter[] = []

          const builder: FakeUpdate = {
            eq(column, value) {
              filters.push({ column, op: 'eq', value })
              return builder
            },
            then(onFulfilled, onRejected) {
              for (const row of table(name).filter((candidate) => matches(candidate, filters))) {
                Object.assign(row, payload)
              }
              return Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected)
            },
          }

          return builder
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
