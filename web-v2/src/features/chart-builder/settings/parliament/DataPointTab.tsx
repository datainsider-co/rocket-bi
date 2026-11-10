import { numberAt } from '../vizValue.utils';
import { NumberSetting } from '../fields/NumberSetting';
import { RevertButton } from '../fields/RevertButton';
import type { TabProps } from '../tabs/tabProps';

/** What a new parliament allows (v1 `ParliamentChartOption.getDefaultChartOption`). */
export const MAX_DATA_POINT = 1000;

/**
 * v1 `DataPointTab` (General): the most dots a value may have, beyond which the chart says so instead of drawing. v1
 * wrote `numDataPoint` while its chart read `maxDataPoint`, so the setting never applied; v2 writes what the chart reads.
 */
export function DataPointTab({ viz, onChange }: TabProps) {
  return (
    <div className="flex flex-col gap-3">
      <NumberSetting label="Max data point" min={1} value={numberAt(viz, 'maxDataPoint', MAX_DATA_POINT)} onChange={maxDataPoint => onChange({ maxDataPoint })} />
      <RevertButton onRevert={() => onChange({ maxDataPoint: MAX_DATA_POINT })} />
    </div>
  );
}
