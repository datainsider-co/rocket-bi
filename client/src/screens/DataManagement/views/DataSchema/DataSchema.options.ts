import { SelectOption } from '@/shared';
import { ColumnType } from '@core/domain';

export const ColumnTypeOptions: SelectOption[] = [
  // {
  //   id: ColumnType.array,
  //   displayName: 'Array'
  // },
  {
    id: ColumnType.bool,
    displayName: 'Bool'
  },
  {
    id: ColumnType.date,
    displayName: 'Date'
  },
  {
    id: ColumnType.datetime,
    displayName: 'Datetime'
  },
  {
    id: ColumnType.datetime64,
    displayName: 'Datetime64'
  },
  {
    id: ColumnType.double,
    displayName: 'Double'
  },
  {
    id: ColumnType.float,
    displayName: 'Float'
  },
  {
    id: ColumnType.int8,
    displayName: 'Int8'
  },
  {
    id: ColumnType.int16,
    displayName: 'int16'
  },
  {
    id: ColumnType.int32,
    displayName: 'Int32'
  },
  {
    id: ColumnType.int64,
    displayName: 'Int64'
  },
  // {
  //   id: ColumnType.nested,
  //   displayName: 'Nested'
  // },
  {
    id: ColumnType.string,
    displayName: 'String'
  },
  {
    id: ColumnType.uint8,
    displayName: 'Uint8'
  },
  {
    id: ColumnType.uint16,
    displayName: 'Uint16'
  },
  {
    id: ColumnType.uint32,
    displayName: 'Uint32'
  },
  {
    id: ColumnType.uint64,
    displayName: 'Uint64'
  }
];

export const BoolOptions: SelectOption[] = [
  {
    id: true,
    displayName: 'True'
  },
  {
    id: false,
    displayName: 'False'
  }
];
