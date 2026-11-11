import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { DashboardStoryFrame } from '../../theme/DashboardStoryFrame';
import { buildKpi } from './kpi.utils';
import { KpiDateRangeView } from './KpiDateRangeView';
import { KpiView } from './KpiView';

const TREND = [12, 18, 15, 24, 21, 30, 27, 36, 33, 41, 38, 46];

interface PlaygroundProps {
  theme: '' | 'style_1' | 'style_area_1';
  compareStyle: 'default' | 'percentage' | 'number' | 'text';
  comparison: boolean;
  trendLine: boolean;
  /** The compared period was higher than this one. */
  decrease: boolean;
}

/** The card's KPI built from options the way a stored chart's are, with a compared value and a trend line at hand. */
function Playground({ theme, compareStyle, comparison, trendLine, decrease }: PlaygroundProps) {
  const options = {
    theme,
    title: { text: 'Total revenue', align: 'center', style: { fontSize: '20px' } },
    prefix: { enabled: true, text: '$' },
    style: { fontSize: '42px', fontWeight: '600' },
    icon: { enabled: theme !== '', iconClass: 'setting-icon-wallet-money-bold', color: '#BEE2CA', background: '#11152D' },
    dataRange: { enabled: comparison || trendLine },
    comparison: { enabled: comparison, compareStyle },
    trendLine: { enabled: trendLine, color: '#007126' }
  } as VizOptions;
  const response: SeriesOneResponse = { kind: 'series_one', series: [{ name: 'Total revenue', data: [2091134.49] }], xAxis: [], yAxis: [], compareValue: decrease ? 2923450.18 : 1495230.5 };
  const dateRange = (comparison || trendLine) && theme === '' && <KpiDateRangeView label="Jan 1, 2015 - Dec 31, 2016" open={false} onOpenChange={() => {}} />;
  return (
    // The card: positioned, since the layouts without theme cover it over its padding.
    <div style={{ position: 'relative', width: 643, height: 336, borderRadius: 20, background: 'var(--chart-background-color)', boxShadow: '0 2px 4px #0000001a' }}>
      <div style={{ position: 'absolute', inset: 0, padding: 15 }}>
        <KpiView kpi={buildKpi(options, response, TREND)} dateRange={dateRange} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Dashboard/Charts/KpiView',
  component: Playground,
  args: { theme: '', compareStyle: 'default', comparison: true, trendLine: false, decrease: false },
  argTypes: {
    theme: { control: 'inline-radio', options: ['', 'style_1', 'style_area_1'] },
    compareStyle: { control: 'inline-radio', options: ['default', 'percentage', 'number', 'text'] }
  },
  decorators: [
    Story => (
      <DashboardStoryFrame style={{ padding: 24 }}>
        <Story />
      </DashboardStoryFrame>
    )
  ]
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = { args: { comparison: false } };

export const Comparison: Story = {};

export const ComparisonAsText: Story = { args: { compareStyle: 'text', decrease: true } };

export const ComparisonAsPercentage: Story = { args: { compareStyle: 'percentage' } };

export const ComparisonAsNumber: Story = { args: { compareStyle: 'number' } };

export const TrendLine: Story = { args: { trendLine: true, decrease: true } };

export const Themed: Story = { args: { theme: 'style_1' } };

export const ThemedTrendLine: Story = { args: { theme: 'style_1', trendLine: true } };

export const Area: Story = { args: { theme: 'style_area_1', trendLine: true } };
