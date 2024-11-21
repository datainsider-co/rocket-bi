/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:30 PM
 */

import { Expression } from '@core/common/domain/model/column/expression/Expression';
import { ExpressionType } from '@core/common/domain/model';

export class DefaultExpression extends Expression {
  constructor(expr: string) {
    super(ExpressionType.Default, expr);
  }
}
