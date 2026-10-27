import { isDateType, isNumberType } from '@/core/schema/fieldTypes';

export const ColumnKind = {
  Date: 'date',
  Number: 'number',
  Text: 'text'
} as const;

export type ColumnKind = (typeof ColumnKind)[keyof typeof ColumnKind];

/** Which icon a column type gets (v1 `IconUtils.getSVGIconByColumnType`): anything unknown shows as text. */
export function columnKind(type: string): ColumnKind {
  if (isDateType(type)) return ColumnKind.Date;
  if (isNumberType(type)) return ColumnKind.Number;
  return ColumnKind.Text;
}
