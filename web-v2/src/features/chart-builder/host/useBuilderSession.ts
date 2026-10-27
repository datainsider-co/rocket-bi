import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { pickerItemsOf } from '@/core/chart-builder/chartCatalogue';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import { asRecord } from '@/core/json/json';
import { SchemaService } from '@/core/schema/SchemaService';
import type { ChartBuilderRequest } from '@/features/dashboard/edit/chartBuilderBridge';
import { adhocQueryOf, adhocViewOf, builderControlsOf, builderStartOf, editedJsonOf, pickerKindOf } from './builderSession.utils';

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
  const view = useMemo(() => adhocViewOf(setting), [setting]);
  const adhoc = useQuery({
    queryKey: ['chart-builder', 'adhoc-table', view?.name, view && adhocQueryOf(view, setting)],
    queryFn: async ({ signal }) => {
      if (!view) throw new Error('no ad hoc view');
      return { ...(await service.detectTableSchema(adhocQueryOf(view, setting), signal)), name: view.name };
    },
    enabled: view !== undefined,
    retry: false
  });
  const controls = useMemo(() => builderControlsOf(request, dashboard), [request, dashboard]);
  const sqlQueryOf = useMemo(() => view && ((name: string) => (name === view.name ? view.query : undefined)), [view]);

  return {
    /** The picker's choices while a new chart has no type yet. */
    picker: pickerKind && picked === undefined ? pickerItemsOf(pickerKind) : undefined,
    pick: setPicked,
    loading: view !== undefined && adhoc.isPending,
    start: builderStartOf(request, picked ?? ''),
    controls,
    sqlQueryOf,
    adhocTable: adhoc.data
  };
}
