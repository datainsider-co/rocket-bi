import DIException from '@core/common/domain/exception/DIException';

export class ClassNotFound extends DIException {
  constructor(message: string) {
    super(message, 500, 'class_not_found');
  }
}
