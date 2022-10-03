import { Function } from '@core/common/domain/model/function/Function';
import { FunctionType, WidgetId } from '@core/common/domain';

export class DynamicFunction extends Function {
  className: FunctionType = FunctionType.DynamicFunction;
  dynamicWidgetId!: WidgetId;
  baseFunction!: Function;
  finalFunction?: Function;

  constructor(widgetId: WidgetId, baseFunction: Function, finalFunction?: Function) {
    super();
    this.dynamicWidgetId = widgetId;
    this.baseFunction = baseFunction;
    this.finalFunction = finalFunction;
  }

  withFinalFunction(fnc: Function): DynamicFunction {
    this.finalFunction = fnc;
    return this;
  }

  static fromObject(obj: any): DynamicFunction {
    const baseFunction = Function.fromObject(obj.baseFunction);
    const finalFunction = obj.finalFunction ? Function.fromObject(obj.finalFunction) : void 0;
    return new DynamicFunction(obj.dynamicWidgetId, baseFunction, finalFunction);
  }

  static isDynamicFunction(obj: any): obj is DynamicFunction {
    return obj.className === FunctionType.DynamicFunction;
  }
}
