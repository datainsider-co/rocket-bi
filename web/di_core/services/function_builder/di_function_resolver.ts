import { FunctionResolver } from '@core/services/function_builder/function_resolver';
import { FieldRelatedFunction, Function, GetArrayElement } from '@core/domain/Model';
import { FunctionData } from '@/shared';
import { Inject } from 'typescript-ioc';
import { MainFunctionBuilder } from '@core/services/function_builder/function_builder.impl';
import { ChartUtils } from '@/utils';

export class DiFunctionResolver implements FunctionResolver {
  constructor(@Inject private mainFunctionBuilderEngine: MainFunctionBuilder) {}

  buildFunction(functionData: FunctionData): Function | undefined {
    const fn = this.mainFunctionBuilderEngine.buildFunction(functionData);
    if (fn && functionData.isNested) {
      if (fn.scalarFunction) {
        fn.scalarFunction.withScalarFunction(new GetArrayElement());
      } else {
        fn.setScalarFunction(new GetArrayElement());
      }
    }
    return fn;
  }

  buildFunctions(listFunctionData: FunctionData[]): Function[] {
    return listFunctionData
      .flatMap(functionData => {
        const func = this.buildFunction(functionData);
        if (func instanceof FieldRelatedFunction) {
          const orderBy = ChartUtils.buildOrderFunction(func, functionData.sorting, functionData.isShowNElements, functionData.numElemsShown);
          return [func, orderBy];
        } else {
          return [func, void 0];
        }
      })
      .filter((func): func is Function => !!func);
  }
}
