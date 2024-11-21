export class UserResetPasswordRequest {
  constructor(public email: string, public newPassword: string, public confirmPassword: string, public verifyCode: string) {}

  static default() {
    return new UserResetPasswordRequest('', '', '', '');
  }

  setEmail(email: string) {
    this.email = email;
  }

  setVerifyCode(code: string) {
    this.verifyCode = code;
  }

  setPassword(pass: string) {
    this.newPassword = pass;
  }
}
