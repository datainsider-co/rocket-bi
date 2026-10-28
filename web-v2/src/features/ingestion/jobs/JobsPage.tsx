import { useLocation } from 'react-router';
import { IngestionSection, ingestionSectionFromPath } from '../ingestion.utils';
import { JobsListing } from './JobsListing';

/**
 * `/data-ingestion/job` and `/data-ingestion/queued-job`: one screen in v1 (`JobScreen.vue`), the queued one filtered
 * on the current status.
 */
export function JobsPage() {
  const { pathname } = useLocation();
  const section =
    ingestionSectionFromPath(pathname) === IngestionSection.QueuedJobs ? IngestionSection.QueuedJobs : IngestionSection.Jobs;

  return <JobsListing key={section} section={section} />;
}
