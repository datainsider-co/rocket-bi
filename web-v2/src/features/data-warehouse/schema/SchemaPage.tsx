import { useMemo, useState } from 'react';
import { databaseShare, type ShareRequest } from '@/features/share/share.utils';
import { ShareModal } from '@/features/share/ShareModal';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DatabaseTree } from '../database-tree/DatabaseTree';
import type { TreeHandlers } from '../database-tree/databaseTree.utils';
import { WarehouseSplitLayout } from '../layout/WarehouseSplitLayout';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';
import { SchemaContent } from './SchemaContent';
import { useDeleteTable } from './useDeleteTable';
import { useSchemaSelection } from './useSchemaSelection';

const SECTION = getWarehouseSection(WarehouseSection.Schema);
const TABLE_MENU = [{ key: 'delete', label: 'Delete table', danger: true }];

/** `/data-warehouse/schema` (v1 `DataSchema.vue`): the database tree beside the selected database or table. */
export function SchemaPage() {
  const { selection, isLoading, select } = useSchemaSelection();
  const deleteTable = useDeleteTable(table => select({ dbName: table.dbName, tableName: undefined }));
  const [share, setShare] = useState<ShareRequest>();
  const handlers = useMemo<TreeHandlers>(
    () => ({
      onSelectDatabase: dbName => select({ dbName, tableName: undefined }),
      onSelectTable: table => select({ dbName: table.dbName, tableName: table.name }),
      tableActionsOf: () => TABLE_MENU,
      onTableAction: table => deleteTable({ dbName: table.dbName, name: table.name, displayName: table.title })
    }),
    [select, deleteTable]
  );
  const openShare = (dbName: string) => setShare(databaseShare({ name: dbName, displayName: dbName, owner: undefined, creatorId: '' }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader icon={SECTION.icon} title={SECTION.title} />
      <WarehouseSplitLayout tree={<DatabaseTree selection={selection} handlers={handlers} />}>
        <SchemaContent selection={selection} isLoading={isLoading} onSelect={select} onShareDatabase={openShare} />
      </WarehouseSplitLayout>
      {share && <ShareModal open {...share} onClose={() => setShare(undefined)} onShared={() => setShare(undefined)} />}
    </div>
  );
}
