import { COMPARE_MODE_OPTIONS, CompareMode, TREND_BY_OPTIONS } from '@/core/query/comparison';
import { DATE_MODE_OPTIONS, DateMode } from '@/core/query/dateRanges';
import { boolAt, textAt } from '../vizValue.utils';
import { ColorSetting } from '../fields/ColorSetting';
import { DateRangeSetting } from '../fields/DateRangeSetting';
import { RevertButton } from '../fields/RevertButton';
import { SelectSetting } from '../fields/SelectSetting';
import { ToggleSetting } from '../fields/ToggleSetting';
import type { TabProps } from '../tabs/tabProps';
import {
  compareModeChanges,
  compareModeOf,
  comparisonRevert,
  comparisonToggle,
  dataRangeToggle,
  dateModeOf,
  dateRangeModeChanges,
  dateFieldKeyOf,
  rangeAt,
  type DateFieldChoice
} from './comparisonTab.utils';

interface ComparisonTabProps extends TabProps {
  dateFields: readonly DateFieldChoice[];
}

const TREND_TYPES = [
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' }
];
const TREND_BYS = TREND_BY_OPTIONS.map(value => ({ label: value, value }));

/** v1 number `ComparisonTab` (Date Range): the range the value covers, a period to compare it with, a trend line. */
export function ComparisonTab({ viz, onChange, dateFields }: ComparisonTabProps) {
  const rangeOn = boolAt(viz, 'dataRange.enabled', false);
  const mode = dateModeOf(viz);
  const compareOn = rangeOn && boolAt(viz, 'comparison.enabled', false);
  const compareMode = compareModeOf(viz);
  const trendOn = rangeOn && boolAt(viz, 'trendLine.enabled', false);
  const fieldKey = dateFieldKeyOf(viz);
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="Date range" value={rangeOn} onChange={enabled => onChange(dataRangeToggle(viz, enabled, dateFields, new Date()))} />
      <SelectSetting
        label="Date field"
        options={dateFields}
        disabled={!rangeOn}
        value={dateFields.some(choice => choice.value === fieldKey) ? fieldKey : ''}
        onChange={key => onChange({ 'dataRange.dateField': dateFields.find(choice => choice.value === key)?.field })}
      />
      <SelectSetting label="Range" options={DATE_MODE_OPTIONS} disabled={!rangeOn} value={mode} onChange={next => onChange(dateRangeModeChanges(viz, next, new Date()))} />
      {mode === DateMode.Custom && (
        <DateRangeSetting label="Dates" disabled={!rangeOn} value={rangeAt(viz, 'dataRange.dateRange')} onChange={range => onChange(dateRangeModeChanges(viz, DateMode.Custom, new Date(), range))} />
      )}
      <ToggleSetting label="Compare with" disabled={!rangeOn} value={compareOn} onChange={enabled => onChange(comparisonToggle(viz, enabled))} />
      <SelectSetting label="Compared period" options={COMPARE_MODE_OPTIONS} disabled={!compareOn} value={compareMode} onChange={next => onChange(compareModeChanges(viz, next))} />
      {compareMode === CompareMode.Custom && (
        <DateRangeSetting
          label="Compared dates"
          disabled={!compareOn}
          value={rangeAt(viz, 'comparison.dateRange')}
          onChange={range => onChange(compareModeChanges(viz, CompareMode.Custom, range))}
        />
      )}
      <ToggleSetting label="Trend line" disabled={!rangeOn} value={trendOn} onChange={enabled => onChange({ 'trendLine.enabled': enabled })} />
      <div className="flex gap-3">
        <SelectSetting className="flex-1" label="Display as" options={TREND_TYPES} disabled={!trendOn} value={textAt(viz, 'trendLine.displayAs', 'line')} onChange={displayAs => onChange({ 'trendLine.displayAs': displayAs })} />
        <ColorSetting className="w-32" label="Trend color" disabled={!trendOn} value={textAt(viz, 'trendLine.color', '#007126')} onChange={color => onChange({ 'trendLine.color': color })} />
      </div>
      <SelectSetting label="Trend by" options={TREND_BYS} disabled={!trendOn} value={textAt(viz, 'trendLine.trendBy', 'Month of')} onChange={trendBy => onChange({ 'trendLine.trendBy': trendBy })} />
      <RevertButton onRevert={() => onChange(comparisonRevert())} />
    </div>
  );
}
