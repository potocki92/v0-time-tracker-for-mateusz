/**
 * Re-export the shared FormSection so historical imports (`./FormSection`)
 * keep working. The implementation now lives in `components/common/form/`
 * and is reused by every form (clients, invoice builder, …).
 */
export { FormSection } from '@/components/common/form'
