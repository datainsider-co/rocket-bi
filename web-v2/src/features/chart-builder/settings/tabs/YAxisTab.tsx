import { boolAt } from '../vizValue.utils';
import { RevertButton } from '@/shared/settings/fields/RevertButton';
import { ToggleSetting } from '@/shared/settings/fields/ToggleSetting';
import { AxisGridFields } from './AxisGridFields';
import { AxisLabelFields } from './AxisLabelFields';
import { AxisRangeFields } from './AxisRangeFields';
import { AxisTitleFields } from './AxisTitleFields';
import { yAxisRevert, yAxisToggle } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

const AXIS = 'yAxis[0]';

interface YAxisTabProps extends TabProps {
  defaultTitle: string;
  /** The min / max fields; v1's circular bar has none. */
  range?: boolean;
  /** The axis title's fields; v1's wind rose has none. */
  title?: boolean;
}

/** v1 `SeriesYAxisTab`: the main value axis. */
export function YAxisTab({ viz, onChange, defaultTitle, range = true, title = true }: YAxisTabProps) {
  const visible = boolAt(viz, `${AXIS}.visible`, true);
  const group = { viz, onChange, axis: AXIS, disabled: !visible };
  return (
    <div className="settings-stack">
      <ToggleSetting label="On" value={visible} onChange={next => onChange(yAxisToggle(next))} />
      <AxisLabelFields {...group} />
      {title && <AxisTitleFields {...group} defaultTitle={defaultTitle} />}
      <AxisGridFields {...group} />
      {range && <AxisRangeFields {...group} />}
      <RevertButton onRevert={() => onChange(yAxisRevert(defaultTitle))} />
    </div>
  );
}
