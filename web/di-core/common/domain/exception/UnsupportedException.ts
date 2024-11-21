import DIException from '@core/common/domain/exception/DIException';

export class UnsupportedException extends DIException {
  constructor(message: string) {
    super(message, -100, 'unsupported_type');
  }

  static isUnsupportedException(obj: any): obj is UnsupportedException {
    return obj.reason == 'unsupported_type';
  }
}
