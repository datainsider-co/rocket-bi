import { useCallback, useMemo } from 'react';
import type { DateRangeChoice } from '@/core/query/comparison';
import type { MainDateState } from '../../controls/controls.utils';
import { MainDateCalendarView } from '../../controls/main-date/MainDateCalendarView';
import { useMainDateCalendar } from '../../controls/main-date/useMainDateCalendar';
import { fromMainDate, kpiDateRangeLabel, toMainDate } from './kpiDateRange.utils';
import { KpiDateRangeView } from './KpiDateRangeView';
import '../../controls/main-date/MainDate.css';

export interface KpiDateRangeProps {
  value: DateRangeChoice;
  /** Without it the range is only shown, as in the builder's preview. */
  onChange?: (choice: DateRangeChoice) => void;
}

/**
 * The number chart's date range on its card (v1 `DateRangeDropdown`): the main date's popover, all of its ranges and
 * Custom, Cancel and Apply.
 */
export function KpiDateRange({ value, onChange }: KpiDateRangeProps) {
  const applied = useMemo(() => toMainDate(value), [value]);
  const onApply = useCallback((mainDate: MainDateState) => onChange?.(fromMainDate(mainDate)), [onChange]);
  const calendar = useMainDateCalendar(applied, onApply);
  return (
    <KpiDateRangeView
      label={kpiDateRangeLabel(value, calendar.today)}
      open={calendar.open}
      onOpenChange={calendar.onOpenChange}
      picker={onChange && <MainDateCalendarView state={calendar.state} today={calendar.today} actions={calendar.actions} />}
    />
  );
}
