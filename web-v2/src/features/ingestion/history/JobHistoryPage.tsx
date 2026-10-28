import { getIngestionSection, IngestionSection } from '../ingestion.utils';
import { IngestionPageHeader } from '../layout/IngestionPageHeader';

/** `/data-ingestion/job-history` (v1 `JobHistoryScreen.vue`). The listing lands in DI7. */
export function JobHistoryPage() {
  return <IngestionPageHeader section={getIngestionSection(IngestionSection.JobHistory)} />;
}
