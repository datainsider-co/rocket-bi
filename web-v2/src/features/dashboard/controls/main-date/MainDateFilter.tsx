import { MainDateCalendarView } from './MainDateCalendarView';
import { MainDatePickerView } from './MainDatePickerView';
import { SetupMainDateView } from './SetupMainDateView';
import { useMainDateCalendar } from './useMainDateCalendar';
import { useMainDateFilter, type MainDateEditing } from './useMainDateFilter';
import './MainDate.css';

interface MainDateFilterProps {
  /** Given in edit mode: Setup Main Date Filter, Remove and Edit Main Date. */
  editing?: MainDateEditing;
}

/**
 * The dashboard's date range in the header (v1 `DashboardControlBar`'s `MainDateFilter` or `SetupMainDateFilter`).
 * Charts follow it where their filters name the main date.
 */
export function MainDateFilter({ editing }: MainDateFilterProps) {
  const filter = useMainDateFilter(editing);
  const calendar = useMainDateCalendar(filter.applied, filter.apply);

  if (filter.editable && (!filter.mainDate || filter.choosing)) {
    return <SetupMainDateView open={filter.choosing} onOpenChange={filter.setChoosing} onPick={filter.setUp} />;
  }
  if (!filter.mainDate) return null;
  const edit = filter.editable
    ? {
        onRemove: () => {
          calendar.close();
          filter.remove();
        },
        onEditMainDate: () => {
          calendar.close();
          filter.setChoosing(true);
        }
      }
    : undefined;
  return (
    <MainDatePickerView label={filter.label} open={calendar.open} onOpenChange={calendar.onOpenChange}>
      <MainDateCalendarView state={calendar.state} today={calendar.today} actions={calendar.actions} edit={edit} />
    </MainDatePickerView>
  );
}
