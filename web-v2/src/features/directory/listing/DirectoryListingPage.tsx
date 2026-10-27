import { Alert, Button } from 'antd';
import { ShareModal } from '@/features/share/ShareModal';
import { directoryShare } from '@/features/share/share.utils';
import { DirectorySection, menuActions } from '../directory.utils';
import { MoveDirectoryModal } from '../dialogs/MoveDirectoryModal';
import { NameModal } from '../dialogs/NameModal';
import { ListingHeader } from './header/ListingHeader';
import { SettingsMenu } from './row-actions/SettingsMenu';
import { ShareButton } from './row-actions/ShareButton';
import { TrashActions } from './row-actions/TrashActions';
import { useRowActions } from './row-actions/useRowActions';
import { DirectoryTable } from './table/DirectoryTable';
import { DirectoryTableTheme } from './table/DirectoryTableTheme';
import { useDirectoryListing } from './useDirectoryListing';

const RENAME_COPY = { title: 'Rename', label: 'Name', placeholder: 'Type new name', okText: 'Apply' };

/** All Data, Shared With Me, Recent, Starred and Trash, at the root or inside a folder (v1 `MyData.vue`). */
export function DirectoryListingPage() {
  const listing = useDirectoryListing();
  const section = listing.section.key;
  const rows = useRowActions(section);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ListingHeader
        section={listing.section}
        breadcrumbs={listing.breadcrumbs}
        isRefreshing={listing.isRefreshing}
        onRefresh={listing.refresh}
      />
      {listing.error ? (
        <Alert
          type="error"
          showIcon
          title={listing.error}
          action={<Button onClick={listing.refresh}>Retry</Button>}
        />
      ) : (
        <DirectoryTableTheme>
          <DirectoryTable
            items={listing.items}
            isLoading={listing.isLoading}
            nameOrder={listing.sort.order}
            onToggleNameSort={listing.toggleNameSort}
            onOpen={rows.onOpen}
            renderActions={directory =>
              section === DirectorySection.Trash ? (
                <TrashActions directory={directory} onRestore={rows.onRestore} onDeleteForever={rows.onDeleteForever} />
              ) : (
                <span className="flex gap-5">
                  <ShareButton directory={directory} onShare={rows.share.open} />
                  <SettingsMenu directory={directory} actions={menuActions(directory, section)} onAction={rows.onAction} />
                </span>
              )
            }
          />
        </DirectoryTableTheme>
      )}
      <NameModal
        open={rows.rename.target !== null}
        copy={RENAME_COPY}
        initialName={rows.rename.target?.name ?? ''}
        isSubmitting={rows.rename.isSubmitting}
        error={rows.rename.error}
        onSubmit={name => void rows.rename.submit(name)}
        onCancel={rows.rename.cancel}
      />
      {rows.share.target && (
        <ShareModal open {...directoryShare(rows.share.target)} onClose={rows.share.close} onShared={rows.share.onShared} />
      )}
      {rows.move.target && (
        <MoveDirectoryModal directory={rows.move.target} onSelect={rows.move.submit} onCancel={rows.move.cancel} />
      )}
    </div>
  );
}
