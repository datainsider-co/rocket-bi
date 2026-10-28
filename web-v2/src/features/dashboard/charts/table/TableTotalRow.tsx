import { Table } from 'antd';

/** One cell of the total row: the label under the row header, the total under each value column. */
export interface TotalCell {
  key: string;
  text: string;
  isLabel: boolean;
}

/** A pivot table's total row, a cell per leaf column. */
export interface TableTotals {
  cells: readonly TotalCell[];
}

/** v1 pivot table's `tfoot`: the totals at the bottom of the table, kept in view while the rows scroll. */
export function TableTotalRow({ totals }: { totals: TableTotals }) {
  return (
    <Table.Summary>
      <Table.Summary.Row className="flatten-table__total">
        {totals.cells.map((cell, index) => (
          <Table.Summary.Cell key={cell.key} index={index} className={cell.isLabel ? 'flatten-table__total-label' : 'flatten-table__total-value'}>
            {cell.text}
          </Table.Summary.Cell>
        ))}
      </Table.Summary.Row>
    </Table.Summary>
  );
}
