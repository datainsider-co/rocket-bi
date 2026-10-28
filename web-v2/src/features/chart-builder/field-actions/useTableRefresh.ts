import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { SchemaService } from '@/core/schema/SchemaService';
import { databaseQueryOptions } from '@/shared/schema/schemaQueries';
import { useBuilder } from '../state/BuilderContext';
import { syncTableFields, type TableRef } from '../state/tableSync.utils';
import { removedFieldsMessage } from './fieldActions.utils';

/**
 * After a table changed on the server: reloads its database, so the field tree and every other reader of the schema
 * show the change, and brings the builder's items in line with the table (`syncTableFields`), telling the user when
 * some had to go.
 */
export function useTableRefresh() {
  const schema = useDi(SchemaService);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { state, dispatch } = useBuilder();
  // The data when the reload ends, which may come after other edits.
  const data = useRef(state.data);
  useEffect(() => {
    data.current = state.data;
  }, [state.data]);

  return useCallback(
    async (table: TableRef) => {
      try {
        const database = await queryClient.fetchQuery({ ...databaseQueryOptions(schema, table.dbName), staleTime: 0 });
        const fresh = database.tables.find(item => item.name === table.name);
        const { removed } = syncTableFields(data.current, table, fresh);
        dispatch({ type: 'syncTable', table, schema: fresh });
        if (removed > 0) void message.warning(removedFieldsMessage(removed, table.name));
      } catch {
        void message.error(`Cannot reload the ${table.dbName} database`);
      }
    },
    [queryClient, schema, dispatch, message]
  );
}
