/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:32 AM
 */

import { ChartType } from '@/shared';
import { VizSettingHandler, VizSettingResolver } from '@/shared/resolver';

export class VizSettingResolverBuilder {
  private handlers: Map<ChartType, VizSettingHandler> = new Map<ChartType, VizSettingHandler>();

  add(type: ChartType, handler: VizSettingHandler) {
    this.handlers.set(type, handler);
    return this;
  }

  build(): VizSettingResolver {
    return new VizSettingResolver(this.handlers);
  }
}
