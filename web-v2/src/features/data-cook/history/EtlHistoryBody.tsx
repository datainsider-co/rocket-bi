import { Button, Empty, Result } from 'antd';
import type { DataCookSectionConfig } from '../dataCook.utils';
import { emptyHistoryText } from './etlHistory.utils';
import { EtlHistoryTable } from './EtlHistoryTable';
import type { EtlHistoryState } from './useEtlHistory';

/** The runs, or what stands in for them: the load error with Retry, or the empty state (v1 `LayoutNoData`). */
export function EtlHistoryBody({ section, state: { table, handlers } }: { section: DataCookSectionConfig; state: EtlHistoryState }) {
  if (table.error !== undefined) {
    return (
      <Result
        status="error"
        title="Could not load the ETL history"
        subTitle={table.error}
        extra={
          <Button type="primary" onClick={handlers.onRefresh}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!table.isLoading && table.runs.length === 0) {
    return <Empty className="py-16" image={<i className={`${section.icon} text-5xl`} />} description={emptyHistoryText(table.keyword)} />;
  }
  return <EtlHistoryTable table={table} handlers={handlers} />;
}
