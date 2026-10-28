import { boolAt, numberAt, textAt } from '../vizValue.utils';
import { DECIMAL_POINTS, DISPLAY_UNITS, PRECISIONS, THOUSAND_SEPARATORS } from '../settingOptions';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import { defaultDisplayUnit, displayUnitPath, otherSettingsOf } from './commonTabs.utils';
import type { TabProps } from './tabProps';

interface OtherTabProps extends TabProps {
  chartType: string;
}

/** v1 `VisualHeader` (Other): number format, and whether the chart follows filters, drills down and zooms. */
export function OtherTab({ viz, onChange, chartType }: OtherTabProps) {
  const shown = otherSettingsOf(chartType);
  const unitPath = displayUnitPath(chartType);
  const toggle = (key: string, fallback: boolean, label: string) => (
    <ToggleSetting label={label} value={boolAt(viz, key, fallback)} onChange={value => onChange({ [key]: value })} />
  );
  return (
    <div className="flex flex-col gap-3">
      {shown.numberFormat && (
        <div className="flex gap-3">
          <SelectSetting
            className="flex-1"
            label="Display unit"
            options={DISPLAY_UNITS}
            value={textAt(viz, unitPath, defaultDisplayUnit(chartType))}
            onChange={unit => onChange({ [unitPath]: unit })}
          />
          <SelectSetting className="w-24" label="Precision" options={PRECISIONS} value={numberAt(viz, 'precision', 2)} onChange={precision => onChange({ precision })} />
        </div>
      )}
      <div className="flex gap-3">
        <SelectSetting className="flex-1" label="Decimal point" options={DECIMAL_POINTS} value={textAt(viz, 'decimalPoint', '.')} onChange={decimalPoint => onChange({ decimalPoint })} />
        <SelectSetting
          className="flex-1"
          label="Thousand separator"
          options={THOUSAND_SEPARATORS}
          value={textAt(viz, 'thousandSep', ',')}
          onChange={thousandSep => onChange({ thousandSep })}
        />
      </div>
      {toggle('affectedByFilter', true, 'Enable external filter')}
      {shown.crossFilter && toggle('isCrossFilter', false, 'Enable cross filter')}
      {shown.drilldown && toggle('isEnableDrilldown', false, 'Enable drilldown')}
      {shown.zoom && toggle('isEnableZoom', false, 'Enable change date function')}
    </div>
  );
}
