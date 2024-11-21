<template>
  <div class="register">
    <!--      <div class="register-header">Create Your Unlock CI Account</div>-->
    <form ref="form" class="register-body register-screen-left-panel-body-form-body" @submit.prevent="handleRegister(registerInfo)">
      <vuescroll style="margin-bottom: 16px; padding-right: 12px">
        <div>
          <div class="d-flex align-items-center">
            <div class="register-form-control w-50 mr-3">
              <DiInputComponent
                label="First Name *"
                placeholder="First Name"
                autofocus
                autocomplete="off"
                v-model="registerInfo.firstName"
                required
              ></DiInputComponent>
            </div>
            <div class="register-form-control w-50 mb-3">
              <DiInputComponent label="Last Name *" placeholder="Last Name" autocomplete="off" v-model="registerInfo.lastName" required></DiInputComponent>
            </div>
          </div>
          <div class="register-form-control">
            <DiInputComponent
              label="Company Name *"
              placeholder="Enter your company name"
              autocomplete="off"
              v-model="registerInfo.companyName"
              required
            ></DiInputComponent>
          </div>
          <div class="register-form-control d-flex">
            <DiInputComponent
              class="w-100"
              label="Subdomain *"
              placeholder="Enter your subdomain"
              autocomplete="off"
              pattern="^[a-zA-Z0-9\\-]+$"
              title="Please use only alphanumeric and minus (-) characters."
              minlength="2"
              required
              v-model="registerInfo.subDomain"
            ></DiInputComponent>
            <span class="ml-3 align-self-center" style="margin-top: 28px; font-weight: 500; font-size: 14px">.{{ domain }}</span>
          </div>
          <div class="register-form-control">
            <DiInputComponent
              label="Work Email *"
              type="email"
              placeholder="Enter work email"
              title="Please input valid email address"
              autocomplete="off"
              v-model="registerInfo.workEmail"
              required
            ></DiInputComponent>
          </div>
          <!--        <div class="register-form-control">-->
          <!--          <DiInputComponent label="Phone Number *" placeholder="Enter phone number" autocomplete="off" v-model="registerInfo.phoneNumber"></DiInputComponent>-->
          <!--        </div>-->
          <div class="register-form-control mb-0">
            <DiInputComponent
              type="password"
              label="Password *"
              placeholder="Enter your password"
              autocomplete="new-password"
              minlength="6"
              required
              v-model="registerInfo.password"
            ></DiInputComponent>
          </div>
          <input type="submit" class="d-none" />
        </div>
        <div class="d-flex flex-column w-100 custom-footer">
          <VueRecaptcha
            ref="recaptcha"
            class="captcha"
            @expired="handleCaptchaExpired"
            @verify="verifyMethod"
            @error="handleCaptchaError"
            sitekey="6LeCshUcAAAAABseKNOIQVDb_a9pJ5UezrYpwW_n"
          />
          <button
            ref="submitButton"
            type="submit"
            title="Register"
            :is-loading="isLoading"
            :disabled="isLoading"
            class="btn btn-primary w-50 h-42px submit-button ml-auto mr-auto"
            primary
            @submit.prevent="handleRegister(registerInfo)"
          >
            <div class="flex align-items-center">
              <i v-if="isLoading" class="fa fa-spin fa-spinner mr-2"></i>
              Register
            </div>
          </button>
        </div>
      </vuescroll>
    </form>
    <div class="register-screen-left-panel-body-form-error">
      <div class="display-error">
        {{ errorMessage }}
      </div>
    </div>
    <div class="register-screen-left-panel-body-form-register"></div>
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { OrganizationService, RegisterInfo } from '@core/organization';
import { Routers, Status } from '@/shared';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import Swal from 'sweetalert2';
import { Inject } from 'typescript-ioc';
import { VueRecaptcha } from 'vue-recaptcha';
import { RouterUtils, StringUtils } from '@/utils';
import DiButton from '@/shared/components/common/DiButton.vue';

@Component({
  components: { DiButton, DiInputComponent, VueRecaptcha }
})
export default class RegisterForm extends Vue {
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
    Log.error(`RegisterModal::showError::error::`, ex);
  }

  mounted() {
    this.reset();
  }

  private async handleRegister(registerInfo: RegisterInfo) {
    try {
      Log.debug('RegisterModal::handleRegister::registerInfo::', registerInfo);
      this.showLoading();
      await this.ensureSubDomain(registerInfo.subDomain);
      const organization = await this.organizationService.register(registerInfo);
      this.redirectToDomain(organization.domain);
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception);
    }
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
}
</script>

<style lang="scss">
.register {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .captcha {
    display: flex;
    height: 76px;
    justify-content: center;

    > div > div,
    iframe {
      height: 76px;
    }
  }
  &-header {
    margin-top: 8px;
    font-size: 24px;
    line-height: 28px;
    letter-spacing: 0.2px;
    color: #000;
  }

  &-body {
    width: 100%;
    position: relative;
    padding: 16px;
    .register-form-control {
      .di-input-component--label {
        margin-bottom: 8px;
        font-weight: 500;
        line-height: 16px;
      }

      .di-input-component--input {
        input {
          color: var(--secondary-text-color);
          &::placeholder {
            color: var(--secondary-text-color);
          }
        }
      }

      &:not(:last-child) {
        margin-bottom: 16px;
      }
    }

    .submit-button {
      margin: 16px 16px 8px;
    }
  }

  .custom-footer {
    padding-top: 12px;
    background: var(--secondary);
    position: sticky;
    bottom: 0;
    left: 0;
  }
}
</style>
