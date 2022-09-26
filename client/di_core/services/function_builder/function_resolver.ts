import { FunctionData } from '@/shared';
import { Function } from '@core/domain/Model';

export abstract class FunctionResolver {
  public abstract buildFunctions(listFunctionData: FunctionData[]): Function[];

  public abstract buildFunction(functionData: FunctionData): Function | undefined;
}
