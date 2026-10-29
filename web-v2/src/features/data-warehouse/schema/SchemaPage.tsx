import { PageHeader } from '@/shared/layout/PageHeader';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

const SECTION = getWarehouseSection(WarehouseSection.Schema);

/** `/data-warehouse/schema` (v1 `DataSchema.vue`). The database tree and the table views come in DW3 and DW6. */
export function SchemaPage() {
  return <PageHeader icon={SECTION.icon} title={SECTION.title} />;
}
