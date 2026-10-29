import { PageHeader } from '@/shared/layout/PageHeader';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

const SECTION = getWarehouseSection(WarehouseSection.Databases);

/** `/data-warehouse/databases/all` (v1 `DatabaseListing.vue`). The listing comes in DW4. */
export function DatabasesPage() {
  return <PageHeader icon={SECTION.icon} title={SECTION.title} />;
}
