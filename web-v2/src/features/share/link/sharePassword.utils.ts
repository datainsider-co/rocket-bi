import { hashPassword } from '@/shared/security/hashPassword';

/** The password stored on the directory (`data.config`). */
export interface StoredPassword {
  enabled: boolean;
  /** sha256 hex; empty when there is none. */
  hashedPassword: string;
}

/** The Password protection controls (v1 `ShareAnyone` passwordConfig). */
export interface PasswordDraft {
  enabled: boolean;
  /** The stored password is kept: shown as `********` until reset with ×. */
  keepStored: boolean;
  /** A new password, typed in clear. */
  value: string;
}

export function initialPasswordDraft(stored: StoredPassword): PasswordDraft {
  return { enabled: stored.enabled, keepStored: stored.hashedPassword !== '', value: '' };
}

export type PasswordChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'set'; hashedPassword: string };

/**
 * What Apply does with the password (v1 `DiShareModal.updatePassword`): off or left empty removes it, a new value
 * sets it. Unlike v1, nothing is sent when nothing changed, and switching a stored but disabled password back on
 * enables it (v1 left it off).
 */
export function passwordChange(stored: StoredPassword, draft: PasswordDraft): PasswordChange {
  const hasStored = stored.enabled || stored.hashedPassword !== '';
  if (!draft.enabled) return hasStored ? { kind: 'remove' } : { kind: 'keep' };
  if (draft.keepStored && stored.hashedPassword !== '') {
    return stored.enabled ? { kind: 'keep' } : { kind: 'set', hashedPassword: stored.hashedPassword };
  }
  if (draft.value === '') return hasStored ? { kind: 'remove' } : { kind: 'keep' };
  return { kind: 'set', hashedPassword: hashPassword(draft.value) };
}
