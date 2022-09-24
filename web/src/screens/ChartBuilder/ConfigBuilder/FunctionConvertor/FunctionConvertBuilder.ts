/*
 * @author: tvc12 - Thien Vi
 * @created: 5/24/21, 11:47 AM
 */

import { ChartType } from '@/shared';
import { FunctionConvertor } from '@/screens/ChartBuilder/ConfigBuilder/FunctionConvertor/FunctionConvertor';
import { FunctionConvertResolver } from '@/screens/ChartBuilder/ConfigBuilder/FunctionConvertor/FunctionConvertResolver';

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
