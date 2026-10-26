import { useMemo, useState } from 'react';
import { Button, Spin } from 'antd';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { DEFAULT_PAGE_SIZE, isPagedSetting, type Paging } from '@/core/query/QueryRequest';
import { vizFromSetting } from '@/core/query/vizOptions';
import { ChartRenderer } from '../../charts/ChartRenderer';
import { useWidgetData } from '../../chart-data/useWidgetData';
import { chartTitle } from './chartWidget.utils';

interface ChartWidgetViewProps {
  widget: ChartWidget;
  dashboardId: number;
  themeColors: readonly string[];
}

const FIRST_PAGE: Paging = { from: 0, size: DEFAULT_PAGE_SIZE };

/** v1 `ChartHolder`: queries the chart, then loading, error with retry, or the chart (v1 `StatusWidget`). */
export function ChartWidgetView({ widget, dashboardId, themeColors }: ChartWidgetViewProps) {
  const [paging, setPaging] = useState<Paging>(FIRST_PAGE);
  const paged = isPagedSetting(widget.setting);
  const viz = useMemo(() => vizFromSetting(widget.setting), [widget.setting]);
  const query = useWidgetData(widget, { dashboardId, paging: paged ? paging : undefined });

  if (query.isPending) return <Spin className="flex! h-full items-center justify-center" />;
  if (query.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="truncate font-medium">{chartTitle(widget)}</div>
        <div className="line-clamp-3 text-xs" style={{ color: 'var(--secondary-text-color)' }}>
          {query.error.message}
        </div>
        <Button size="small" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  return (
    <ChartRenderer
      widget={widget}
      viz={viz}
      response={query.data}
      themeColors={themeColors}
      paging={paging}
      isUpdating={query.isFetching}
      onPageChange={setPaging}
    />
  );
}
