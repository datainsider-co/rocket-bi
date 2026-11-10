import { DataSourceConfigDialogs } from './DataSourceConfigDialogs';
import { DataSourceConfigView } from './DataSourceConfigView';
import { useConfigDialog } from './useConfigDialog';
import { useDataSourceConfig } from './useDataSourceConfig';

/**
 * `/settings/organization/clickhouse-config` (v1 `ConnectorConfig.vue`): the organization's connection, its schema
 * refresh, and the setup modals to change or edit it. Unlike v1 it opens no modal by itself: first-run setup already
 * shows over every page (`DataSourceSetup`).
 */
export function DataSourceConfigPage() {
  const { updateSchema, refresh, ...data } = useDataSourceConfig();
  const dialogs = useConfigDialog();

  return (
    <>
      <DataSourceConfigView
        data={data}
        actions={{ onUpdateSchema: updateSchema, onRefresh: refresh, onChange: dialogs.change, onEdit: dialogs.edit }}
      />
      <DataSourceConfigDialogs dialogs={dialogs} />
    </>
  );
}
