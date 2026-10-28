import { getIngestionSection, type IngestionSection } from '../ingestion.utils';
import { JobFormModal } from '../job-form/JobFormModal';
import { JobsListingView } from './JobsListingView';
import { useJobsPage } from './useJobsPage';

/** Container of one jobs page; remounted per section so search, paging and sort start over, as in v1. */
export function JobsListing({ section }: { section: IngestionSection }) {
  const { listing, actions, dialog } = useJobsPage(section);
  return (
    <>
      <JobsListingView section={getIngestionSection(section)} listing={listing} actions={actions} />
      {dialog.target && <JobFormModal target={dialog.target} onSaved={dialog.onSaved} onClose={dialog.onClose} />}
    </>
  );
}
