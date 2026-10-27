import { Input, InputNumber } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { FilterTitle } from './FilterTitle';

interface InputFilterViewProps {
  title?: string;
  /** Empty means no filter. */
  value: string;
  placeholder: string;
  isNumber: boolean;
  onChange: (value: string) => void;
}

/**
 * v1 `InputFilter`: the title (v1's plain filter title, not the stored title style) and a box on one line. Applied on
 * Enter or when the box loses focus; emptying it removes the filter.
 */
export function InputFilterView({ title, value, placeholder, isNumber, onChange }: InputFilterViewProps) {
  const commit = (next: string) => {
    if (next.trim() !== value) onChange(next.trim());
  };

  return (
    <div className={`filter-widget filter-widget--inline ${GRID_NO_DRAG_CLASS}`}>
      <FilterTitle text={title} className="filter-title--input" />
      {isNumber ? (
        <InputNumber
          aria-label={title}
          className="filter-input min-w-0 flex-1"
          controls={false}
          // Re-mounts when the value changes elsewhere (Reset Filters), so the box shows it.
          key={value}
          defaultValue={value === '' ? undefined : value}
          placeholder={placeholder}
          onBlur={event => commit(event.target.value.replaceAll(',', ''))}
          onPressEnter={event => event.currentTarget.blur()}
        />
      ) : (
        <Input
          aria-label={title}
          className="filter-input min-w-0 flex-1"
          key={value}
          defaultValue={value}
          placeholder={placeholder}
          onBlur={event => commit(event.target.value)}
          onPressEnter={event => event.currentTarget.blur()}
        />
      )}
    </div>
  );
}
