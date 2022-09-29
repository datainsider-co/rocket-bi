import { SelectOption } from '@/shared';
import { MetricNumberMode } from '@/utils';

export const DisplayUnitOptions: SelectOption[] = [
  {
    displayName: 'Default',
    id: MetricNumberMode.Default
  },
  {
    displayName: 'None',
    id: MetricNumberMode.None
  },
  {
    displayName: 'Mass',
    id: MetricNumberMode.Mass
  },
  {
    displayName: 'Million',
    id: MetricNumberMode.Text
  }
  // {
  //   displayName: 'Percentage',
  //   id: MetricNumberMode.Percentage
  // }
];
