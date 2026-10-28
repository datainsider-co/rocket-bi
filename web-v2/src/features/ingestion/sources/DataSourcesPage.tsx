import { DataSourcesDialogs } from './DataSourcesDialogs';
import { DataSourcesView } from './DataSourcesView';
import { useDataSourcesPage } from './useDataSourcesPage';

/** `/data-ingestion/data-source` (v1 `DataSourceScreen.vue`): the listing and its modals. */
export function DataSourcesPage() {
  const { listing, handlers, selection, rowActions, dialogs } = useDataSourcesPage();

  return (
    <>
      <DataSourcesView listing={listing} handlers={handlers} selection={selection} rowActions={rowActions} />
      <DataSourcesDialogs
        dialog={dialogs.dialog}
        onSelectType={dialogs.selectType}
        onSourceSaved={dialogs.sourceSaved}
        onJobSaved={dialogs.jobSaved}
        onClose={dialogs.close}
      />
    </>
  );
}
