/*
 * @author: tvc12 - Thien Vi
 * @created: 8/14/21, 3:57 PM
 */

import { Inject } from 'typescript-ioc';
import { DirectoryService } from '@core/common/services';
import { Directory, DirectoryType, ListDirectoryRequest, PageResult, Sort, SortDirection } from '@core/common/domain';
import { DashboardModule } from '@/screens/dashboard-detail/stores';

export abstract class DashboardListingHandler<T extends any> {
  abstract get data(): T[];

  abstract async search(keyword: string): Promise<T[]>;
  abstract async reload(): Promise<T[]>;
  abstract async loadMore(): Promise<T[]>;
}

/**
 * @deprecated from v1.3
 */
export class DashboardListingHandlerImpl extends DashboardListingHandler<Directory> {
  @Inject
  private readonly directoryService!: DirectoryService;
  private keyword = '';
  private dashboards: Directory[] = [];
  private readonly size = 40;
  private isLoadMore = false;
  private canLoadMore = true;

  get data() {
    const id = DashboardModule.id;
    return this.dashboards.filter(dashboard => dashboard.dashboardId != id);
  }

  private get from() {
    return this.dashboards.length;
  }

  async search(keyword: string): Promise<Directory[]> {
    this.keyword = keyword;
    const { data, total } = await this.getDashboard(this.keyword, 0, this.size);
    this.dashboards = data;
    this.canLoadMore = this.from < total;
    return this.data;
  }

  async reload(): Promise<Directory[]> {
    const { data, total } = await this.getDashboard(this.keyword, 0, this.size);
    this.dashboards = data;
    this.canLoadMore = this.from < total;
    return this.data;
  }

  async loadMore(): Promise<Directory[]> {
    if (this.canLoadMore && !this.isLoadMore) {
      try {
        this.isLoadMore = true;
        const { total, data } = await this.getDashboard(this.keyword, this.from, this.size);
        this.dashboards.push(...data);
        this.canLoadMore = this.from < total;
        return this.data;
      } finally {
        this.isLoadMore = false;
      }
    } else {
      return this.data;
    }
  }

  private getDashboard(keyword: string, from: number, size: number): Promise<PageResult<Directory>> {
    return this.directoryService.quickList(
      new ListDirectoryRequest({
        from: from,
        size: size,
        sorts: [new Sort({ field: 'name', order: SortDirection.Asc })],
        directoryType: DirectoryType.Dashboard,
        isRemoved: false
      })
    );
  }
}
