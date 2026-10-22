import type { Meta, StoryObj } from '@storybook/react-vite';
import { HighchartsChart } from './HighchartsChart';

const meta = {
  title: 'Shared/HighchartsChart',
  component: HighchartsChart
} satisfies Meta<typeof HighchartsChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = {
  args: {
    options: {
      chart: { type: 'column' },
      title: { text: 'Revenue by month' },
      xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr'] },
      series: [{ type: 'column', name: 'Revenue', data: [12, 19, 7, 15] }]
    }
  }
};

export const Line: Story = {
  args: {
    height: 300,
    options: {
      title: { text: 'Active users' },
      xAxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      series: [{ type: 'line', name: 'Users', data: [120, 132, 101, 134, 190] }]
    }
  }
};
