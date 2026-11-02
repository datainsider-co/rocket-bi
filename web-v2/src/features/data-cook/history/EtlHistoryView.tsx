import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { PageHeader } from '@/shared/layout/PageHeader';
import type { DataCookSectionConfig } from '../dataCook.utils';
import { EtlHistoryBody } from './EtlHistoryBody';
import { ETL_HISTORY_SEARCH_PLACEHOLDER } from './etlHistory.utils';
import type { EtlHistoryState } from './useEtlHistory';

/** v1 `EtlHistory`: search and Refresh in the header, the runs below. */
export function EtlHistoryView({ section, state }: { section: DataCookSectionConfig; state: EtlHistoryState }) {
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
              placeholder={ETL_HISTORY_SEARCH_PLACEHOLDER}
              aria-label={ETL_HISTORY_SEARCH_PLACEHOLDER}
              value={state.search.text}
              onChange={event => state.search.onChange(event.target.value)}
            />
            <Button icon={<ReloadOutlined spin={state.isFetching} />} aria-label="Refresh" onClick={state.handlers.onRefresh}>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </>
        }
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <EtlHistoryBody section={section} state={state} />
      </div>
    </>
  );
}
