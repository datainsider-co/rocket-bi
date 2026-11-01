import { PageHeader } from '@/shared/layout/PageHeader';
import { DatabaseTree } from '../database-tree/DatabaseTree';
import type { TreeHandlers } from '../database-tree/databaseTree.utils';
import { WarehouseSplitLayout } from '../layout/WarehouseSplitLayout';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';
import { GlobalRelationshipPanel } from './GlobalRelationshipPanel';

const SECTION = getWarehouseSection(WarehouseSection.Relationship);
const TREE_HANDLERS: TreeHandlers = { draggableTables: true };

/**
 * `/data-warehouse/relationship` (v1 `DataRelationship.vue`): the organization's global relationships, with the
 * database tree to drag tables from.
 */
export function RelationshipPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader icon={SECTION.icon} title={SECTION.title} />
      <WarehouseSplitLayout tree={<DatabaseTree handlers={TREE_HANDLERS} />}>
        <GlobalRelationshipPanel />
      </WarehouseSplitLayout>
    </div>
  );
}
