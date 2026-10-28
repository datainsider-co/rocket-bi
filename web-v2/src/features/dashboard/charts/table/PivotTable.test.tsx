import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import responses from '@/core/query/queryResponses.fixture.json';
import type { Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import { visualizationResponseFromJson, type JsonTableResponse, type VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import type { SubRowQuery } from '../../chart-data/useSubRowQuery';
import { PivotTable } from './PivotTable';
import { tableNumberFormat } from './table.utils';
import { tableLookOf } from './tableStyle.utils';

/** A real response: region down, sales channel across, total_revenue and units_sold in each cell (3 regions kept). */
const response = visualizationResponseFromJson(responses.pivot_table_chart_setting) as JsonTableResponse;

const column = (name: string, className = 'group') => ({ name, function: { class_name: className } });
const setting = {
  class_name: 'pivot_table_chart_setting',
  rows: [column('region'), column('country')],
  columns: [column('sales_channel')],
  values: [column('total_revenue', 'sum'), column('units_sold', 'sum')]
};

/** The rows under Asia, as the server answers the sub row query. */
const asiaRows: VisualizationResponse = { ...response, records: [{ '960db2': 'Japan', e1015b: '1000' }] };

function renderTable(subRows?: SubRowQuery) {
  const onSortChange = vi.fn<(sort: TableSort | undefined) => void>();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PivotTable
        response={response}
        setting={setting}
        options={{} as VizOptions}
        subRows={subRows}
        paging={{ from: 0, size: 20 }}
        loading={false}
        onPageChange={vi.fn<(paging: Paging) => void>()}
        onSortChange={onSortChange}
        numberFormat={tableNumberFormat({})}
        look={tableLookOf({})}
      />
    </QueryClientProvider>
  );
  return onSortChange;
}

describe('PivotTable', () => {
  it('shows the columns across over their values, and the totals', () => {
    renderTable();
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader', { name: 'total_revenue' })).toHaveLength(2);
    expect(screen.getByText('17,238,363.32')).toBeInTheDocument();
    const total = screen.getByText('Total').closest('tr');
    if (!total) throw new Error('no total row');
    expect(within(total).getByText('127,922,581.89')).toBeInTheDocument();
  });

  it('loads the rows under an expanded row', async () => {
    const subRows = vi.fn<SubRowQuery>(path => ({ queryKey: ['rows', ...path], queryFn: async () => asiaRows }));
    renderTable(subRows);
    const [expandAsia] = screen.getAllByRole('button', { name: 'Expand' });
    if (!expandAsia) throw new Error('no toggle');
    await userEvent.click(expandAsia);
    expect(await screen.findByText('Japan')).toBeInTheDocument();
    expect(subRows).toHaveBeenCalledWith(['Asia']);
  });

  it('sorts by the row group only', async () => {
    const onSortChange = renderTable();
    await userEvent.click(screen.getByRole('columnheader', { name: /region/ }));
    expect(onSortChange).toHaveBeenCalledWith({ column: 'region', direction: 'ASC' });
    onSortChange.mockClear();
    await userEvent.click(screen.getAllByRole('columnheader', { name: 'total_revenue' })[0]!);
    expect(onSortChange).not.toHaveBeenCalled();
  });
});
