import { describe, expect, it } from 'vitest';
import { deleteChoiceError, deleteConfirmText, transferEmail } from './deleteUser.utils';

describe('deleteChoiceError', () => {
  it('needs a picked user to transfer to', () => {
    expect(deleteChoiceError({ mode: 'transfer', transferTo: undefined }, 'a@x.io')).toBe('Pick the user who gets the data');
    expect(deleteChoiceError({ mode: 'transfer', transferTo: '' }, 'a@x.io')).toBe('Pick the user who gets the data');
  });

  it('refuses transferring to the user being deleted', () => {
    expect(deleteChoiceError({ mode: 'transfer', transferTo: 'a@x.io' }, 'a@x.io')).toMatch(/another user/);
  });

  it('accepts another user, or deleting the data', () => {
    expect(deleteChoiceError({ mode: 'transfer', transferTo: 'b@x.io' }, 'a@x.io')).toBeUndefined();
    expect(deleteChoiceError({ mode: 'delete', transferTo: undefined }, 'a@x.io')).toBeUndefined();
  });
});

describe('transferEmail', () => {
  it('sends the email only when transferring', () => {
    expect(transferEmail({ mode: 'transfer', transferTo: 'b@x.io' })).toBe('b@x.io');
    expect(transferEmail({ mode: 'delete', transferTo: 'b@x.io' })).toBeUndefined();
  });
});

describe('deleteConfirmText', () => {
  it('names who gets the data, or says it is deleted', () => {
    expect(deleteConfirmText({ mode: 'transfer', transferTo: 'b@x.io' }, 'Ann')).toContain('go to b@x.io');
    expect(deleteConfirmText({ mode: 'delete', transferTo: undefined }, 'Ann')).toContain("can't be undone");
  });
});
