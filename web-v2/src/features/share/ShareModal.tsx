import { Modal } from 'antd';
import type { ShareOptions, ShareTarget } from './share.utils';
import { ShareDialog } from './ShareDialog';

export interface ShareModalProps {
  /** The directory to share: a folder, or a dashboard's or query's entry. */
  target: ShareTarget;
  options: ShareOptions;
  open: boolean;
  onClose: () => void;
  /** After Apply succeeded, before the dialog closes. */
  onShared: () => void;
}

/**
 * Share a folder, dashboard or query with people of the organization and with a link (v1 `DiShareModal`). Edits wait
 * for Apply; closing the dialog drops them.
 */
export function ShareModal({ open, ...props }: ShareModalProps) {
  return (
    <Modal
      open={open}
      centered
      width={560}
      footer={null}
      closable={false}
      destroyOnHidden
      title={null}
      onCancel={props.onClose}
      styles={{ container: { background: 'transparent', boxShadow: 'none', padding: 0 } }}
    >
      <ShareDialog {...props} />
    </Modal>
  );
}
