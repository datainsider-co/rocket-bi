import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { asString, getPath, type JsonObject } from '@/core/json/json';
import { SchemaService } from '@/core/schema/SchemaService';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import type { DrillChoices } from './chartMenus.utils';
import { drillFields } from './chartView.utils';

/**
 * The fields a chart can drill into, from its table's schema, loaded once the point menu opens (v1 fetched the
 * database on demand too). Ad hoc tables (SQL views, no database) have none: v1 parsed their SQL for a schema.
 */
export function useDrillFields(setting: JsonObject, column: JsonObject | undefined, enabled: boolean): DrillChoices {
  const service = useDi(SchemaService);
  const dbName = asString(getPath(column, ['function', 'field', 'db_name']));
  const schema = useQuery({ ...databaseQueryOptions(service, dbName), enabled: enabled && dbName !== '' });
  return { fields: drillFields(schema.data, setting, column), loading: schema.isLoading };
}
