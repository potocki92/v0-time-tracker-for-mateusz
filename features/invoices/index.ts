/**
 * Publiczne API modulu Invoices.
 *
 * Kreator faktur jest wewnetrzny — na zewnatrz wychodzi widok listy oraz
 * server action, ktorego dashboard uzywa do podsumowan kwartalnych.
 * Czyste typy i klucze zapytan: '@/features/invoices/domain'.
 */
export { InvoicesContent } from './components'
export { fetchOverallQuartersAction } from './services/actions/worked-quarters.actions'
