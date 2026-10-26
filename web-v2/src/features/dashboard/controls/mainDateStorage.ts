import type { StoredMainDate } from './controls.utils';

/** Where the viewer's main date choice lives between visits (v1 `DataManager.saveMainDateData`). */
export interface MainDateStorage {
  load(dashboardId: number): unknown;
  save(dashboardId: number, value: StoredMainDate): void;
}

/** v1's key, so a choice made in v1 still applies on the same origin. */
const keyOf = (dashboardId: number) => `main_filter_mode_${dashboardId}`;

export const localMainDateStorage: MainDateStorage = {
  load(dashboardId) {
    try {
      const raw = localStorage.getItem(keyOf(dashboardId));
      return raw ? (JSON.parse(raw) as unknown) : undefined;
    } catch {
      return undefined;
    }
  },
  save(dashboardId, value) {
    try {
      localStorage.setItem(keyOf(dashboardId), JSON.stringify(value));
    } catch {
      // Private mode or full storage: the choice just isn't remembered.
    }
  }
};
