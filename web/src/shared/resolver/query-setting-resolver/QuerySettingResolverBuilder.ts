/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:32 AM
 */

import { ChartType } from '@/shared';
import { QuerySettingHandler, QuerySettingResolver } from '@/shared/resolver';

export class QuerySettingResolverBuilder {
  private mapCreator = new Map<ChartType, QuerySettingHandler>();

  add(chartType: ChartType, fn: QuerySettingHandler): QuerySettingResolverBuilder {
    this.mapCreator.set(chartType, fn);
    return this;
  }

  build(): QuerySettingResolver {
    return new QuerySettingResolver(this.mapCreator);
  }
}
