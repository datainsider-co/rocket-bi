/*
 * @author: tvc12 - Thien Vi
 * @created: 8/14/21, 3:57 PM
 */

import { Inject } from 'typescript-ioc';
import { DashboardService } from '@core/services';
import { Dashboard, DashboardId, Field, ListDrillThroughDashboardRequest, PageResult } from '@core/domain';
import { DashboardListingHandler } from '@/screens/DashboardDetail/components/DrillThrough/ListingHandler';

export class ListingDrillThroughDashboardHandler extends DashboardListingHandler<Dashboard> {
  @Inject
  private readonly dashboardService!: DashboardService;
  private keyword = '';
  private dashboards: Dashboard[] = [];
  private readonly size = 40;
  private isLoadMore = false;
  private canLoadMore = true;

  constructor(readonly excludeIds: DashboardId[], readonly currentFields: Field[]) {
    super();
  }

  get data() {
    return this.dashboards;
  }

  private get from() {
    return this.dashboards.length;
  }

  async search(keyword: string): Promise<Dashboard[]> {
    this.keyword = keyword;
    const { data, total } = await this.getDashboards(this.keyword, 0, this.size);
    this.dashboards = data;
    this.canLoadMore = this.from < total;
    return this.data;
  }

  async reload(): Promise<Dashboard[]> {
    const { data, total } = await this.getDashboards(this.keyword, 0, this.size);
    this.dashboards = data;
    this.canLoadMore = this.from < total;
    return this.data;
  }

  async loadMore(): Promise<Dashboard[]> {
    if (this.canLoadMore && !this.isLoadMore) {
      try {
        this.isLoadMore = true;
        const { total, data } = await this.getDashboards(this.keyword, this.from, this.size);
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

  private getDashboards(keyword: string, from: number, size: number): Promise<PageResult<Dashboard>> {
    return this.dashboardService.listDrillThroughDashboards(new ListDrillThroughDashboardRequest(this.excludeIds, this.currentFields, from, size, false));
  }
}
