import { Button, Empty, Spin } from 'antd';
import { ChartRenderer } from '@/features/dashboard/charts/ChartRenderer';
import { FilterRenderer, isFilterViz } from '@/features/dashboard/charts/filter/FilterRenderer';
import type { PreviewState } from './usePreview';

interface PreviewViewProps {
  preview: PreviewState;
  dashboardId: number;
  themeColors: readonly string[];
}

const noSelection = { selected: [], onSelect: () => {}, onPointMenu: () => {} };

/** The chart as it will look (v1 `VizPanel`): a hint until the zones are filled, then the chart or its error. */
export function PreviewView({ preview, dashboardId, themeColors }: PreviewViewProps) {
  const { chart, viz, data } = preview;
  if (!chart) {
    return <Empty className="flex h-full flex-col items-center justify-center" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Drag and drop fields into the zones to build the chart" />;
  }
  if (data.isPending) return <Spin className="flex! h-full items-center justify-center" />;
  if (data.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="line-clamp-4 text-xs text-[var(--ant-color-error,#ff4d4f)]">{data.error.message}</div>
        <Button size="small" onClick={() => void data.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  if (isFilterViz(viz)) {
    return <FilterRenderer widget={chart} viz={viz} response={data.data} query={preview.query} dashboardId={dashboardId} entry={preview.filter.entry} onChange={preview.filter.onChange} />;
  }
  return <ChartRenderer widget={chart} viz={viz} response={data.data} themeColors={themeColors} table={preview.table} crossFilter={noSelection} />;
}
