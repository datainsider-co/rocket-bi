import { useReducer } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateMode } from '@/core/query/dateRanges';
import { MainDateCalendarView } from './MainDateCalendarView';
import { calendarReducer } from './mainDate.utils';
import '../../theme/dashboardTheme.css';
import '../../header/DashboardHeader.css';
import './MainDate.css';

const today = new Date();

/** The popover's content, picking presets and days the way the header's main date filter does. */
function Playground({ editing }: { editing: boolean }) {
  const [state, dispatch] = useReducer(calendarReducer, undefined, () =>
    calendarReducer(
      { mode: DateMode.AllTime, range: null, startMonth: { year: 0, month: 0 }, endMonth: { year: 0, month: 0 } },
      { type: 'open', mainDate: { mode: DateMode.Last30Days, dates: [] }, now: today }
    )
  );
  const log = (name: string) => () => console.info(name);
  return (
    <div className="dashboard-theme" data-dashboard-theme="light-default" style={{ display: 'inline-block', boxShadow: 'var(--menu-shadow)' }}>
      <MainDateCalendarView
        state={state}
        today={today}
        actions={{
          onPreset: mode => dispatch({ type: 'preset', mode, now: today }),
          onStart: day => dispatch({ type: 'start', day, now: today }),
          onEnd: day => dispatch({ type: 'end', day, now: today }),
          onMonth: (side, month) => dispatch({ type: 'month', side, month }),
          onCancel: log('cancel'),
          onApply: log('apply')
        }}
        edit={editing ? { onRemove: log('remove'), onEditMainDate: log('edit main date') } : undefined}
      />
    </div>
  );
}

const meta = {
  title: 'Dashboard/MainDateCalendar',
  component: Playground,
  args: { editing: false }
} satisfies Meta<typeof Playground>;

export default meta;

export const View: StoryObj<typeof meta> = {};

export const Editing: StoryObj<typeof meta> = { args: { editing: true } };
