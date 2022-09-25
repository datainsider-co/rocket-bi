/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:07 PM
 */

import { Field } from '@core/domain/Model';
import { Function } from '@core/domain/Model/Function/Function';
import { ScalarFunction } from '@core/domain/Model/Function/ScalarFunction/ScalaFunction';

export abstract class FieldRelatedFunction extends Function {
  field: Field;
  scalarFunction?: ScalarFunction;

  protected constructor(field: Field, scalarFunction?: ScalarFunction) {
    super();
    this.field = field;
    this.scalarFunction = scalarFunction;
  }

  /// Return types of functions
  /// First index is function family
  /// Second index is sub function [Optional]
  /// Ex: [Aggregation, Avg]
  abstract getFunctionTypes(): [string, string];

  setScalarFunction(scalarFunction: ScalarFunction): FieldRelatedFunction {
    this.scalarFunction = scalarFunction;
    return this;
  }
}
