import { ToggleSetting } from '../fields/ToggleSetting';
import { stackChanges, stackingOf } from './seriesTabs.utils';
import type { TabProps } from './tabProps';

/** v1 `SeriesGeneralTab`, areas only: stacked, and as a percentage. */
export function StackTab({ viz, onChange }: TabProps) {
  const stacking = stackingOf(viz);
  return (
    <div className="flex flex-col gap-3">
      <ToggleSetting label="Stack" value={stacking !== 'none'} onChange={enabled => onChange(stackChanges(enabled ? 'value' : 'none'))} />
      <ToggleSetting label="Percentage" disabled={stacking === 'none'} value={stacking === 'percent'} onChange={enabled => onChange(stackChanges(enabled ? 'percent' : 'value'))} />
    </div>
  );
}
