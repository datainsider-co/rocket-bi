import { boolAt } from '../vizValue.utils';
import { RevertButton } from '../fields/RevertButton';
import { ToggleSetting } from '../fields/ToggleSetting';
import { AxisLabelFields } from './AxisLabelFields';
import { AxisTitleFields } from './AxisTitleFields';
import { xAxisRevert } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

const AXIS = 'xAxis[0]';

/** v1 `XAxisTab`. Its gridlines were for scatter and bubble charts only. */
export function XAxisTab({ viz, onChange, defaultTitle }: TabProps & { defaultTitle: string }) {
  const visible = boolAt(viz, `${AXIS}.visible`, true);
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="On" value={visible} onChange={next => onChange({ [`${AXIS}.visible`]: next })} />
      <AxisLabelFields viz={viz} onChange={onChange} axis={AXIS} disabled={!visible} />
      <AxisTitleFields viz={viz} onChange={onChange} axis={AXIS} disabled={!visible} defaultTitle={defaultTitle} />
      <RevertButton onRevert={() => onChange(xAxisRevert(defaultTitle))} />
    </div>
  );
}
