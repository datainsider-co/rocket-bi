import type { Dashboard } from '@/core/dashboard/Dashboard';
import { DashboardMode } from '../mode/dashboardMode.utils';

/**
 * What other features plug into the header's Options menu (v1 `DashboardControlBar`). An item shows only when its
 * callback is given.
 */
export interface DashboardOptionHandlers {
  /** v1 `RelationshipModal`: the tables' relationships, which may be changed in edit mode only. */
  onRelationship?: (dashboard: Dashboard, editing: boolean) => void;
  /** v1 `DiShareModal`; offered with the `*` permission and not on mobile. */
  onShare?: (dashboard: Dashboard) => void;
}

export type OptionKey = 'relationship' | 'settings' | 'fullscreen' | 'tv' | 'share' | 'viewAs';

export interface OptionItem {
  key: OptionKey;
  label: string;
  /** A v1 icon font class. */
  icon: string;
  onSelect: () => void;
}

export interface OptionsContext {
  mode: DashboardMode;
  editing: boolean;
  mobile: boolean;
  canShare: boolean;
}

/** What each item does; an item without one is left out. */
export type OptionActions = Partial<Record<OptionKey, () => void>>;

const ITEMS: Record<OptionKey, Omit<OptionItem, 'onSelect'>> = {
  relationship: { key: 'relationship', label: 'Relationship', icon: 'di-icon-relationship' },
  settings: { key: 'settings', label: 'Settings', icon: 'di-icon-setting' },
  fullscreen: { key: 'fullscreen', label: 'Full screen', icon: 'di-icon-full-screen' },
  tv: { key: 'tv', label: 'TV mode', icon: 'di-icon-tv-mode' },
  share: { key: 'share', label: 'Share', icon: 'di-icon-share' },
  viewAs: { key: 'viewAs', label: 'View As', icon: 'di-icon-view-as' }
};

function keysFor({ mode, editing }: OptionsContext): OptionKey[] {
  if (editing) return ['relationship', 'settings'];
  if (mode === DashboardMode.View) return ['relationship', 'fullscreen', 'tv', 'share', 'viewAs'];
  // v1 offered Share in full screen only (its TV mode check was a typo); both get it here.
  return ['relationship', 'share'];
}

/**
 * The Options menu of each mode (v1 `DashboardControlBar` `#dashboard-options-menu`): Relationship and Settings while
 * editing; Relationship, Full screen, TV mode, Share and View As in view mode; Relationship and Share in full screen
 * and TV mode. Share needs the `*` permission and a desktop.
 */
export function optionItems(context: OptionsContext, actions: OptionActions): OptionItem[] {
  const shareable = context.canShare && !context.mobile;
  return keysFor(context).flatMap(key => {
    const onSelect = actions[key];
    if (!onSelect || (key === 'share' && !shareable)) return [];
    return [{ ...ITEMS[key], onSelect }];
  });
}
