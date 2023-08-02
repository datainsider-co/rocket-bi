import { DatabaseInfo, TableSchema } from '@core/common/domain';

export type DataSchemaModel = {
  database: DatabaseInfo;
  table?: TableSchema;
};
