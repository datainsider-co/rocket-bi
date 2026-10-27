import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { tabFilterLook } from './filterStyle.utils';
import { TabFilterView } from './TabFilterView';

const options = [
  { label: 'Offline', value: 'Offline' },
  { label: 'Online', value: 'Online' }
];

describe('TabFilterView', () => {
  it('shows tabs with All first, the picked one pressed', async () => {
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<TabFilterView title="Channel" look={tabFilterLook({})} options={options} selected={['Online']} mode="filter" onChange={onChange} />);

    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['All', 'Offline', 'Online']);
    expect(screen.getByRole('button', { name: 'Online' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Offline' }));
    expect(onChange).toHaveBeenCalledWith(['Offline']);
    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('checks values in multi choice and searches them', async () => {
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<TabFilterView look={tabFilterLook({ displayAs: 'multi_choice' })} options={options} selected={[]} mode="filter" onChange={onChange} />);

    expect(screen.getByRole('checkbox', { name: 'All' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Offline' })).not.toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Offline' }));
    expect(onChange).toHaveBeenCalledWith(['Offline']);

    await userEvent.type(screen.getByPlaceholderText('Search...'), 'onl');
    expect(screen.queryByRole('checkbox', { name: 'Offline' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Online' })).toBeInTheDocument();
  });

  it('picks one column of a tab control as radios, without All or search box', async () => {
    const onChange = vi.fn<(selected: string[]) => void>();
    render(
      <TabFilterView
        look={tabFilterLook({ displayAs: 'single_choice', search: { enabled: false } })}
        options={options}
        selected={['Offline']}
        mode="function"
        onChange={onChange}
      />
    );

    expect(screen.queryByRole('radio', { name: 'All' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Offline' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Online' }));
    expect(onChange).toHaveBeenCalledWith(['Online']);
  });
});
