import { useNavigate } from 'react-router';
import { ShareModal } from '@/features/share/ShareModal';
import { DatabasesView } from './DatabasesView';
import { schemaPathOf } from './databases.utils';
import { useDatabaseListing } from './useDatabaseListing';
import { useDatabaseShare } from './useDatabaseShare';
import { useDeleteDatabase } from './useDeleteDatabase';

/** `/data-warehouse/databases/all` (v1 `DatabaseListing.vue`). */
export function DatabasesPage() {
  const listing = useDatabaseListing();
  const onDelete = useDeleteDatabase();
  const share = useDatabaseShare();
  const navigate = useNavigate();
  return (
    <>
      <DatabasesView listing={listing} actions={{ onShare: share.open, onDelete }} onOpen={entry => void navigate(schemaPathOf(entry.name))} />
      {share.request && <ShareModal open {...share.request} onClose={share.close} onShared={share.close} />}
    </>
  );
}
