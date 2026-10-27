import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { DirectoryService } from '@/core/directory/DirectoryService';
import { storedPasswordQueryOptions } from '../shareQueries';
import type { PasswordDraft, StoredPassword } from './sharePassword.utils';
import { initialPasswordDraft, passwordChange } from './sharePassword.utils';

const NO_PASSWORD: StoredPassword = { enabled: false, hashedPassword: '' };

/** Password protection of a dashboard or query, offered to the owner only (v1 `DiShareModal.initPassword`). */
export function useSharePassword(directoryId: number, enabled: boolean) {
  const stored = useQuery({ ...storedPasswordQueryOptions(useDi(DirectoryService), directoryId), enabled });
  const [edited, setEdited] = useState<PasswordDraft>();
  const current = stored.data ?? NO_PASSWORD;
  const draft = edited ?? initialPasswordDraft(current);

  return {
    draft,
    /** The controls wait for the stored password, so a toggle can't be lost when it arrives. */
    isReady: stored.isSuccess,
    toggle: (on: boolean) => setEdited({ ...draft, enabled: on }),
    type: (value: string) => setEdited({ ...draft, value }),
    /** × on the stored password: type a new one instead. */
    reset: () => setEdited({ ...draft, keepStored: false, value: '' }),
    change: () => (enabled && stored.isSuccess ? passwordChange(current, draft) : ({ kind: 'keep' } as const))
  };
}
