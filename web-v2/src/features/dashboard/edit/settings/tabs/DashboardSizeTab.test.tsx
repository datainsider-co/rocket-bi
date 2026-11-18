import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JsonObject } from '@/core/json/json';
import { DashboardSizeTab } from './DashboardSizeTab';

const PERCENT: JsonObject = { size: { width: 100, width_unit: '%' } };
const PIXELS: JsonObject = { size: { width: 1200, width_unit: 'px' }, enable_freeze: false };

function renderTab(draft: JsonObject) {
  const onChange = vi.fn<(draft: JsonObject) => void>();
  render(<DashboardSizeTab draft={draft} onChange={onChange} />);
  return onChange;
}

describe('DashboardSizeTab', () => {
  it('shows an empty padding for a setting that stores none', () => {
    renderTab(PERCENT);
    expect(screen.getByLabelText('Dashboard padding')).toHaveValue('');
  });

  it('shows a stored padding, zero included', () => {
    renderTab({ ...PERCENT, padding: 0 });
    expect(screen.getByLabelText('Dashboard padding')).toHaveValue('0');
  });

  it('sets the padding, and removes it when the input is emptied', () => {
    const onChange = renderTab({ ...PERCENT, padding: 8 });
    const input = screen.getByLabelText('Dashboard padding');

    fireEvent.change(input, { target: { value: '12' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...PERCENT, padding: 12 });

    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(PERCENT);
  });

  it('offers Disable Responsive only for a width in pixels', () => {
    renderTab(PERCENT);
    expect(screen.queryByRole('switch', { name: 'Disable Responsive' })).not.toBeInTheDocument();
  });

  it('turns Disable Responsive on', async () => {
    const onChange = renderTab(PIXELS);
    const toggle = screen.getByRole('switch', { name: 'Disable Responsive' });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);

    expect(onChange).toHaveBeenLastCalledWith({ ...PIXELS, enable_freeze: true });
  });

  it('shows Disable Responsive as stored', () => {
    renderTab({ ...PIXELS, enable_freeze: true });
    expect(screen.getByRole('switch', { name: 'Disable Responsive' })).toBeChecked();
  });
});
