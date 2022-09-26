import { FieldRelatedFunction, Function } from '@core/domain/Model';
import { ClassNotFound } from '@core/domain/Exception/ClassNotFound';
import { StringUtils } from '@/utils/string.utils';

export class TableColumn {
  name: string;
  function: FieldRelatedFunction;
  isHorizontalView: boolean;
  /**
   * @deprecated Server will not usage
   */
  isCollapse: boolean;

  isCalcGroupTotal: boolean;
  isCalcMinMax: boolean;
  formatterKey?: string;
  isDynamicFunction: boolean;
  dynamicFunctionId?: number;

  constructor(
    name: string,
    func: FieldRelatedFunction,
    isHorizontalView = false,
    isCollapse = false,
    isCalcGroupTotal = false,
    isCalcMinMax?: boolean,
    formatterKey?: string,
    isDynamicFunction?: boolean,
    dynamicFunctionId?: number
  ) {
    this.name = name;
    this.function = func;
    this.isHorizontalView = isHorizontalView;
    this.isCollapse = isCollapse;
    this.isCalcGroupTotal = isCalcGroupTotal;
    this.isCalcMinMax = isCalcMinMax ?? false;
    this.formatterKey = formatterKey;
    this.isDynamicFunction = isDynamicFunction ?? false;
    this.dynamicFunctionId = dynamicFunctionId;
  }

  get normalizeName() {
    // return StringUtils.removeWhiteSpace(StringUtils.removeWhiteSpace(StringUtils.camelToCapitalizedStr(this.name)).replace('.', ''));
    return StringUtils.toCamelCase(this.name);
  }

  static fromObject(obj: any & TableColumn): TableColumn {
    const func = Function.fromObject(obj.function);
    if (func instanceof FieldRelatedFunction)
      return new TableColumn(
        obj.name,
        func,
        obj.isHorizontalView,
        obj.isCollapse,
        obj.isCalcGroupTotal ?? true,
        obj.isCalcMinMax,
        obj.formatterKey,
        obj.isDynamicFunction,
        obj.dynamicFunctionId
      );
    else {
      throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }

  copyWith(obj: {
    name?: string;
    fieldRelatedFunction?: FieldRelatedFunction;
    isHorizontalView?: boolean;
    isCollapse?: boolean;
    isCalcGroupTotal?: boolean;
    isCalcMinMax?: boolean;
    formatterKey?: string;
    isDynamicFunction?: boolean;
    dynamicFunctionId?: number;
  }) {
    return new TableColumn(
      obj.name ?? this.name,
      obj.fieldRelatedFunction ?? this.function,
      obj.isHorizontalView ?? this.isHorizontalView,
      obj.isCollapse ?? this.isCollapse,
      obj.isCalcGroupTotal ?? this.isCalcGroupTotal,
      obj.isCalcMinMax ?? this.isCalcMinMax,
      obj.formatterKey ?? this.formatterKey,
      obj.isDynamicFunction ?? this.isDynamicFunction,
      obj.dynamicFunctionId ?? this.dynamicFunctionId
    );
  }
}
