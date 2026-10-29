import { PageHeader } from '@/shared/layout/PageHeader';
import { getWarehouseSection, WarehouseSection } from '../warehouse.utils';

const SECTION = getWarehouseSection(WarehouseSection.QueryEditor);

/** `/data-warehouse/query-editor` (v1 `QueryEditor.vue`). The editor comes in DW10. */
export function QueryEditorPage() {
  return <PageHeader icon={SECTION.icon} title={SECTION.title} />;
}
