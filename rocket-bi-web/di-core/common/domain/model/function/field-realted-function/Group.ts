/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:00 PM
 */

import { Field, FunctionType, GetArrayElement } from '@core/common/domain/model';
import { getScalarFunction } from '@core/utils';
import { FunctionFamilyTypes } from '@/shared';
import { ScalarFunction } from '@core/common/domain/model/function/scalar-function/ScalaFunction';
import { FieldRelatedFunction } from '@core/common/domain/model/function/field-realted-function/FieldRelatedFunction';

export class Group extends FieldRelatedFunction {
  className = FunctionType.Group;

  constructor(field: Field, scalarFunction?: ScalarFunction) {
    super(field, scalarFunction);
  }

  static fromObject(obj: Group): Group {
    const field = Field.fromObject(obj.field);
    return new Group(field, getScalarFunction(obj.scalarFunction));
  }

  private static getGroupTypes(): [string, string] {
    return [FunctionFamilyTypes.groupBy, ''];
  }

  getFunctionTypes(): [string, string] {
    if (this.scalarFunction) {
      if (this.scalarFunction instanceof GetArrayElement) {
        return Group.getGroupTypes();
      } else {
        // Date histogram
        return [FunctionFamilyTypes.dateHistogram, this.scalarFunction.getFunctionType()];
      }
    } else {
      return Group.getGroupTypes();
    }
  }
}
