/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 5:14 PM
 */

import { DIExceptions } from '@/shared';
import { DIException } from '@core/domain';

export class FormulaException extends DIException {
  constructor(message: string) {
    super(message, 0, DIExceptions.formulaError);
  }

  static isFormulaException(ex: any): ex is FormulaException {
    return ex.reason == DIExceptions.formulaError;
  }
}
