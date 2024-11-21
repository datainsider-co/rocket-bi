import { FunctionData } from '@/shared';
import { FieldRelatedFunction, Function } from '@core/common/domain/model';

export abstract class FunctionBuilder {
  public abstract buildFunction(functionData: FunctionData): FieldRelatedFunction | undefined;
}
