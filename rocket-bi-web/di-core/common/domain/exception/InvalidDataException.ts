/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 5:14 PM
 */

import { DIException } from '@core/common/domain/exception/DIException';

export class InvalidDataException extends DIException {
  constructor(message: string) {
    super(message, -200, 'invalid_data');
  }

  static isInvalidDataException(obj: any): obj is InvalidDataException {
    return obj.reason == 'invalid_data';
  }
}
