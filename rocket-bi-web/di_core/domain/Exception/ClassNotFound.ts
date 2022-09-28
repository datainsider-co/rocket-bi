import { DIException } from '@core/domain/Exception/DIException';

export class ClassNotFound extends DIException {
  constructor(message: string) {
    super(message, 500, 'class_not_found');
  }
}
