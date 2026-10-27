import { boolAt, textAt } from '../vizValue.utils';
import { FONT_FAMILIES, FONT_SIZES } from '../settingOptions';
import { ColorSetting } from '../fields/ColorSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import { DataLabelConditionFields } from './DataLabelConditionFields';
import { DATA_LABEL_DEFAULTS as D, dataLabelPath, dataLabelRevert, dataLabelSettingsOf } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

/** v1 `DataLabelTab`: whether values show on the chart, their font, and on series which values. */
export function DataLabelTab({ viz, onChange, chartType }: TabProps & { chartType: string }) {
  const path = dataLabelPath(chartType);
  const shown = dataLabelSettingsOf(chartType);
  const off = !boolAt(viz, `${path}.enabled`, D.enabled);
  const set = (key: string) => (value: unknown) => onChange({ [`${path}.${key}`]: value });
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="On" value={!off} onChange={set('enabled')} />
      <SelectSetting label="Font family" options={FONT_FAMILIES} disabled={off} value={textAt(viz, `${path}.style.fontFamily`, D.fontFamily)} onChange={set('style.fontFamily')} />
      <div className="flex gap-3">
        <ColorSetting className="w-32" label="Font color" disabled={off} value={textAt(viz, `${path}.style.color`, D.color)} onChange={set('style.color')} />
        <SelectSetting className="w-20" label="Text size" options={FONT_SIZES} disabled={off} value={textAt(viz, `${path}.style.fontSize`, D.fontSize)} onChange={set('style.fontSize')} />
      </div>
      {shown.condition && <DataLabelConditionFields viz={viz} onChange={onChange} path={`${path}.condition`} disabled={off} />}
      <RevertButton onRevert={() => onChange(dataLabelRevert(chartType))} />
    </div>
  );
}
