import { PageHeader } from '@/shared/layout/PageHeader';
import { DatabaseTree } from '../database-tree/DatabaseTree';
import { WarehouseSplitLayout } from '../layout/WarehouseSplitLayout';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

const SECTION = getWarehouseSection(WarehouseSection.Schema);

/** `/data-warehouse/schema` (v1 `DataSchema.vue`): the database tree beside the page, which comes in DW6. */
export function SchemaPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader icon={SECTION.icon} title={SECTION.title} />
      <WarehouseSplitLayout tree={<DatabaseTree />}>
        <div className="flex-1 rounded-lg bg-white" />
      </WarehouseSplitLayout>
    </div>
  );
}
