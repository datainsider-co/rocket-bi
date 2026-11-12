import { DEFAULT_DATA_POINTS } from '@/core/query/QueryRequest';
import { NumberSetting } from '@/shared/settings/fields/NumberSetting';
import { RevertButton } from '@/shared/settings/fields/RevertButton';
import type { TabProps } from '../tabs/tabProps';
import { numberAt } from '../vizValue.utils';

/**
 * v1 `DataPointTab` ("General") of scatter and bubble charts: how many rows the chart asks the server for
 * (`pagingOf`), so a change queries again.
 */
export function DataPointTab({ viz, onChange }: TabProps) {
  return (
    <div className="settings-stack">
      <NumberSetting label="Maximum data point" min={1} value={numberAt(viz, 'numDataPoint', DEFAULT_DATA_POINTS)} onChange={numDataPoint => onChange({ numDataPoint })} />
      <RevertButton onRevert={() => onChange({ numDataPoint: DEFAULT_DATA_POINTS })} />
    </div>
  );
}
