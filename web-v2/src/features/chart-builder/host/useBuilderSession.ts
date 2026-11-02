import { useMemo, useState } from 'react';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { pickerItemsOf } from '@/core/chart-builder/chartCatalogue';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { asRecord } from '@/core/json/json';
import { SchemaService } from '@/core/schema/SchemaService';
import type { AdhocSource, ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import { adhocQueryOf, adhocSourceOf, builderControlsOf, builderStartOf, editedJsonOf, pickerKindOf } from './builderSession.utils';

/**
 * The table of an ad hoc view (`databases/adhoc/tables` on its SQL with the values in), named by the view. A host can
 * load it before opening the builder, to tell the user when the query can't make one.
 */
export function adhocTableQueryOptions(service: SchemaService, { view, parameters }: AdhocSource) {
  const query = adhocQueryOf(view, parameters);
  return queryOptions({
    queryKey: ['chart-builder', 'adhoc-table', view.name, query],
    queryFn: async ({ signal }) => ({ ...(await service.detectTableSchema(query, signal)), name: view.name }),
    retry: false
  });
}

/**
 * What a builder opens with (v1 `DashboardDetail` + `ChartBuilderComponent`): a type picked first for a new chart,
 * the dashboard's controls, and for an ad hoc chart its view's table (v1 `AdhocBuilderConfig`). When that table
 * can't be read the builder opens on the databases, as v1 did.
 */
export function useBuilderSession(request: ChartBuilderRequest, dashboard: Dashboard) {
  const service = useDi(SchemaService);
  const [picked, setPicked] = useState<string>();
  const pickerKind = pickerKindOf(request);
  const setting = useMemo(() => asRecord(editedJsonOf(request)?.['setting']), [request]);
  const source = useMemo(() => adhocSourceOf(request, setting), [request, setting]);
  const view = source?.view;
  const adhoc = useQuery({ ...adhocTableQueryOptions(service, source ?? { view: { name: '', query: '' }, parameters: {} }), enabled: source !== undefined });
  const controls = useMemo(() => builderControlsOf(request, dashboard), [request, dashboard]);
  const sqlQueryOf = useMemo(() => view && ((name: string) => (name === view.name ? view.query : undefined)), [view]);

  return {
    /** The picker's choices while a new chart has no type yet. */
    picker: pickerKind && picked === undefined ? pickerItemsOf(pickerKind) : undefined,
    pick: setPicked,
    loading: source !== undefined && adhoc.isPending,
    start: builderStartOf(request, picked ?? ''),
    controls,
    sqlQueryOf,
    adhocTable: adhoc.data
  };
}
