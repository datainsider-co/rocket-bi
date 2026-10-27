import { describe, expect, it } from 'vitest';
import { hashPassword } from '@/shared/security/hashPassword';
import { initialPasswordDraft, passwordChange } from './sharePassword.utils';

const NONE = { enabled: false, hashedPassword: '' };
const STORED = { enabled: true, hashedPassword: hashPassword('abc') };
const DISABLED = { enabled: false, hashedPassword: hashPassword('abc') };

describe('initialPasswordDraft', () => {
  it('starts off without a password', () => {
    expect(initialPasswordDraft(NONE)).toEqual({ enabled: false, keepStored: false, value: '' });
  });

  it('keeps a stored password', () => {
    expect(initialPasswordDraft(STORED)).toEqual({ enabled: true, keepStored: true, value: '' });
  });

  it('keeps a stored but disabled password, switched off', () => {
    expect(initialPasswordDraft(DISABLED)).toEqual({ enabled: false, keepStored: true, value: '' });
  });
});

describe('passwordChange', () => {
  it('keeps things as they are when nothing changed', () => {
    expect(passwordChange(NONE, initialPasswordDraft(NONE))).toEqual({ kind: 'keep' });
    expect(passwordChange(STORED, initialPasswordDraft(STORED))).toEqual({ kind: 'keep' });
  });

  it('sets a new password as its sha256 hex', () => {
    expect(passwordChange(NONE, { enabled: true, keepStored: false, value: 'secret' })).toEqual({
      kind: 'set',
      hashedPassword: hashPassword('secret')
    });
  });

  it('replaces a stored password once reset', () => {
    expect(passwordChange(STORED, { enabled: true, keepStored: false, value: 'new' })).toEqual({ kind: 'set', hashedPassword: hashPassword('new') });
  });

  it('removes a stored password switched off', () => {
    expect(passwordChange(STORED, { enabled: false, keepStored: true, value: '' })).toEqual({ kind: 'remove' });
  });

  it('removes a stored password reset and left empty (v1)', () => {
    expect(passwordChange(STORED, { enabled: true, keepStored: false, value: '' })).toEqual({ kind: 'remove' });
  });

  it('sends nothing when switched on and left empty without a stored password', () => {
    expect(passwordChange(NONE, { enabled: true, keepStored: false, value: '' })).toEqual({ kind: 'keep' });
  });

  it('switches a stored but disabled password back on', () => {
    expect(passwordChange(DISABLED, { enabled: true, keepStored: true, value: '' })).toEqual({ kind: 'set', hashedPassword: DISABLED.hashedPassword });
  });

  it('removes a stored but disabled password left off', () => {
    expect(passwordChange(DISABLED, initialPasswordDraft(DISABLED))).toEqual({ kind: 'remove' });
  });
});
