/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 5:14 PM
 */

import { DIException } from '../../domain';

export class FormulaException extends DIException {
  constructor(message: string) {
    super(message, 0, 'formula_error');
  }

  static isFormulaException(ex: any): ex is FormulaException {
    return ex.reason == 'formula_error';
  }
}
