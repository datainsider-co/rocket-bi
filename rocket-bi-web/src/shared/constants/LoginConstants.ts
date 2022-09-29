export class LoginConstants {
  static readonly BUTTON_LOGIN = 'Log in';
  static readonly BUTTON_SIGNUP = 'Sign up';
  static readonly BUTTON_RESET_PASSWORD = 'Reset password';
  static readonly BUTTON_BACK_TO_LOGIN = 'Back to login';
  static readonly BUTTON_RESEND_EMAIL = 'Resend email';
  static readonly LABEL_RESEND_EMAIL = 'Resend email - check your email';
  static readonly EMAIL = 'EMAIL';
  static readonly PASSWORD = 'PASSWORD';
  static readonly MESSAGE_EMAIL_RESEND =
    'To login in website you need to verify your email. ' + 'We will send a link for you to verify email again. Do you want to resend email verify?';
  static readonly MESSAGE_FORGOT_PASSWORD =
    'To find your password, please type an email you used to login.' + ' We will send a link for you to reset your password.';
  static readonly MESSAGE_PASSWORD_RECOVERY =
    'An email with your password has been sent: check your mailbox in order to get the password needed.' +
    ' If you do not receive any mail please check the spam folder too.';
  static readonly LABEL_PASSWORD_RECOVERY = 'Password Recovery – email sent';
  static readonly MESSAGE_ERRORS = 'Incorrect email or password';
  static readonly MESSAGE_NOTIFY_FORGOT_PASSWORD = 'Your email incorrect, please try again.';
}

export class OauthType {
  static readonly DEFAULT = 'default';
  static readonly GOOGLE = 'gg';
  static readonly FACEBOOK = 'fb';
  static readonly UP = 'up';
}
