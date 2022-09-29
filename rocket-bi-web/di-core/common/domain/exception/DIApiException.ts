import { DIException } from '@core/common/domain/exception/DIException';

export class DIApiException extends DIException {
  constructor(message: string, statusCode?: number, reason?: string) {
    super(message, statusCode, reason);
  }

  static fromObject(object: any) {
    return new DIApiException(object.message ?? object.msg, object.code, object.reason);
  }
}
