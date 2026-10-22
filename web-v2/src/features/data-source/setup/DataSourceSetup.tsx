import { ConnectorConfigModal } from './config/ConnectorConfigModal';
import { SetupProgressModal } from './progress/SetupProgressModal';
import { ConnectorSelectionModal } from './select/ConnectorSelectionModal';
import { useDataSourceSetup } from './useDataSourceSetup';
import { useSetupStatus } from './useSetupStatus';

/**
 * First-run setup of the data warehouse connection, shown over the app after login (v1 sent the user to the
 * DataSource settings page, which opened the same modals): pick a type → fill and test the connection → fetch its
 * schema.
 */
export function DataSourceSetup() {
  const { state, choose, backToSelect, saved, edit, skip, finish } = useDataSourceSetup(useSetupStatus());

  switch (state.step) {
    case 'select':
      return <ConnectorSelectionModal onChoose={choose} onSkip={skip} />;
    case 'config':
      return <ConnectorConfigModal connection={state.connection} onSaved={saved} onBack={backToSelect} />;
    case 'progress':
      return (
        <SetupProgressModal
          displayName={state.connection.displayName}
          onBack={() => edit(state.connection)}
          onFinish={finish}
        />
      );
    case 'hidden':
      return null;
  }
}
