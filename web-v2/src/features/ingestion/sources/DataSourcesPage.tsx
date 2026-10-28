import { DataSourcesView } from './DataSourcesView';
import { useDataSources } from './useDataSources';

/** `/data-ingestion/data-source` (v1 `DataSourceScreen.vue`): the listing. Row actions and Add come with DI3b, DI4b. */
export function DataSourcesPage() {
  const { listing, search, refresh, setPage, sortOn } = useDataSources();

  return (
    <DataSourcesView
      listing={listing}
      onSearch={search}
      onRefresh={refresh}
      onPageChange={setPage}
      onSortOn={sortOn}
    />
  );
}
