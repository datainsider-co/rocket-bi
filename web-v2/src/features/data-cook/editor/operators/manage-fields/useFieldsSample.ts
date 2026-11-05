import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { EtlId } from '@/core/data-cook/EtlJob';
import { expressionFieldToJson, fieldToJson, type ExpressionFieldConfiguration, type FieldConfiguration } from '@/core/data-cook/EtlOperator';
import { EtlPreviewService } from '@/core/data-cook/EtlPreviewService';
import { toQueryRequestJson } from '@/core/query/QueryRequest';
import { QueryService } from '@/core/query/QueryService';
import { rawQuerySetting } from '@/core/query/rawQuery';
import type { JsonTableResponse } from '@/core/query/VisualizationResponse';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { dataCookKeys } from '../../../dataCookQueries';
import { sampleRequest } from '../manageFields.utils';

/** v1 read six rows; five fit the dialog. */
export const SAMPLE_ROWS = 5;

export interface FieldsSample {
  /** The select the server makes of the fields (`view_query`). */
  readonly sql: string | undefined;
  readonly response: Pick<JsonTableResponse, 'headers' | 'records'> | undefined;
  readonly isFetching: boolean;
  readonly error: string | undefined;
  readonly retry: () => void;
}

/**
 * A few rows of the fields as they are set (v1 `ManageFields.loadData`): the server writes their select, which runs on
 * the preview database. Read again on every change of a name, a type or an expression.
 */
export function useFieldsSample(id: EtlId, fields: readonly FieldConfiguration[], extraFields: readonly ExpressionFieldConfiguration[]): FieldsSample {
  const preview = useDi(EtlPreviewService);
  const queries = useDi(QueryService);
  const request = useMemo(() => sampleRequest(fields, extraFields), [fields, extraFields]);
  const key = useMemo(() => ({ fields: request.fields.map(fieldToJson), extraFields: request.extraFields.map(expressionFieldToJson) }), [request]);
  const query = useQuery({
    queryKey: dataCookKeys.fieldsSample(id, key),
    queryFn: async ({ signal }) => {
      const sql = await preview.viewQuery(id, request.fields, request.extraFields, signal);
      const response = await queries.query(toQueryRequestJson({ setting: rawQuerySetting(sql, []), paging: { from: 0, size: SAMPLE_ROWS } }), signal);
      return { sql, response: response.kind === 'json_table' ? response : undefined };
    },
    placeholderData: keepPreviousData,
    // A failed sample is mostly an expression's fault; asking again only delays the message.
    retry: false
  });
  return {
    sql: query.data?.sql,
    response: query.data?.response,
    isFetching: query.isFetching,
    error: query.isError ? toErrorMessage(query.error) : undefined,
    retry: () => void query.refetch()
  };
}
