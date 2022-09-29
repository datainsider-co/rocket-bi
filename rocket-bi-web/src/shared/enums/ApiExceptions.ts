export enum ApiExceptions {
  invalidCredentials = 'invalid_credentials',
  emailExisted = 'email_existed',
  emailNotExisted = 'email_not_existed',
  emailInvalid = 'email_invalid',
  emailRequired = 'email_required',
  emailVerificationRequired = 'email_verification_required',
  authTypeUnsupported = 'auth_type_unsupported',
  phoneExisted = 'phone_existed',
  phoneInvalid = 'phone_invalid',
  phoneNotExisted = 'phone_not_existed',
  phoneRequired = 'phone_required',
  quotaExceed = 'quota_exceed',
  registrationRequired = 'registration_required',
  verificationCodeInvalid = 'verification_code_invalid',
  notAuthenticated = 'not_authenticated',
  unauthorized = 'not_allowed',
  notFound = 'not_found',
  alreadyExisted = 'already_existed',
  notSupported = 'not_supported',
  dbExecuteError = 'db_execute_error',
  expired = 'expired',
  badRequest = 'bad_request',
  internalError = 'internal_error'
}

export enum DIExceptions {
  formulaError = 'formula_error'
}
