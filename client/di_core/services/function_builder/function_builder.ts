import { FunctionData } from '@/shared';
import { FieldRelatedFunction, Function } from '@core/domain/Model';

export abstract class FunctionBuilder {
  public abstract buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined;
}
