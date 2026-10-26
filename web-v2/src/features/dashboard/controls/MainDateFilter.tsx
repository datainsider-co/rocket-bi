import { DateRangeModePicker } from '../charts/filter/DateRangeModePicker';
import { dateSelectionOf } from '../charts/filter/filter.utils';
import { MAIN_DATE_ID } from './controls.utils';
import { useDashboardControls } from './DashboardControlsContext';

/**
 * The dashboard's date range in the header (v1 `MainDateFilter` in `DashboardControlBar`). Charts follow it where their
 * filters name the main date. Setting it up and removing it belong to edit mode.
 */
export function MainDateFilter() {
  const { mainDate, controls, setMainDate } = useDashboardControls();
  if (!mainDate) return null;
  const { range } = dateSelectionOf(controls[MAIN_DATE_ID]);
  return <DateRangeModePicker className="w-96 max-w-full" mode={mainDate.mode} range={range} onChange={(mode, dates) => setMainDate({ mode, dates })} />;
}
