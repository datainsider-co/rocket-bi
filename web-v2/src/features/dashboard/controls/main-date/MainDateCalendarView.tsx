import { Button, Select } from 'antd';
import { DATE_MODE_OPTIONS, type DateMode } from '@/core/query/dateRanges';
import { calendarBounds, type CalendarState } from './mainDate.utils';
import type { Month } from './monthCalendar.utils';
import { MonthCalendarView } from './MonthCalendarView';

export interface MainDateCalendarActions {
  onPreset: (mode: DateMode) => void;
  onStart: (day: Date) => void;
  onEnd: (day: Date) => void;
  onMonth: (side: 'start' | 'end', month: Month) => void;
  onCancel: () => void;
  onApply: () => void;
}

/** Edit mode only (v1 `canEditCalendar`). */
export interface MainDateEditActions {
  onRemove: () => void;
  onEditMainDate: () => void;
}

interface MainDateCalendarViewProps {
  state: CalendarState;
  today: Date;
  actions: MainDateCalendarActions;
  edit?: MainDateEditActions;
}

/**
 * The main date popover (v1 `DiCalendar`): a preset at the top, Start Date and End Date calendars, Cancel and Apply;
 * Remove and Edit Main Date while editing the dashboard.
 */
export function MainDateCalendarView({ state, today, actions, edit }: MainDateCalendarViewProps) {
  const { start, end } = calendarBounds(state.range, today);
  return (
    <div className="main-date-popover">
      <div className="main-date-popover__presets">
        <Select<DateMode>
          aria-label="Date range"
          className="main-date-popover__preset"
          variant="borderless"
          value={state.mode}
          onChange={actions.onPreset}
          options={[...DATE_MODE_OPTIONS]}
          popupMatchSelectWidth={false}
          listHeight={328}
        />
      </div>
      <div className="main-date-popover__body">
        <div className="main-date-popover__column">
          <div className="main-date-popover__column-title">Start Date</div>
          <MonthCalendarView
            label="Start Date"
            month={state.startMonth}
            range={state.range}
            side="start"
            bounds={{ max: end, today }}
            onPick={actions.onStart}
            onMonth={month => actions.onMonth('start', month)}
          />
        </div>
        <div className="main-date-popover__column">
          <div className="main-date-popover__column-title">End Date</div>
          <MonthCalendarView
            label="End Date"
            month={state.endMonth}
            range={state.range}
            side="end"
            bounds={{ min: start, today }}
            onPick={actions.onEnd}
            onMonth={month => actions.onMonth('end', month)}
          />
        </div>
      </div>
      <div className="main-date-popover__footer">
        <div className="main-date-popover__edit">
          {edit && (
            <>
              <button type="button" className="main-date-popover__link" onClick={edit.onRemove}>
                <i className="di-icon-delete" aria-hidden />
                <span>Remove</span>
              </button>
              <button type="button" className="main-date-popover__link" onClick={edit.onEditMainDate}>
                <i className="di-icon-setting" aria-hidden />
                <span>Edit Main Date</span>
              </button>
            </>
          )}
        </div>
        <Button className="main-date-popover__button" onClick={actions.onCancel}>
          Cancel
        </Button>
        <Button className="main-date-popover__button" type="primary" onClick={actions.onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}
