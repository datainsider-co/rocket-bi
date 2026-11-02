import { Button, Empty, Result } from 'antd';
import { Link } from 'react-router';
import { NEW_ETL_PATH } from '../dataCook.utils';
import { emptyEtlText } from './etlListing.utils';
import { EtlTable } from './EtlTable';
import type { EtlTableData, EtlTableHandlers } from './useEtlListing';
import type { EtlRowActions } from './useEtlListingPage';

interface EtlListingBodyProps {
  icon: string;
  table: EtlTableData;
  handlers: EtlTableHandlers;
  actions: EtlRowActions;
}

/** The table, or what stands in for it: the load error with Retry, or the empty state (v1 `LayoutNoData`). */
export function EtlListingBody({ icon, table, handlers, actions }: EtlListingBodyProps) {
  if (table.error !== undefined) {
    return (
      <Result
        status="error"
        title="Could not load ETLs"
        subTitle={table.error}
        extra={
          <Button type="primary" onClick={handlers.onRefresh}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!table.isLoading && table.etls.length === 0) {
    const offerNew = table.listing === 'mine' && table.keyword.trim() === '';
    return (
      <Empty className="py-16" image={<i className={`${icon} text-5xl`} />} description={offerNew ? null : emptyEtlText(table.listing, table.keyword)}>
        {offerNew && (
          <span>
            Add your first <Link to={NEW_ETL_PATH} className="font-medium">ETL</Link>
          </span>
        )}
      </Empty>
    );
  }

  return <EtlTable table={table} handlers={handlers} actions={actions} />;
}
