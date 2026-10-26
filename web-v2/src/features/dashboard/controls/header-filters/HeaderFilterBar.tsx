import { useDashboardControls } from '../DashboardControlsContext';
import { HeaderFilterBarView } from './HeaderFilterBarView';

/** The header filters of the dashboard's controls. */
export function HeaderFilterBar() {
  const { headerFilters, setHeaderFilter, removeHeaderFilter } = useDashboardControls();
  return <HeaderFilterBarView filters={headerFilters} onChange={setHeaderFilter} onRemove={removeHeaderFilter} />;
}
