import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import responses from '@/core/query/queryResponses.fixture.json';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import { visualizationResponseFromJson, type JsonTableResponse } from '@/core/query/VisualizationResponse';
import { CollapseTable } from './CollapseTable';
import { tableNumberFormat } from './table.utils';
import { tableLookOf } from './tableStyle.utils';

const response = visualizationResponseFromJson(responses.group_table_chart_setting) as JsonTableResponse;
const columns = [{ name: 'region' }, { name: 'country' }, { name: 'total_revenue' }, { name: 'units_sold' }];

function renderTable(onSortChange = vi.fn<(sort: TableSort | undefined) => void>()) {
  render(
    <CollapseTable
      response={response}
      columns={columns}
      paging={{ from: 0, size: 20 }}
      loading={false}
      onPageChange={vi.fn<(paging: Paging) => void>()}
      onSortChange={onSortChange}
      numberFormat={tableNumberFormat({})}
      look={tableLookOf({})}
    />
  );
  return onSortChange;
}

describe('CollapseTable', () => {
  it('shows the top groups, and a group expands into the next one and collapses again', async () => {
    renderTable();
    expect(screen.getByText('Asia')).toBeInTheDocument();
    expect(screen.queryByText('Bangladesh')).not.toBeInTheDocument();
    const [expandAsia] = screen.getAllByRole('button', { name: 'Expand' });
    if (!expandAsia) throw new Error('no toggle');
    await userEvent.click(expandAsia);
    expect(screen.getByText('Bangladesh')).toBeInTheDocument();
    expect(screen.getByText('1,948,296.96')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByText('Bangladesh')).not.toBeInTheDocument();
  });

  it("sorts by the column a header shows, not by the header's label", async () => {
    const onSortChange = renderTable();
    await userEvent.click(screen.getByText('total_revenue by region'));
    expect(onSortChange).toHaveBeenCalledWith({ column: 'total_revenue', direction: 'ASC' });
  });
});
