import { describe, expect, it } from 'vitest';
import { isSettingDialog } from './editDialogs';

describe('isSettingDialog', () => {
  it.each(['themes', 'editDashboard', 'editWidgets'] as const)('is true for %s', kind => {
    expect(isSettingDialog({ kind })).toBe(true);
  });

  it('is false for the other dialogs and for none', () => {
    expect(isSettingDialog({ kind: 'renameDashboard' })).toBe(false);
    expect(isSettingDialog(undefined)).toBe(false);
  });
});
