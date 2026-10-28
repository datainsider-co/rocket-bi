import { boolAt } from '../vizValue.utils';
import { RevertButton } from '../fields/RevertButton';
import { ToggleSetting } from '../fields/ToggleSetting';
import { AxisGridFields } from './AxisGridFields';
import { AxisLabelFields } from './AxisLabelFields';
import { AxisTitleFields } from './AxisTitleFields';
import { AXIS_DEFAULTS, xAxisRevert } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

const AXIS = 'xAxis[0]';

interface XAxisTabProps extends TabProps {
  defaultTitle: string;
  /** The gridlines, on by default when shown (v1: scatter, bubble and the circular bar). */
  grid?: boolean;
}

/** v1 `XAxisTab`. */
export function XAxisTab({ viz, onChange, defaultTitle, grid = false }: XAxisTabProps) {
  const visible = boolAt(viz, `${AXIS}.visible`, true);
  const group = { viz, onChange, axis: AXIS, disabled: !visible };
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="On" value={visible} onChange={next => onChange({ [`${AXIS}.visible`]: next })} />
      <AxisLabelFields {...group} />
      <AxisTitleFields {...group} defaultTitle={defaultTitle} />
      {grid && <AxisGridFields {...group} />}
      <RevertButton onRevert={() => onChange(xAxisRevert(defaultTitle, grid ? AXIS_DEFAULTS.gridLineWidth : '0'))} />
    </div>
  );
}
