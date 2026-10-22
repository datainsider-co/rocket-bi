import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighchartsChart } from './HighchartsChart';

describe('HighchartsChart', () => {
  it('renders the chart title', () => {
    render(<HighchartsChart options={{ title: { text: 'Revenue' }, series: [{ type: 'line', data: [1, 2, 3] }] }} />);

    expect(screen.getByTestId('highcharts-chart')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });
});
