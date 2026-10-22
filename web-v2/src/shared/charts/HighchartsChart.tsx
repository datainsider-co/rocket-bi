import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

export interface HighchartsChartProps {
  options: Highcharts.Options;
  height?: number | string;
}

export function HighchartsChart({ options, height = 400 }: HighchartsChartProps) {
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={{ credits: { enabled: false }, ...options, chart: { height, ...options.chart } }}
      containerProps={{ 'data-testid': 'highcharts-chart' }}
    />
  );
}
