import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import type { DatabaseEntry } from '@/core/schema/DatabaseService';
import { PageHeader } from '@/shared/layout/PageHeader';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';
import type { DatabaseRowActions } from './databaseColumns';
import { DatabasesContent } from './DatabasesContent';
import type { DatabaseListing } from './useDatabaseListing';

const SECTION = getWarehouseSection(WarehouseSection.Databases);

interface DatabasesViewProps {
  listing: DatabaseListing;
  actions: DatabaseRowActions;
  onOpen: (entry: DatabaseEntry) => void;
}

/** v1 `DatabaseListing` (All Databases): search and Refresh in the header, then the table or why it is empty. */
export function DatabasesView({ listing, actions, onOpen }: DatabasesViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        icon={SECTION.icon}
        title={SECTION.title}
        actions={
          <>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search database"
              aria-label="Search database"
              className="w-60 max-sm:w-full"
              value={listing.searchText}
              onChange={event => listing.onSearchChange(event.target.value)}
            />
            <Button icon={<ReloadOutlined spin={listing.isFetching && listing.status === 'ready'} />} onClick={listing.refresh}>
              Refresh
            </Button>
          </>
        }
      />
      <DatabasesContent listing={listing} actions={actions} onOpen={onOpen} />
    </div>
  );
}
