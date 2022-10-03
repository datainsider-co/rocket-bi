import { DatabaseSchema, TableSchema } from '@core/common/domain';

export type DataSchemaModel = {
  database: DatabaseSchema;
  table?: TableSchema;
};
