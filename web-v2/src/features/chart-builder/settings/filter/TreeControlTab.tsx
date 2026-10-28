import { textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import type { TabProps } from '../tabs/tabProps';
import { DefaultValueField, type DefaultValueFieldProps } from './DefaultValueField';
import { treeControlRevert } from './filterTabs.utils';

/** v1 `TreeFilterControlTab`: the checkboxes' colors and the default selection. */
export function TreeControlTab({ viz, onChange, defaultValue }: TabProps & { defaultValue: DefaultValueFieldProps }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <ColorSetting className="flex-1" label="Inactive background" value={textAt(viz, 'deActiveColor', '#9799AC')} onChange={deActiveColor => onChange({ deActiveColor })} />
        <ColorSetting
          className="flex-1"
          label="Active background"
          value={textAt(viz, 'activeColor', 'var(--tab-filter-background-active)')}
          onChange={activeColor => onChange({ activeColor })}
        />
      </div>
      <DefaultValueField {...defaultValue} />
      <RevertButton onRevert={() => onChange(treeControlRevert())} />
    </div>
  );
}
