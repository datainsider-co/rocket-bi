import { PageHeader } from '@/shared/layout/PageHeader';
import { DataCookSection, getDataCookSection } from '../dataCook.utils';

const SECTION = getDataCookSection(DataCookSection.History);

/** `/data-warehouse/data-cook/history` (v1 `EtlHistory.vue`): the header. The runs come with DC4. */
export function EtlHistoryPage() {
  return <PageHeader icon={SECTION.icon} title={SECTION.title} />;
}
