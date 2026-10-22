import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';

/**
 * The package ships CommonJS only (`module.exports = { HighchartsReact, default }`). Vite's pre-bundle hands that whole
 * object to a default import, while Vitest unwraps it to the component, so pick the component from either shape.
 */
const HighchartsReact =
  (HighchartsReactModule as unknown as { HighchartsReact?: typeof HighchartsReactModule }).HighchartsReact ??
  HighchartsReactModule;

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
