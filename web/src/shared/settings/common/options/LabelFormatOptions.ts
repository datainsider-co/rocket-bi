import { SelectOption } from '@/shared';
import { DataLabelFormatterMode } from '@chart/PieChart';

export const LabelFormatOptions: SelectOption[] = [
  { displayName: 'Data value', id: DataLabelFormatterMode.NameAndValue },
  { displayName: 'Data percent', id: DataLabelFormatterMode.NameAndPercent },
  { displayName: 'Data', id: DataLabelFormatterMode.Name }
];
