import type { ShareOptions, ShareTarget } from './share.utils';
import { ShareDialogView } from './ShareDialogView';
import { useShareDialog } from './useShareDialog';

interface ShareDialogProps {
  target: ShareTarget;
  options: ShareOptions;
  onClose: () => void;
  onShared: () => void;
}

/** The dialog's content; mounted while the modal is open, so its edits start fresh each time. */
export function ShareDialog({ target, options, onClose, onShared }: ShareDialogProps) {
  const dialog = useShareDialog({ target, options, onClose, onShared, origin: window.location.origin });
  return <ShareDialogView {...dialog} />;
}
