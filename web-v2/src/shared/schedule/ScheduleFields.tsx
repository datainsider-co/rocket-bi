import { Checkbox, DatePicker, InputNumber, Radio, Select, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { FormField } from '@/shared/form/FormField';
import {
  DAY_OPTIONS,
  Frequency,
  FREQUENCY_OPTIONS,
  hasTimeOfDay,
  recurUnit,
  ScheduleMode,
  type WithSchedule
} from './schedule.utils';

interface ScheduleFieldsProps<T extends WithSchedule> {
  control: Control<T>;
  /** Offer Minutely (v1 hid it in the multi-table job modal). */
  allowMinutely: boolean;
}

const MODE_OPTIONS = [
  { value: ScheduleMode.Recurring, label: 'Recurring' },
  { value: ScheduleMode.Once, label: 'Run only once' }
];

const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm:ss';

const toDate = (value: string) => (value ? dayjs(value) : null);
const toTime = (value: string) => (value ? dayjs(`2000-01-01T${value}`) : null);

/**
 * When a job runs (v1 `SchedulerSettingV2`): run once at a date and time, or recur every n minutes, hours, days, weeks
 * (on some days) or months (on a day). Times are the user's local time; `formValuesToSchedule` converts them.
 */
export function ScheduleFields<T extends WithSchedule>({ control, allowMinutely }: ScheduleFieldsProps<T>) {
  // Any form with a `schedule`; react-hook-form can't see that through the generic.
  const form = control as unknown as Control<WithSchedule>;
  const mode = useWatch({ control: form, name: 'schedule.mode' });
  const frequency = useWatch({ control: form, name: 'schedule.frequency' });
  const frequencies = FREQUENCY_OPTIONS.filter(option => allowMinutely || option.value !== Frequency.Minutely);

  return (
    <section aria-label="Schedule">
      <FormField
        control={form}
        name="schedule.mode"
        label="Scheduler type"
        render={field => <Select {...field} options={MODE_OPTIONS} />}
      />
      {mode === ScheduleMode.Once ? (
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField
            control={form}
            name="schedule.date"
            label="Date"
            required
            render={({ value, onChange, ...field }) => (
              <DatePicker
                {...field}
                className="w-full"
                allowClear={false}
                value={toDate(value)}
                onChange={date => onChange(date ? date.format(DATE_FORMAT) : '')}
              />
            )}
          />
          <FormField
            control={form}
            name="schedule.time"
            label="Time"
            required
            render={({ value, onChange, ...field }) => (
              <TimePicker
                {...field}
                className="w-full"
                allowClear={false}
                value={toTime(value)}
                onChange={time => onChange(time ? time.format(TIME_FORMAT) : '')}
              />
            )}
          />
        </div>
      ) : (
        <>
          <FormField
            control={form}
            name="schedule.frequency"
            label="Frequency"
            render={field => <Radio.Group {...field} options={frequencies} optionType="button" />}
          />
          {frequency === Frequency.Monthly ? (
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <FormField
                control={form}
                name="schedule.recurOnDay"
                label="Recurs on day"
                render={({ onChange, ...field }) => (
                  <InputNumber {...field} className="w-full" min={1} max={31} precision={0} onChange={day => onChange(day ?? 0)} />
                )}
              />
              <FormField
                control={form}
                name="schedule.recurEveryMonth"
                label="Of every"
                render={({ onChange, ...field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    min={1}
                    precision={0}
                    suffix="months"
                    onChange={months => onChange(months ?? 0)}
                  />
                )}
              />
            </div>
          ) : (
            <FormField
              control={form}
              name="schedule.recurEvery"
              label="Recurs every"
              render={({ onChange, ...field }) => (
                <InputNumber
                  {...field}
                  className="w-full sm:w-1/2"
                  min={1}
                  precision={0}
                  suffix={recurUnit(frequency)}
                  onChange={count => onChange(count ?? 0)}
                />
              )}
            />
          )}
          {frequency === Frequency.Weekly && (
            <FormField
              control={form}
              name="schedule.days"
              label="On these days"
              required
              render={field => <Checkbox.Group {...field} options={[...DAY_OPTIONS]} />}
            />
          )}
          {hasTimeOfDay({ mode, frequency }) && (
            <FormField
              control={form}
              name="schedule.time"
              label="At"
              required
              render={({ value, onChange, ...field }) => (
                <TimePicker
                  {...field}
                  className="w-full sm:w-1/2"
                  allowClear={false}
                  value={toTime(value)}
                  onChange={time => onChange(time ? time.format(TIME_FORMAT) : '')}
                />
              )}
            />
          )}
        </>
      )}
      <Typography.Text type="secondary" className="text-xs">
        Times are in your time zone.
      </Typography.Text>
    </section>
  );
}
