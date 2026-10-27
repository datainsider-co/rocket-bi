import type { TabProps } from './tabProps';

/** A group of an axis' settings; `axis` is its lodash path (`xAxis[0]`, `yAxis[1]`). */
export interface AxisFieldProps extends TabProps {
  axis: string;
  disabled: boolean;
}
