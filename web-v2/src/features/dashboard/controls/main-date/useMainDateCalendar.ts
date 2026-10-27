import { useMemo, useReducer, useState } from 'react';
import type { MainDateState } from '../controls.utils';
import type { MainDateCalendarActions } from './MainDateCalendarView';
import { appliedMainDate, calendarReducer, initialCalendar } from './mainDate.utils';

const currentDate = () => new Date();

/**
 * The main date popover's open state and its draft (v1 `DiCalendar` `currentCalendarData`): it opens on the applied
 * choice, Cancel drops the draft and Apply hands it to `onApply`.
 */
export function useMainDateCalendar(applied: MainDateState, onApply: (mainDate: MainDateState) => void, now: () => Date = currentDate) {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(calendarReducer, undefined, () => initialCalendar(now()));
  // Today as of the last open, so the calendars don't shift while open.
  const [today, setToday] = useState(now);

  const onOpenChange = (next: boolean) => {
    if (next) {
      const date = now();
      setToday(date);
      dispatch({ type: 'open', mainDate: applied, now: date });
    }
    setOpen(next);
  };

  const actions = useMemo(
    (): MainDateCalendarActions => ({
      onPreset: mode => dispatch({ type: 'preset', mode, now: today }),
      onStart: day => dispatch({ type: 'start', day, now: today }),
      onEnd: day => dispatch({ type: 'end', day, now: today }),
      onMonth: (side, month) => dispatch({ type: 'month', side, month }),
      onCancel: () => setOpen(false),
      onApply: () => {
        setOpen(false);
        onApply(appliedMainDate(state));
      }
    }),
    [today, state, onApply]
  );

  return { open, onOpenChange, close: () => setOpen(false), state, today, actions };
}
