import { DatabaseSchema, TableSchema } from '@core/domain';

export type DataSchemaModel = {
  database: DatabaseSchema;
  table?: TableSchema;
};
