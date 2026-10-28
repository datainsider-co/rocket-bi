import { useLocation } from 'react-router';
import { getIngestionSection, IngestionSection, ingestionSectionFromPath } from '../ingestion.utils';
import { IngestionPageHeader } from '../layout/IngestionPageHeader';

/**
 * `/data-ingestion/job` and `/data-ingestion/queued-job`: one screen in v1 (`JobScreen.vue`), the queued one filtered
 * on the current status. The listing lands in DI5.
 */
export function JobsPage() {
  const { pathname } = useLocation();
  const section =
    ingestionSectionFromPath(pathname) === IngestionSection.QueuedJobs ? IngestionSection.QueuedJobs : IngestionSection.Jobs;

  return <IngestionPageHeader section={getIngestionSection(section)} />;
}
