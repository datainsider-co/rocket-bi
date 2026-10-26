import { Input, InputNumber } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';

interface InputFilterViewProps {
  title?: string;
  /** Empty means no filter. */
  value: string;
  placeholder: string;
  isNumber: boolean;
  onChange: (value: string) => void;
}

/** v1 `InputFilter`: a text or number box applied on Enter or when it loses focus; clearing it removes the filter. */
export function InputFilterView({ title, value, placeholder, isNumber, onChange }: InputFilterViewProps) {
  const commit = (next: string) => {
    if (next.trim() !== value) onChange(next.trim());
  };

  return (
    <div className={`flex h-full flex-col justify-center gap-1 ${GRID_NO_DRAG_CLASS}`}>
      {title && <div className="truncate font-medium">{title}</div>}
      {isNumber ? (
        <InputNumber
          aria-label={title}
          className="w-full!"
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
          key={value}
          defaultValue={value}
          placeholder={placeholder}
          allowClear
          onBlur={event => commit(event.target.value)}
          onPressEnter={event => event.currentTarget.blur()}
          onClear={() => onChange('')}
        />
      )}
    </div>
  );
}
