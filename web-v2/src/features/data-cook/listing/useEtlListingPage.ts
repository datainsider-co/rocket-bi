import { useCallback, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import type { EtlListing } from '@/core/data-cook/EtlService';
import { etlShare, type ShareRequest } from '@/features/share/share.utils';
import { etlEditorPath } from '../dataCook.utils';
import { forceRunTime } from './etlListing.utils';
import { useEtlActions } from './useEtlActions';
import { useEtlListing, type EtlListingState } from './useEtlListing';

/** What a row of the listing can do; Trash rows only restore and delete forever. */
export interface EtlRowActions {
  /** Row click and Edit: the editor. */
  readonly onOpen: (etl: EtlJob) => void;
  readonly onForceRun: (etl: EtlJob) => void;
  /** The share dialog, people only (v1 `DataCookShareHandler`). */
  readonly onShare: (etl: EtlJob) => void;
  readonly onCancel: (etl: EtlJob) => void;
  readonly onTrash: (etl: EtlJob) => void;
  readonly onRestore: (etl: EtlJob) => void;
  readonly onDeleteForever: (etl: EtlJob) => void;
  /** A cancel is on its way. */
  readonly isBusy: boolean;
}

export interface ForceRunDialog {
  /** The dialog is open on it; closed when `undefined`. */
  readonly etl: EtlJob | undefined;
  readonly isSubmitting: boolean;
  readonly now: number;
  readonly onSubmit: (day: Dayjs) => void;
  readonly onClose: () => void;
}

export interface ShareDialog {
  /** What the open dialog shares; `undefined` while closed. */
  readonly request: ShareRequest | undefined;
  readonly onClose: () => void;
}

/**
 * One ETL listing page: the listing, the row actions, the force run dialog (v1 `ForceRunSettingModal`) and the share
 * dialog.
 */
export function useEtlListingPage(
  listing: EtlListing,
  now: () => number = Date.now
): { state: EtlListingState; actions: EtlRowActions; forceRun: ForceRunDialog; share: ShareDialog } {
  const state = useEtlListing(listing);
  const { forceRun, cancel, confirmTrash, confirmRestore, confirmDeleteForever, isForceRunning, isBusy } = useEtlActions();
  const navigate = useNavigate();
  const [target, setTarget] = useState<{ etl: EtlJob; openedAt: number }>();
  const [shareRequest, setShareRequest] = useState<ShareRequest>();
  const closeShare = useCallback(() => setShareRequest(undefined), []);

  const onClose = useCallback(() => setTarget(undefined), []);
  const onSubmit = useCallback(
    (day: Dayjs) => {
      if (!target) return;
      // The dialog stays open on an error, which shows as a toast.
      forceRun({ etl: target.etl, atTime: forceRunTime(day, now()) }).then(onClose, () => undefined);
    },
    [target, forceRun, now, onClose]
  );

  const actions = useMemo<EtlRowActions>(
    () => ({
      onOpen: etl => void navigate(etlEditorPath(etl.id, etl.displayName)),
      onForceRun: etl => setTarget({ etl, openedAt: now() }),
      onShare: etl => setShareRequest(etlShare(etl)),
      onCancel: cancel,
      onTrash: confirmTrash,
      onRestore: confirmRestore,
      onDeleteForever: confirmDeleteForever,
      isBusy
    }),
    [navigate, now, cancel, confirmTrash, confirmRestore, confirmDeleteForever, isBusy]
  );

  return {
    state,
    actions,
    forceRun: {
      etl: target?.etl,
      isSubmitting: isForceRunning,
      now: target?.openedAt ?? 0,
      onSubmit,
      onClose
    },
    share: { request: shareRequest, onClose: closeShare }
  };
}
