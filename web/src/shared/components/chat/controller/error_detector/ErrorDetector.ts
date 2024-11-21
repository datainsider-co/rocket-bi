import { DIException } from '@core/common/domain';

export abstract class ErrorDetector {
  static isAPIKeyNotFound(ex: DIException): boolean {
    return ex.statusCode === 500 && ex.message === 'No user was found.';
  }

  static isQuotaException(ex: DIException): boolean {
    return ex.reason === 'insufficient_quota';
  }
}
