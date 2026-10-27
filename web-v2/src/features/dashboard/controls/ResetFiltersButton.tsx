import { HeaderButton } from '../header/HeaderButton';
import { useDashboardControls } from './DashboardControlsContext';

/** Shown once a filter or cross filter left its default (v1 `DashboardControlBar` "Reset Filters"). */
export function ResetFiltersButton() {
  const { changed, reset } = useDashboardControls();
  if (!changed) return null;
  return <HeaderButton id="btn-reset-filter" icon="di-icon-reset" title="Reset Filters" onClick={reset} />;
}
