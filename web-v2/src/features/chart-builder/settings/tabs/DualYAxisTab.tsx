import { boolAt } from '../vizValue.utils';
import { RevertButton } from '../fields/RevertButton';
import { ToggleSetting } from '../fields/ToggleSetting';
import { AxisGridFields } from './AxisGridFields';
import { AxisLabelFields } from './AxisLabelFields';
import { AxisRangeFields } from './AxisRangeFields';
import { AxisTitleFields } from './AxisTitleFields';
import { dualAxisRevert, dualAxisToggle } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

const AXIS = 'yAxis[1]';

interface DualYAxisTabProps extends TabProps {
  defaultTitle: string;
  /** The response's series (`vizKey`), in order: turning the axis on moves the second one onto it. */
  seriesKeys: readonly string[];
}

/** v1 `SeriesDualYAxisTab`: a second value axis on the right. Which series use it is set in the Display tab. */
export function DualYAxisTab({ viz, onChange, defaultTitle, seriesKeys }: DualYAxisTabProps) {
  const visible = boolAt(viz, `${AXIS}.visible`, false);
  const group = { viz, onChange, axis: AXIS, disabled: !visible };
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="On" value={visible} onChange={next => onChange(dualAxisToggle(next, seriesKeys))} />
      <AxisLabelFields {...group} />
      <AxisTitleFields {...group} defaultTitle={defaultTitle} />
      <AxisGridFields {...group} />
      <AxisRangeFields {...group} />
      <RevertButton onRevert={() => onChange({ ...dualAxisToggle(false, seriesKeys), ...dualAxisRevert(defaultTitle) })} />
    </div>
  );
}
