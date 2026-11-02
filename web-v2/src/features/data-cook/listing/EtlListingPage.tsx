import { useLocation } from 'react-router';
import { dataCookSectionFromPath } from '../dataCook.utils';
import { EtlListing } from './EtlListing';

/**
 * `/data-warehouse/data-cook/my-etl`, `shared` and `trash`: one screen in v1 (`ListEtlJob.vue`), the listing picked by
 * route.
 */
export function EtlListingPage() {
  const { pathname } = useLocation();
  const section = dataCookSectionFromPath(pathname);

  return <EtlListing key={section} section={section} />;
}
