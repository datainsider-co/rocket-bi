import { Select } from 'antd';
import { controlValuesOf, type ChartControl } from '@/core/chart-builder/chartControls';
import { FilterInput } from '@/core/query/internalFilter';
import { controlIconOf } from '../../field-tree/fieldTree.utils';

interface ControlValuesInputProps {
  controls: readonly ChartControl[];
  controlId: number | undefined;
  input: FilterInput;
  /** The control's value types picked (`selected_value`, `min_value`, ...). */
  values: readonly string[];
  onControl: (controlId: number) => void;
  onValues: (values: string[]) => void;
}

/**
 * A condition's values taken from a chart control (v1 `SelectionInput` Chart Control mode): the control, then which of
 * its values fill the condition, one per value the condition takes.
 */
export function ControlValuesInput({ controls, controlId, input, values, onControl, onValues }: ControlValuesInputProps) {
  const control = controls.find(item => item.id === controlId);
  const options = control ? controlValuesOf(control.chartType).map(value => ({ value: value.type, label: value.label })) : [];
  const [first, second] = values;
  return (
    <div className="flex flex-col gap-2">
      <Select
        aria-label="Chart control"
        placeholder="Select a control"
        value={control?.id}
        onChange={onControl}
        options={controls.map(item => ({
          value: item.id,
          label: (
            <span className="flex items-center gap-2">
              <img src={controlIconOf(item)} alt="" className="h-4 w-4" />
              {item.title}
            </span>
          )
        }))}
      />
      {control && input === FilterInput.MultiSelect && (
        <Select mode="multiple" aria-label="Control values" placeholder="Select values to filter" value={[...values]} options={options} onChange={onValues} />
      )}
      {control && (input === FilterInput.NumberRange || input === FilterInput.DateRange) && (
        <div className="flex gap-2">
          <Select aria-label="Start value" className="flex-1" placeholder="Select start value" value={first || undefined} options={options} onChange={value => onValues([value, second ?? ''])} />
          <Select aria-label="End value" className="flex-1" placeholder="Select end value" value={second || undefined} options={options} onChange={value => onValues([first ?? '', value])} />
        </div>
      )}
      {control && (input === FilterInput.Text || input === FilterInput.Date) && (
        <Select aria-label="Control value" placeholder="Select value to filter" value={first || undefined} options={options} onChange={value => onValues([value])} />
      )}
    </div>
  );
}
