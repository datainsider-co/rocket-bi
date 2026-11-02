import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { DashboardService } from '@/core/dashboard/DashboardService';
import { widgetFromJson, type ChartWidget } from '@/core/dashboard/Widget';
import { asRecord } from '@/core/json/json';
import type { QueryParameter } from '@/core/query/queryParameters';
import { parameterValues, runnableSql, syncParameters } from '@/core/query/rawQuery';
import { SchemaService } from '@/core/schema/SchemaService';
import { adhocTableQueryOptions } from '@/features/chart-builder/host/useBuilderSession';
import type { ChartBuilderRequest, ChartSaver } from '@/features/dashboard/edit/chartBuilderBridge';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { aliasOf, newViewAlias, nextTempId, tabLabel, tabWidgetJson, withQuery, type AnalysisTab } from './analysis.utils';
import type { TabsAction } from './analysisTabs';

interface BuilderSession {
  readonly request: ChartBuilderRequest;
  /** The SQL the chart reads and its parameter definitions, as they were when the builder opened. */
  readonly sql: string;
  readonly parameters: readonly QueryParameter[];
  /** The chart tab being edited; none for a new chart. */
  readonly tab?: AnalysisTab;
}

export interface AnalysisCharts {
  readonly builder: { readonly request: ChartBuilderRequest; readonly saver: ChartSaver; readonly onClose: () => void } | undefined;
  /** Add Chart on the tab's SQL, read with the values on the bar (v1 `handleNewChart`). */
  readonly onAdd: (tab: AnalysisTab, current: readonly QueryParameter[]) => void;
  readonly adding: boolean;
  readonly onEdit: (tab: AnalysisTab) => void;
  readonly onDelete: (tab: AnalysisTab) => void;
}

/**
 * The charts made on the query (v1 ad hoc charts), through ChartBuilder on the query's table. A saved analysis keeps
 * them on the server at once, as v1 did; a new query keeps them until it is saved.
 */
export function useAnalysisCharts(tabs: readonly AnalysisTab[], analysisId: number | undefined, dispatch: (action: TabsAction) => void): AnalysisCharts {
  const dashboards = useDi(DashboardService);
  const schemas = useDi(SchemaService);
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [session, setSession] = useState<BuilderSession>();
  const [adding, setAdding] = useState(false);

  const saver = useMemo((): ChartSaver | undefined => {
    if (!session) return undefined;
    const { sql, parameters, tab } = session;
    // A saved analysis keeps the chart, with the SQL it reads, on the server at once.
    const saved = analysisId === undefined ? undefined : { sql, parameters };
    return {
      async createWidget(json, position) {
        const alias = aliasOf(asRecord(json['setting']));
        const full = withQuery(json, sql, parameters, alias);
        const created = analysisId === undefined ? widgetFromJson({ ...full, id: nextTempId(tabs) }) : await dashboards.createWidget(analysisId, full, position);
        dispatch({ type: 'add', tab: { id: created.id, kind: 'chart', widget: created.json, alias, sql, parameters, run: undefined, saved } });
        return created;
      },
      async updateWidget(json) {
        if (!tab) throw new Error('No chart is being edited');
        const full = withQuery(json, sql, parameters, tab.alias);
        if (analysisId !== undefined) await dashboards.editWidget(analysisId, full);
        dispatch({ type: 'replace', id: tab.id, tab: { ...tab, widget: full, saved: saved ?? tab.saved } });
        return widgetFromJson(full);
      }
    };
  }, [session, analysisId, tabs, dashboards, dispatch]);

  const onAdd = async (tab: AnalysisTab, current: readonly QueryParameter[]) => {
    const sql = runnableSql(tab.sql);
    const adhoc = { view: { name: newViewAlias(Math.random), query: sql }, parameters: parameterValues(current) };
    setAdding(true);
    try {
      // The query must make a table before there is anything to build on.
      await queryClient.fetchQuery(adhocTableQueryOptions(schemas, adhoc));
      setSession({ request: { kind: 'addChart', adhoc }, sql, parameters: syncParameters(tab.sql, tab.parameters) });
    } catch (error) {
      void message.error(`Can't add a chart on this query: ${toErrorMessage(error)}`);
    } finally {
      setAdding(false);
    }
  };
  const onEdit = (tab: AnalysisTab) => {
    const parameters = syncParameters(tab.sql, tab.parameters);
    const chart = widgetFromJson(tabWidgetJson(tab)) as ChartWidget;
    setSession({ request: { kind: 'configChart', chart }, sql: tab.sql, parameters, tab });
  };
  const onDelete = (tab: AnalysisTab) => {
    modal.confirm({
      title: 'Delete chart',
      content: `Are you sure that you want to delete "${tabLabel(tab)}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          if (analysisId !== undefined) await dashboards.deleteWidget(analysisId, tab.id);
          dispatch({ type: 'remove', id: tab.id });
        } catch (error) {
          void message.error(`Delete chart failed: ${toErrorMessage(error)}`);
        }
      }
    });
  };

  return {
    builder: session && saver && { request: session.request, saver, onClose: () => setSession(undefined) },
    onAdd: (tab, current) => void onAdd(tab, current),
    adding,
    onEdit,
    onDelete
  };
}
