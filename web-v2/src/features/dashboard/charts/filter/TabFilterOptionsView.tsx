import { Select } from 'antd';
import { ChoiceIcon } from './ChoiceIcon';
import { TabFilterDisplay, type FilterOption } from './filter.utils';

interface TabFilterOptionsViewProps {
  items: readonly FilterOption[];
  displayAs: string;
  direction: 'row' | 'column';
  checked: (value: string) => boolean;
  onPick: (value: string) => void;
}

/**
 * v1 `TabSelection`: bordered tabs (`NormalTabItem`), check boxes or radios (`MultiChoiceItem`, `SingleChoiceItem`) in
 * a row or a column, or a dropdown.
 */
export function TabFilterOptionsView({ items, displayAs, direction, checked, onPick }: TabFilterOptionsViewProps) {
  if (displayAs === TabFilterDisplay.DropDown) {
    return (
      <Select
        className="filter-select w-full"
        aria-label="Options"
        value={items.find(item => checked(item.value))?.value}
        onChange={onPick}
        showSearch={{ optionFilterProp: 'label' }}
        options={[...items]}
      />
    );
  }
  const multiple = displayAs === TabFilterDisplay.MultiChoice;
  const choice = multiple || displayAs === TabFilterDisplay.SingleChoice;
  return (
    <div
      className={`filter-options filter-options--${direction}${choice ? ' filter-options--choice' : ''}`}
      role={choice && !multiple ? 'radiogroup' : undefined}
    >
      {items.map(item =>
        choice ? (
          <button
            key={item.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={checked(item.value)}
            className="filter-choice"
            title={item.label}
            onClick={() => onPick(item.value)}
          >
            <ChoiceIcon multiple={multiple} checked={checked(item.value)} />
            <span className="filter-choice__label">{item.label}</span>
          </button>
        ) : (
          <button
            key={item.value}
            type="button"
            aria-pressed={checked(item.value)}
            className="filter-tab-item"
            title={item.label}
            onClick={() => onPick(item.value)}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
