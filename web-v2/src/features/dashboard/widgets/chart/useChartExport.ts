import { useCallback } from 'react';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { toQueryRequestJson } from '@/core/query/QueryRequest';
import { QueryService, type ExportType } from '@/core/query/QueryService';
import { saveBlob } from '@/shared/download/saveBlob';
import type { ChartQuery } from '../../controls/chartQuery.utils';
import { chartTitle } from './chartWidget.utils';
import { exportFileName } from './chartView.utils';

const ALL_ROWS = { from: -1, size: -1 };

/** Download CSV / Excel (v1 `DashboardControllerStore.handleExport`): every row of what the chart shows. */
export function useChartExport(widget: ChartWidget, dashboardId: number, query: ChartQuery) {
  const service = useDi(QueryService);
  const { message } = App.useApp();

  return useCallback(
    async (type: ExportType) => {
      const request = toQueryRequestJson({ ...query, paging: ALL_ROWS, dashboardId, chartId: widget.id });
      const done = message.loading(`Exporting ${type === 'csv' ? 'CSV' : 'Excel'} file...`, 0);
      try {
        saveBlob(await service.export(request, type), `${exportFileName(widget.name || chartTitle(widget))}.${type}`);
      } catch (error) {
        void message.error(`Export ${type === 'csv' ? 'CSV' : 'Excel'} error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        done();
      }
    },
    [service, message, query, dashboardId, widget]
  );
}
