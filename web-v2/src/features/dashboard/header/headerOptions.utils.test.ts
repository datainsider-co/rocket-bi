import { describe, expect, it, vi } from 'vitest';
import { DashboardMode } from '../mode/dashboardMode.utils';
import { optionItems, type OptionActions, type OptionsContext } from './headerOptions.utils';

const every: OptionActions = {
  relationship: vi.fn<() => void>(),
  settings: vi.fn<() => void>(),
  fullscreen: vi.fn<() => void>(),
  tv: vi.fn<() => void>(),
  share: vi.fn<() => void>(),
  viewAs: vi.fn<() => void>()
};

const view: OptionsContext = { mode: DashboardMode.View, editing: false, mobile: false, canShare: true };
const keys = (context: OptionsContext, actions: OptionActions = every) => optionItems(context, actions).map(item => item.key);

describe('optionItems', () => {
  it("lists v1's view mode items in order", () => {
    expect(optionItems(view, every).map(item => item.label)).toEqual(['Relationship', 'Full screen', 'TV mode', 'Share', 'View As']);
  });

  it('lists Relationship and Settings in edit mode', () => {
    expect(keys({ ...view, editing: true })).toEqual(['relationship', 'settings']);
  });

  it.each([DashboardMode.FullScreen, DashboardMode.Tv])('lists Relationship and Share in %s', mode => {
    expect(keys({ ...view, mode })).toEqual(['relationship', 'share']);
  });

  it('leaves out items without an action', () => {
    expect(keys(view, { fullscreen: vi.fn<() => void>(), tv: vi.fn<() => void>() })).toEqual(['fullscreen', 'tv']);
    expect(keys({ ...view, editing: true }, { settings: vi.fn<() => void>() })).toEqual(['settings']);
    expect(keys({ ...view, mode: DashboardMode.FullScreen }, {})).toEqual([]);
  });

  it('offers Share only with the share permission, on a desktop', () => {
    expect(keys({ ...view, canShare: false })).not.toContain('share');
    expect(keys({ ...view, mobile: true })).not.toContain('share');
    expect(keys({ ...view, mode: DashboardMode.FullScreen, canShare: false })).toEqual(['relationship']);
  });

  it('gives each item its icon and action', () => {
    const [relationship, fullscreen] = optionItems(view, every);
    expect(relationship).toMatchObject({ icon: 'di-icon-relationship', onSelect: every.relationship });
    expect(fullscreen).toMatchObject({ icon: 'di-icon-full-screen', onSelect: every.fullscreen });
  });
});
