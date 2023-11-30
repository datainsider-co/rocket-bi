export class AutoRefreshSetting {
  isAutoRefresh: boolean;
  refreshIntervalMs: number;

  constructor(data: { isAutoRefresh?: boolean; refreshIntervalMs?: number }) {
    this.isAutoRefresh = data.isAutoRefresh ?? false;
    this.refreshIntervalMs = data.refreshIntervalMs ?? 10000;
  }

  static default(): AutoRefreshSetting {
    return new AutoRefreshSetting({
      isAutoRefresh: false
    });
  }

  static fromObject(obj: any): AutoRefreshSetting {
    return new AutoRefreshSetting(obj);
  }

  /**
   * set refresh interval, if refreshIntervalMs is less than or equal to 0, auto refresh is disabled
   * @param refreshIntervalMs
   */
  setRefreshIntervalMs(refreshIntervalMs: number): void {
    if (refreshIntervalMs <= 0) {
      this.setAutoRefresh(false);
      this.refreshIntervalMs = 0;
    } else {
      this.refreshIntervalMs = refreshIntervalMs;
      this.setAutoRefresh(true);
    }
  }

  setAutoRefresh(isAutoRefresh: boolean): void {
    this.isAutoRefresh = isAutoRefresh;
  }
}
