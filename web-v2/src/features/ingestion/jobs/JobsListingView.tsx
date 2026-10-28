import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import type { IngestionSectionConfig } from '../ingestion.utils';
import { IngestionPageHeader } from '../layout/IngestionPageHeader';
import { JOB_SEARCH_PLACEHOLDER } from './jobs.utils';
import { JobsListingBody } from './JobsListingBody';
import { JobsRefreshButton } from './JobsRefreshButton';
import type { JobsListing } from './useJobsListing';

interface JobsListingViewProps {
  section: IngestionSectionConfig;
  listing: JobsListing;
}

/** v1 `JobScreen`: search and refresh in the header, the jobs below. */
export function JobsListingView({ section, listing: { search, refresh, table, handlers } }: JobsListingViewProps) {
  return (
    <>
      <IngestionPageHeader
        section={section}
        actions={
          <>
            <Input
              className="w-32 sm:w-60"
              allowClear
              prefix={<SearchOutlined />}
              placeholder={JOB_SEARCH_PLACEHOLDER}
              aria-label={JOB_SEARCH_PLACEHOLDER}
              value={search.text}
              onChange={event => search.onChange(event.target.value)}
            />
            <JobsRefreshButton {...refresh} />
          </>
        }
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <JobsListingBody table={table} handlers={handlers} />
      </div>
    </>
  );
}
