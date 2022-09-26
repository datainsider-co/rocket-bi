/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:30 PM
 */

import { Expression } from '@core/domain/Model/Column/Expression/Expression';
import { ExpressionType } from '@core/domain/Model';

export class DefaultExpression extends Expression {
  constructor(expr: string) {
    super(ExpressionType.Default, expr);
  }
}
