import { useMemo, type CSSProperties } from 'react';
import { DateMode } from '@/core/query/dateRanges';
import type { ControlEntry } from '../../controls/controls.utils';
import { MainDateCalendarView } from '../../controls/main-date/MainDateCalendarView';
import { rangeLabel } from '../../controls/main-date/mainDate.utils';
import { useMainDateCalendar } from '../../controls/main-date/useMainDateCalendar';
import '../../controls/main-date/MainDate.css';
import { dateSelectionOf, dateSelectionToControl } from './filter.utils';
import { DateSelectFilterView } from './DateSelectFilterView';

interface DateSelectFilterProps {
  title?: string;
  titleStyle?: CSSProperties;
  entry: ControlEntry | undefined;
  onChange: (entry: ControlEntry) => void;
}

/** A date select filter: the main date's calendar (v1 used `DiCalendar` for both), applied to this filter's control. */
export function DateSelectFilter({ title, titleStyle, entry, onChange }: DateSelectFilterProps) {
  const { mode, range } = useMemo(() => dateSelectionOf(entry), [entry]);
  const applied = useMemo(() => ({ mode, dates: mode === DateMode.Custom ? range : [] }), [mode, range]);
  const calendar = useMainDateCalendar(applied, next => onChange(dateSelectionToControl(next.mode, next.dates, new Date())));
  return (
    <DateSelectFilterView title={title} titleStyle={titleStyle} label={rangeLabel(range)} open={calendar.open} onOpenChange={calendar.onOpenChange}>
      <MainDateCalendarView state={calendar.state} today={calendar.today} actions={calendar.actions} />
    </DateSelectFilterView>
  );
}
