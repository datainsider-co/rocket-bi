import { describe, expect, it, vi } from 'vitest';
import { settingMenuItems, type SettingMenuHandlers } from './settingMenu.utils';

function handlers(): SettingMenuHandlers {
  return { onEditDashboard: vi.fn<() => void>(), onEditWidgets: vi.fn<() => void>(), onThemes: vi.fn<() => void>(), onAutoRefresh: vi.fn<(intervalMs: number) => void>() };
}

describe('settingMenuItems', () => {
  it("lists v1's gear items with their icons", () => {
    const items = settingMenuItems(0, handlers());
    expect(items.map(item => [item.label, item.icon])).toEqual([
      ['Edit Dashboard', 'di-icon-edit-dashboard'],
      ['Edit Widgets', 'di-icon-outline-edit'],
      ['Themes', 'di-icon-image'],
      ['Auto Refresh Data', 'di-icon-refresh']
    ]);
  });

  it('opens the matching dialog', () => {
    const actions = handlers();
    const [dashboard, widgets, themes] = settingMenuItems(0, actions);
    dashboard?.onSelect?.();
    widgets?.onSelect?.();
    themes?.onSelect?.();
    expect(actions.onEditDashboard).toHaveBeenCalledOnce();
    expect(actions.onEditWidgets).toHaveBeenCalledOnce();
    expect(actions.onThemes).toHaveBeenCalledOnce();
  });

  it('offers the refresh intervals, Off last, and checks the current one', () => {
    const refresh = settingMenuItems(60_000, handlers())[3]!;
    expect(refresh.onSelect).toBeUndefined();
    expect(refresh.children?.map(item => item.label)).toEqual(['15 Seconds', '30 Seconds', '60 Seconds', '3 Minutes', '5 Minutes', 'Off']);
    expect(refresh.children?.filter(item => item.active).map(item => item.label)).toEqual(['60 Seconds']);
  });

  it('checks Off when auto refresh is off', () => {
    const refresh = settingMenuItems(0, handlers())[3]!;
    expect(refresh.children?.filter(item => item.active).map(item => item.label)).toEqual(['Off']);
  });

  it('checks nothing for an interval v1 does not offer', () => {
    const refresh = settingMenuItems(10_000, handlers())[3]!;
    expect(refresh.children?.some(item => item.active)).toBe(false);
  });

  it('saves the picked interval, 0 for Off', () => {
    const actions = handlers();
    const refresh = settingMenuItems(0, actions)[3]!;
    refresh.children?.[3]?.onSelect?.();
    refresh.children?.at(-1)?.onSelect?.();
    expect(vi.mocked(actions.onAutoRefresh).mock.calls).toEqual([[180_000], [0]]);
  });
});
