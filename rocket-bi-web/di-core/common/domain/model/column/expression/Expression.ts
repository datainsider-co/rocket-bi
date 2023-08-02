/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:30 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 4/19/21, 4:24 PM
 */
/* eslint @typescript-eslint/no-use-before-define: 0 */

import { DefaultExpression, ExpressionType, MaterializedExpression } from '@core/common/domain/model';

export abstract class Expression {
  protected constructor(public defaultType: ExpressionType, public expr: string) {}

  static fromObject(obj: any): Expression {
    switch (obj.defaultType) {
      case ExpressionType.Materialized:
        return new MaterializedExpression(obj.expr);
      default:
        return new DefaultExpression(obj.expr);
    }
  }
}
