import { useState } from 'react';
import { DatePicker, InputNumber, Slider } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { SlicerKind, SlicerRange } from './slicerFilter.utils';

const DAY_MS = 24 * 60 * 60 * 1000;

/** An input's text as a number; `null` when empty or not a number. */
function parseInput(text: string): number | null {
  const number = Number(text.replaceAll(',', ''));
  return text.trim() === '' || Number.isNaN(number) ? null : number;
}

interface SlicerFilterViewProps {
  title?: string;
  kind: SlicerKind;
  bounds: SlicerRange;
  range: SlicerRange;
  step?: number;
  onChange: (range: SlicerRange) => void;
}

/**
 * v1 `NumberSlicer`: a range slider between the column's min and max, with two inputs (two date pickers for dates).
 * The slider reports when the drag ends; inputs when they lose focus.
 */
export function SlicerFilterView({ title, kind, bounds, range, step, onChange }: SlicerFilterViewProps) {
  // The drag in progress; the picked range otherwise.
  const [dragging, setDragging] = useState<SlicerRange | null>(null);
  const [from, to] = dragging ?? range;
  const isDate = kind === 'date';

  const commit = (next: SlicerRange) => {
    setDragging(null);
    const ordered: SlicerRange = next[0] <= next[1] ? next : [next[1], next[0]];
    if (ordered[0] !== range[0] || ordered[1] !== range[1]) onChange(ordered);
  };
  const toNumber = (value: number | null, fallback: number) => (value === null ? fallback : Math.min(Math.max(value, bounds[0]), bounds[1]));
  const toDate = (value: Dayjs | null, fallback: number) => (value ? toNumber(value.valueOf(), fallback) : fallback);

  return (
    <div className={`flex h-full flex-col gap-2 ${GRID_NO_DRAG_CLASS}`}>
      {title && <div className="truncate font-medium">{title}</div>}
      <div className="flex gap-2">
        {isDate ? (
          <>
            <DatePicker aria-label="From" className="w-1/2" allowClear={false} value={dayjs(from)} onChange={value => commit([toDate(value, from), to])} format="DD/MM/YYYY" />
            <DatePicker aria-label="To" className="w-1/2" allowClear={false} value={dayjs(to)} onChange={value => commit([from, toDate(value, to)])} format="DD/MM/YYYY" />
          </>
        ) : (
          <>
            <InputNumber
              aria-label="From"
              className="w-1/2!"
              key={`from-${from}`}
              defaultValue={from}
              onBlur={event => commit([toNumber(parseInput(event.target.value), from), to])}
              onPressEnter={event => event.currentTarget.blur()}
            />
            <InputNumber
              aria-label="To"
              className="w-1/2!"
              key={`to-${to}`}
              defaultValue={to}
              onBlur={event => commit([from, toNumber(parseInput(event.target.value), to)])}
              onPressEnter={event => event.currentTarget.blur()}
            />
          </>
        )}
      </div>
      <Slider
        range
        min={bounds[0]}
        max={bounds[1]}
        step={isDate ? DAY_MS : (step ?? 1)}
        value={[from, to]}
        tooltip={isDate ? { formatter: value => dayjs(value).format('DD/MM/YYYY') } : undefined}
        onChange={([start = from, end = to]) => setDragging([start, end])}
        onChangeComplete={([start = from, end = to]) => commit([start, end])}
      />
    </div>
  );
}
