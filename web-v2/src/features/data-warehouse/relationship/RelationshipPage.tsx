import { PageHeader } from '@/shared/layout/PageHeader';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

const SECTION = getWarehouseSection(WarehouseSection.Relationship);

/** `/data-warehouse/relationship` (v1 `DataRelationship.vue`). The editor comes in DW9. */
export function RelationshipPage() {
  return <PageHeader icon={SECTION.icon} title={SECTION.title} />;
}
