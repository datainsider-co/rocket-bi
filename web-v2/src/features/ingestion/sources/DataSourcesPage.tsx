import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { IngestionPageHeader } from '../layout/IngestionPageHeader';

/** `/data-ingestion/data-source` (v1 `DataSourceScreen.vue`). The listing lands in DI3. */
export function DataSourcesPage() {
  return <IngestionPageHeader section={getIngestionSection(IngestionSection.DataSources)} />;
}
