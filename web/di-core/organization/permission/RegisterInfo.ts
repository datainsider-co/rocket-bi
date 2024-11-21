import { StringUtils } from '@/utils';

export class RegisterInfo {
  constructor(
    public firstName: string,
    public lastName: string,
    public companyName: string,
    public subDomain: string,
    public phoneNumber: string,
    public workEmail: string,
    public reCaptchaToken: string,
    public password: string
  ) {}

  static fromObject(obj: RegisterInfo) {
    return new RegisterInfo(obj.firstName, obj.lastName, obj.companyName, obj.subDomain, obj.phoneNumber, obj.workEmail, obj.password, obj.reCaptchaToken);
  }

  withReCaptchaToken(captchaToken: string) {
    this.reCaptchaToken = captchaToken;
    return this;
  }

  static default(): RegisterInfo {
    return new RegisterInfo('', '', '', '', '', '', '', '');
  }

  get isEmptyReCaptchaToken() {
    return StringUtils.isEmpty(this.reCaptchaToken);
  }

  get isValidRegisterInfo() {
    const isNotEmptyFirstName = StringUtils.isNotEmpty(this.firstName);
    const isNotEmptyLastName = StringUtils.isNotEmpty(this.lastName);
    const isNotEmptyCompanyName = StringUtils.isNotEmpty(this.companyName);
    const isNotEmptySubDomain = StringUtils.isNotEmpty(this.subDomain);
    const isNotEmptyRecaptchaToken = StringUtils.isNotEmpty(this.reCaptchaToken);
    const isNotEmptyEmail = StringUtils.isNotEmpty(this.workEmail);
    const isNotEmptyPassword = StringUtils.isNotEmpty(this.password);
    return (
      isNotEmptyFirstName &&
      isNotEmptyLastName &&
      isNotEmptyCompanyName &&
      isNotEmptySubDomain &&
      isNotEmptyRecaptchaToken &&
      isNotEmptyEmail &&
      isNotEmptyPassword
    );
  }
}
