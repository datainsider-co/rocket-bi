import { boolAt } from '../vizValue.utils';
import { RevertButton } from '../fields/RevertButton';
import { ToggleSetting } from '../fields/ToggleSetting';
import { AxisGridFields } from './AxisGridFields';
import { AxisLabelFields } from './AxisLabelFields';
import { AxisRangeFields } from './AxisRangeFields';
import { AxisTitleFields } from './AxisTitleFields';
import { yAxisRevert, yAxisToggle } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

const AXIS = 'yAxis[0]';

/** v1 `SeriesYAxisTab`: the main value axis. */
export function YAxisTab({ viz, onChange, defaultTitle }: TabProps & { defaultTitle: string }) {
  const visible = boolAt(viz, `${AXIS}.visible`, true);
  const group = { viz, onChange, axis: AXIS, disabled: !visible };
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="On" value={visible} onChange={next => onChange(yAxisToggle(next))} />
      <AxisLabelFields {...group} />
      <AxisTitleFields {...group} defaultTitle={defaultTitle} />
      <AxisGridFields {...group} />
      <AxisRangeFields {...group} />
      <RevertButton onRevert={() => onChange(yAxisRevert(defaultTitle))} />
    </div>
  );
}
