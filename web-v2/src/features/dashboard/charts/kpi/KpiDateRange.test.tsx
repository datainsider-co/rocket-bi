import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DateRangeChoice } from '@/core/query/comparison';
import { DateMode } from '@/core/query/dateRanges';
import { KpiDateRange } from './KpiDateRange';

const range = [new Date(2026, 1, 3), new Date(2026, 2, 4)] as const;

describe('KpiDateRange', () => {
  it('only shows the range without a change handler', () => {
    render(<KpiDateRange value={{ mode: DateMode.Custom, range }} />);
    expect(screen.getByText('Feb 3, 2026 - Mar 4, 2026')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens the date range popover and applies the range picked', async () => {
    const onChange = vi.fn<(choice: DateRangeChoice) => void>();
    render(<KpiDateRange value={{ mode: DateMode.Custom, range }} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Date range: Feb 3, 2026 - Mar 4, 2026' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ mode: DateMode.Custom, range });
  });
});
