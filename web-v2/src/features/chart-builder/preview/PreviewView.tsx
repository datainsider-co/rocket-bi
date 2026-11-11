import type { ReactNode } from 'react';
import { ChartRenderer } from '@/features/dashboard/charts/ChartRenderer';
import { FilterRenderer, isFilterViz } from '@/features/dashboard/charts/filter/FilterRenderer';
import { ErrorState } from '@/shared/status/ErrorState';
import { Loading } from '@/shared/status/Loading';
import { PreviewCardView, type PreviewCard } from './PreviewCardView';
import type { PreviewState } from './usePreview';
import './Preview.css';

interface PreviewViewProps {
  preview: PreviewState;
  dashboardId: number;
  themeColors: readonly string[];
  /** The builder's card around the chart; without it the chart fills its box (the query editor's chart tab). */
  card?: PreviewCard;
  /** Shown until the zones build a chart (the builder's `PreviewHintView`). */
  hint?: ReactNode;
}

const noSelection = { selected: [], onSelect: () => {}, onPointMenu: () => {} };

/**
 * The chart as it will look (v1 `PreviewPanel`): a hint until the zones are filled, v1's spinner and error while it
 * loads or fails, then the chart on its card.
 */
export function PreviewView({ preview, dashboardId, themeColors, card, hint }: PreviewViewProps) {
  const { chart, viz, data } = preview;
  if (!chart) return hint ?? null;
  if (data.isPending) {
    return (
      <div className="chart-preview__status">
        <Loading />
      </div>
    );
  }
  if (data.isError) {
    return (
      <div className="chart-preview__status">
        <ErrorState message={data.error.message} onRetry={() => void data.refetch()} />
      </div>
    );
  }
  const rendered = isFilterViz(viz) ? (
    <FilterRenderer widget={chart} viz={viz} response={data.data} query={preview.query} dashboardId={dashboardId} entry={preview.filter.entry} onChange={preview.filter.onChange} />
  ) : (
    <ChartRenderer widget={chart} viz={viz} response={data.data} themeColors={themeColors} table={preview.table} crossFilter={noSelection} kpi={preview.kpi} />
  );
  if (!card) return rendered;
  return (
    <PreviewCardView chart={chart} {...card}>
      {rendered}
    </PreviewCardView>
  );
}
