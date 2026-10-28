import { DeleteOutlined, PlusOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import type { IngestionSectionConfig } from '../ingestion.utils';
import { IngestionPageHeader } from '../layout/IngestionPageHeader';
import { JOB_SEARCH_PLACEHOLDER } from './jobs.utils';
import { JobsListingBody } from './JobsListingBody';
import { JobsRefreshButton } from './JobsRefreshButton';
import type { JobsListing } from './useJobsListing';
import type { JobsPageActions } from './useJobsPage';

interface JobsListingViewProps {
  section: IngestionSectionConfig;
  listing: JobsListing;
  actions: JobsPageActions;
}

/**
 * v1 `JobScreen`: search, Force Sync and Delete for the checked rows, refresh in the header, the jobs below. Add Job
 * was in v1's sidebar; it sits with the other actions here.
 */
export function JobsListingView({ section, listing: { search, refresh, table, handlers }, actions }: JobsListingViewProps) {
  const selectedCount = actions.selection.selectedIds.length;

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
            {selectedCount > 0 && (
              <>
                <Button icon={<SyncOutlined />} disabled={actions.rowActions.isBusy} onClick={actions.onForceSyncSelected}>
                  Force Sync ({selectedCount})
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={actions.onDeleteSelected}>
                  Delete ({selectedCount})
                </Button>
              </>
            )}
            <JobsRefreshButton {...refresh} />
            <Button type="primary" icon={<PlusOutlined />} onClick={actions.onAdd}>
              Add Job
            </Button>
          </>
        }
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <JobsListingBody table={table} handlers={handlers} actions={actions} />
      </div>
    </>
  );
}
