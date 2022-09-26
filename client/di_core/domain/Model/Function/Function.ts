import {
  Avg,
  Count,
  CountDistinct,
  FirstFunction,
  FunctionType,
  Group,
  LastFunction,
  Limit,
  Max,
  Min,
  OrderBy,
  Select,
  SelectDistinct,
  SelectExpression,
  Sum
} from '@core/domain/Model';
import { ClassNotFound } from '@core/domain/Exception/ClassNotFound';
import { FieldRelatedFunction } from '@core/domain/Model/Function/FieldRealtedFunction/FieldRelatedFunction';
import { ControlFunction } from '@core/domain/Model/Function/ControlFunction/ControlFunction';

export abstract class Function {
  abstract className: FunctionType;

  static fromObject(obj: any): FieldRelatedFunction | ControlFunction {
    switch (obj.className) {
      case FunctionType.Select:
        return Select.fromObject(obj);
      case FunctionType.SelectDistinct:
        return SelectDistinct.fromObject(obj);
      case FunctionType.Sum:
        return Sum.fromObject(obj);
      case FunctionType.Avg:
        return Avg.fromObject(obj);
      case FunctionType.Min:
        return Min.fromObject(obj);
      case FunctionType.Max:
        return Max.fromObject(obj);
      case FunctionType.Group:
        return Group.fromObject(obj);
      case FunctionType.Count:
        return Count.fromObject(obj);
      case FunctionType.CountDistinct:
        return CountDistinct.fromObject(obj);
      case FunctionType.First:
        return FirstFunction.fromObject(obj);
      case FunctionType.Last:
        return LastFunction.fromObject(obj);
      case FunctionType.OrderBy:
        return OrderBy.fromObject(obj);
      case FunctionType.Limit:
        return Limit.fromObject(obj);
      case FunctionType.Expression:
        return SelectExpression.fromObject(obj);
      default:
        throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }
}
