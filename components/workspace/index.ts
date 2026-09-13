/**
 * Wspólna warstwa UI zalogowanego panelu.
 *
 * Mieszka w `components/`, a nie w którymkolwiek `features/*`, bo
 * `__test__/config/module-boundaries.test.ts` zabrania importów
 * `features/*` → `features/*`. Kontrakt tej warstwy opisuje
 * `docs/workspace-design-system.md`.
 */
export { WorkspaceCard } from './card/workspace-card'
export { WorkspaceEmptyState } from './card/workspace-empty-state'
export { WorkspaceSegmentedControl } from './control/workspace-segmented-control'
export { WorkspaceFilters } from './filters/workspace-filters'
export { WorkspaceConfirmOverlay } from './overlay/workspace-confirm-overlay'
export {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
  WorkspaceOverlayForm,
} from './overlay/workspace-overlay'
export {
  WORKSPACE_FIELD,
  WORKSPACE_FIELD_LABEL,
  WORKSPACE_FIELD_MULTILINE,
} from './form/field'
