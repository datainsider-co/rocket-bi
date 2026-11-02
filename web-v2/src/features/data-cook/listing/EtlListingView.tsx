import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { PageHeader } from '@/shared/layout/PageHeader';
import type { DataCookSectionConfig } from '../dataCook.utils';
import { ETL_SEARCH_PLACEHOLDER } from './etlListing.utils';
import { EtlListingBody } from './EtlListingBody';
import type { EtlListingState } from './useEtlListing';
import type { EtlRowActions } from './useEtlListingPage';

interface EtlListingViewProps {
  section: DataCookSectionConfig;
  state: EtlListingState;
  actions: EtlRowActions;
}

/** v1 `ListEtlJob`: search and Refresh in the header, the ETLs below. */
export function EtlListingView({ section, state: { search, isFetching, table, handlers }, actions }: EtlListingViewProps) {
  return (
    <>
      <PageHeader
        icon={section.icon}
        title={section.title}
        actions={
          <>
            <Input
              className="w-40 sm:w-60"
              allowClear
              prefix={<SearchOutlined />}
              placeholder={ETL_SEARCH_PLACEHOLDER}
              aria-label={ETL_SEARCH_PLACEHOLDER}
              value={search.text}
              onChange={event => search.onChange(event.target.value)}
            />
            <Button icon={<ReloadOutlined spin={isFetching} />} aria-label="Refresh" onClick={handlers.onRefresh}>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </>
        }
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <EtlListingBody icon={section.icon} table={table} handlers={handlers} actions={actions} />
      </div>
    </>
  );
}
