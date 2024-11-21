<template>
  <b-col cols="7">
    <div class="oath-form-container">
      <h2 class="unselectable">Welcome to RocketBI</h2>
      <h4 class="unselectable">Register Your RocketBI Account</h4>
      <div id="login-form">
        <div class="user-name-section">
          <DiInputComponent2
            id="input-first-name"
            v-model="registerInfo.firstName"
            label="First Name"
            autofocus
            placeholder="Input first name..."
            type="text"
            :error="firstNameErrorMsg"
            requireIcon
          />
          <DiInputComponent2
            id="input-last-name"
            v-model="registerInfo.lastName"
            label="Last Name"
            placeholder="Input last name..."
            type="text"
            :error="lastNameErrorMsg"
            requireIcon
          />
        </div>
        <DiInputComponent2
          id="input-company-name"
          v-model="registerInfo.companyName"
          label="Company Name"
          placeholder="Input company name..."
          type="text"
          :error="companyErrorMsg"
          requireIcon
        />
        <DiInputComponent2
          id="input-domain-name"
          v-model="registerInfo.subDomain"
          label="Subdomain"
          placeholder="Input subdomain..."
          type="text"
          :error="subDomainErrorMsg"
          requireIcon
          :suffix-text="domain"
        />
        <DiInputComponent2
          id="input-email"
          v-model="registerInfo.workEmail"
          label="Email"
          placeholder="Input email..."
          type="email"
          :error="emailErrorMessage"
          requireIcon
        />
        <DiInputComponent2
          id="input-password"
          v-model="registerInfo.password"
          isPassword
          label="Password"
          :error="passwordErrorMessage"
          placeholder="Input password..."
          type="password"
          requireIcon
        />
        <VueRecaptcha
          ref="recaptcha"
          class="captcha"
          @expired="handleCaptchaExpired"
          @verify="verifyMethod"
          @error="handleCaptchaError"
          sitekey="6LeCshUcAAAAABseKNOIQVDb_a9pJ5UezrYpwW_n"
        />
      </div>
      <div id="login-actions">
        <DiButton
          title="Register"
          ref="submitButton"
          primary-2
          :disabled="isLoading"
          :isLoading="isLoading"
          id="register-btn"
          @click="handleRegister(registerInfo)"
        />
      </div>
    </div>
  </b-col>
</template>
<script lang="ts">
import { Vue, Component, Ref, Watch } from 'vue-property-decorator';
import DiInputComponent2 from '@/screens/login-v2/components/DiInputComponent2.vue';
import { email, required } from 'vuelidate/lib/validators';
import Swal from 'sweetalert2';
import { RegisterInfo, OrganizationService } from '@core/organization';
import { Status } from '@/shared';
import { VueRecaptcha } from 'vue-recaptcha';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { PopupUtils, StringUtils } from '@/utils';
import { Inject } from 'typescript-ioc';

@Component({
  components: {
    DiInputComponent2,
    VueRecaptcha
  },
  validations: {
    registerInfo: {
      firstName: { required },
      lastName: { required },
      companyName: { required },
      subDomain: { required },
      workEmail: { required, email },
      password: { required }
    }
  }
})
export default class RegisterPanel extends Vue {
  $alert!: typeof Swal;

  private status = Status.Loaded;
  private registerInfo: RegisterInfo = RegisterInfo.default();
  private errorMessage = '';

  @Ref()
  private readonly submitButton?: HTMLButtonElement;

  @Ref()
  private readonly form?: HTMLFormElement;

  @Ref()
  private readonly recaptcha?: VueRecaptcha;

  @Inject
  private readonly organizationService!: OrganizationService;

  private get isValidRegisterInfo(): boolean {
    return this.registerInfo.isValidRegisterInfo;
  }

  private get domain() {
    return window.appConfig.SAAS_DOMAIN;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
    PopupUtils.showError(ex.message);
    Log.error(`RegisterModal::showError::error::`, ex);
  }

  mounted() {
    this.reset();
  }

  private async handleRegister(registerInfo: RegisterInfo) {
    try {
      Log.debug('RegisterModal::handleRegister::registerInfo::', registerInfo, this.valid());
      this.showLoading();
      if (this.valid()) {
        await this.ensureSubDomain(registerInfo.subDomain);
        const organization = await this.organizationService.register(registerInfo);
        this.redirectToDomain(organization.domain);
      }
      this.showLoaded();
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
  }

  public valid(): boolean {
    this.$v.$touch();
    return !this.$v.$invalid;
  }

  private async ensureSubDomain(subDomain: string) {
    const isExistedDomain = await this.organizationService.checkExistedSubDomain(subDomain);
    if (isExistedDomain) {
      throw new DIException(`Your sub domain is used. Please select another name.`);
    }
  }

  private redirectToDomain(subDomain: string) {
    const newDomain = `https://${subDomain}.${this.domain}`;
    window.open(newDomain, '_self');
  }

  private reset() {
    this.showLoaded();
    this.errorMessage = '';
    this.registerInfo = RegisterInfo.default();
  }

  private verifyMethod(token: string) {
    Log.debug('verifyMethod::token::', token);
    this.registerInfo.withReCaptchaToken(token);
    this.submitButton?.focus();
  }

  private handleCaptchaError(error: any) {
    // this.showError(new DIException(`Your captcha is invalid. Please re-verify again.`));
    this.resetCaptchaToken();
  }

  private handleCaptchaExpired() {
    // this.showError(new DIException(`Your captcha is expired. Please re-verify again. `));
    this.resetCaptchaToken();
  }

  private resetCaptchaToken() {
    this.registerInfo.withReCaptchaToken('');
  }

  @Watch('registerInfo.companyName')
  private handleCompanyChange(companyName: string) {
    const unsignText = StringUtils.vietnamese(companyName);
    this.registerInfo.subDomain = StringUtils.toSnakeCase(unsignText).replaceAll('_', '-');
  }

  private get firstNameErrorMsg(): string {
    Log.debug('firstNameErrorMsg', this.$v.firstName?.$error);
    if (!this.$v.registerInfo.firstName?.$error) {
      return '';
    }
    if (!this.$v.registerInfo.firstName?.required) {
      return 'First Name is required!';
    }

    return '';
  }

  private get lastNameErrorMsg(): string {
    if (!this.$v.registerInfo.lastName?.$error) {
      return '';
    }
    if (!this.$v.registerInfo.lastName.required) {
      return 'Last Name is required!';
    }

    return '';
  }

  private get companyErrorMsg(): string {
    if (!this.$v.registerInfo.companyName?.$error) {
      return '';
    }
    if (!this.$v.registerInfo.companyName.required) {
      return 'Company Name is required!';
    }

    return '';
  }

  private get subDomainErrorMsg(): string {
    if (!this.$v.registerInfo.subDomain?.$error) {
      return '';
    }
    if (!this.$v.registerInfo.subDomain?.required) {
      return 'Subdomain is required!';
    }

    return '';
  }

  private get emailErrorMessage(): string {
    if (!this.$v.registerInfo.workEmail?.$error) {
      return '';
    }
    if (!this.$v.registerInfo.workEmail?.required) {
      return 'Email is required!';
    }
    return 'Invalid email format';
  }

  private get passwordErrorMessage(): string {
    if (!this.$v.registerInfo.password?.$error) {
      return '';
    }
    if (!this.$v.registerInfo.password?.required) {
      return 'Password is required!';
    }

    return '';
  }
}
</script>
