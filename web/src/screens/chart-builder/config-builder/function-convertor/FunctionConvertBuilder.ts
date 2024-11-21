/*
 * @author: tvc12 - Thien Vi
 * @created: 5/24/21, 11:47 AM
 */

import { ChartType } from '@/shared';
import { FunctionConvertor } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertor';
import { FunctionConvertResolver } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertResolver';

export class FunctionConvertBuilder {
  private readonly mapConvertors = new Map<ChartType, FunctionConvertor>();

  add(type: ChartType, convertor: FunctionConvertor): FunctionConvertBuilder {
    this.mapConvertors.set(type, convertor);
    return this;
  }

  build(): FunctionConvertResolver {
    return new FunctionConvertResolver(this.mapConvertors);
  }
}
