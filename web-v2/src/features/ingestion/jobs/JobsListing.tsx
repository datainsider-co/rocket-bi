import { getIngestionSection, type IngestionSection } from '../ingestion.utils';
import { JobsListingView } from './JobsListingView';
import { useJobsListing } from './useJobsListing';

/** Container of one jobs page; remounted per section so search, paging and sort start over, as in v1. */
export function JobsListing({ section }: { section: IngestionSection }) {
  const listing = useJobsListing(section);
  return <JobsListingView section={getIngestionSection(section)} listing={listing} />;
}
