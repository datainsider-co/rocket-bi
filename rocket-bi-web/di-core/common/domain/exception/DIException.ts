import { ApiExceptions } from '@/shared/enums/ApiExceptions';

const MessageAsMap = new Map<string, string>([
  [ApiExceptions.emailExisted, 'This email existed'],
  [ApiExceptions.emailInvalid, 'Your email invalid.'],
  [ApiExceptions.emailNotExisted, 'This email not existed.'],
  [ApiExceptions.emailRequired, 'Email required'],
  [ApiExceptions.emailVerificationRequired, 'You need to verify your registered email'],
  [ApiExceptions.alreadyExisted, 'This email existed. Please try again.'],
  [ApiExceptions.registrationRequired, 'You need to register account first.'],
  [ApiExceptions.verificationCodeInvalid, 'The code is invalid.'],
  // [ApiExceptions.internalError, 'Oops internal error! Try to refresh page or feel free contact us if issue persists.'],
  [ApiExceptions.invalidCredentials, 'Incorrect email or password.']
]);

export default class DIException {
  public message: string;
  public statusCode?: number;
  public reason?: string;

  constructor(message: string, statusCode?: number, reason?: string) {
    this.message = message;
    this.statusCode = statusCode;
    this.reason = reason;
  }

  static fromObject(ex: any & DIException): DIException {
    return new DIException(ex.message ?? ex.msg, ex.statusCode ?? ex.code, ex.reason);
  }

  static isDiException(ex: any): ex is DIException {
    return ex.constructor == DIException;
  }

  toString() {
    return `DIException::message ${this.message}, statusCode: ${this.statusCode}, reason: ${this.reason}`;
  }

  getPrettyMessage(): string {
    return MessageAsMap.get(this.reason ?? '') ?? this.message ?? 'Oops internal error! Try to refresh page or feel free contact us if issue persists.';
  }
}
