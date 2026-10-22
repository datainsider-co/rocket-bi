import { Card } from 'antd';
import { HighchartsChart } from '@/shared/charts/HighchartsChart';

export function HomePage() {
  return (
    <Card title="web-v2 is running">
      <HighchartsChart
        options={{
          chart: { type: 'column' },
          title: { text: 'Sample chart' },
          xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr'] },
          series: [{ type: 'column', name: 'Revenue', data: [12, 19, 7, 15] }]
        }}
      />
    </Card>
  );
}
