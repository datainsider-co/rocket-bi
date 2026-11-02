import { useLocation } from 'react-router';
import { PageHeader } from '@/shared/layout/PageHeader';
import { dataCookSectionFromPath, getDataCookSection } from '../dataCook.utils';

/**
 * `/data-warehouse/data-cook/my-etl`, `shared` and `trash` (v1 `ListEtlJob.vue`, one component picked by route): the
 * section's header. The listing comes with DC3.
 */
export function EtlListingPage() {
  const { pathname } = useLocation();
  const section = getDataCookSection(dataCookSectionFromPath(pathname));

  return <PageHeader icon={section.icon} title={section.title} />;
}
