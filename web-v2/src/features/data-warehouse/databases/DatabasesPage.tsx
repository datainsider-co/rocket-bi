import { useNavigate } from 'react-router';
import { DatabasesView } from './DatabasesView';
import { schemaPathOf } from './databases.utils';
import { useDatabaseListing } from './useDatabaseListing';
import { useDeleteDatabase } from './useDeleteDatabase';

/** `/data-warehouse/databases/all` (v1 `DatabaseListing.vue`). */
export function DatabasesPage() {
  const listing = useDatabaseListing();
  const onDelete = useDeleteDatabase();
  const navigate = useNavigate();
  return <DatabasesView listing={listing} actions={{ onDelete }} onOpen={entry => void navigate(schemaPathOf(entry.name))} />;
}
