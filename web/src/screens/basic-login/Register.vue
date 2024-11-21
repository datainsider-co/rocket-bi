<template>
  <div class="register-screen">
    <div class="register-screen-left-panel">
      <div class="register-screen-left-panel-body">
        <div class="login-form">
          <div class="register-screen-left-panel-body-form">
            <div class="company-logo-name-component register-screen-left-panel-body-form-logo">
              <LogoComponent width="40px" height="40px" :company-logo-url="logoUrl" :allowShowLoading="false" />
              <div class="company-logo-name-component--name unselectable">{{ companyName }}</div>
            </div>
            <div class="register-screen-left-panel-body-form-header">
              <div class="register-screen-left-panel-body-form-header-title">Register Your RocketBI Account</div>
              <!--              <div v-if="isShowAccountExample" class="d-none register-screen-left-panel-body-form-header-subtitle">-->
              <!--                You can use test account ({{ usernameExample }}/{{ passwordExample }} to login.-->
              <!--              </div>-->
            </div>
            <RegisterForm></RegisterForm>
          </div>
        </div>
      </div>
      <!--      <div class="deco1">-->
      <!--        <img id="deco1" alt="deco1" src="@/assets/icon/ic_deco_1.svg" />-->
      <!--      </div>-->
      <div class="deco2">
        <img alt="deco2" src="@/assets/icon/ic_deco_2.svg" />
      </div>
    </div>

    <div class="register-screen-right-panel col-md-8 w-100 p-0 d-none d-xl-block">
      <div>
        <div class="deco3">
          <img alt="deco3" src="@/assets/icon/ic_deco_3.svg" />
        </div>
        <div class="deco-ill">
          <img alt="deco illustration" src="@/assets/icon/ic_illustration.svg" />
        </div>
        <div class="deco4">
          <img alt="deco4" src="@/assets/icon/ic_deco_4.svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import CompanyLogoNameComponent from '@/screens/organization-settings/components/organization-logo-modal/CompanyLogoNameComponent.vue';
import ForgotPasswordForm from '@/screens/login/components/forgot-password/ForgotPasswordForm.vue';
import LoginForm from '@/screens/basic-login/components/LoginForm.vue';
import ResetPasswordForm from '@/screens/login/components/forgot-password/ResetPasswordForm.vue';
import Swal from 'sweetalert2';
import RegisterForm from '@/screens/basic-login/components/RegisterForm.vue';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
import LogoComponent from '@/screens/organization-settings/components/organization-logo-modal/LogoComponent.vue';

@Component({
  components: {
    ForgotPasswordForm,
    LoginForm,
    ResetPasswordForm,
    CompanyLogoNameComponent,
    DiInputComponent,
    RegisterForm,
    LogoComponent
  }
})
export default class Register extends Vue {
  $alert!: typeof Swal;
  errorMessage = '';

  @Ref()
  private readonly loginForm?: LoginForm;

  @Ref()
  private readonly forgotPasswordForm?: ForgotPasswordForm;

  @Ref()
  private readonly resetPasswordForm?: ResetPasswordForm;

  private get logoUrl(): string {
    return OrganizationStoreModule.organization.thumbnailUrl || '';
  }

  private get companyName(): string {
    return OrganizationStoreModule.organization.name || '';
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';

#app {
  height: 100%;
}

.register-screen {
  min-height: 1024px;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;

  &-left-panel {
    background-color: var(--primary);
    height: 100%;
    display: flex;
    position: relative;
    width: 100%;
    z-index: 0;

    .deco1 {
      position: absolute;
      left: 33%;
      bottom: 12px;
    }

    .deco2 {
      position: absolute;
      top: 16px;
      right: 0;
    }

    &-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &-form {
        background: var(--secondary);
        //height: 349px;
        width: 370px;
        border-radius: 4px;
        position: relative;

        &-logo {
          width: 370px;
          text-align: left;
          position: absolute;
          left: 0;
          top: -56px;

          color: var(--text-color);
        }

        &-error {
          margin-top: 4px;
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;

          word-break: break-word;
        }

        &-header {
          padding: 16px 16px 12px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;

          &-title {
            @include regular-text(0.77px, var(--text-color));
            font-size: 18px;
            margin-bottom: 8px;
            height: 21px;

            display: flex;
            align-items: center;
            //box-sizing: border-box;
          }

          &-subtitle {
            @include regular-text(0.2px, var(--text-color));
            line-height: 1.43;
            opacity: 0.8;
          }
        }

        &-body {
          padding: 16px 4px 0px 16px;
          opacity: 0.8;
          text-align: left;

          .di-input-component--label {
            font-size: 12px;
            line-height: 14px;
          }

          &-email {
            margin-bottom: 16px;
            i {
              font-size: 16px !important;
              margin-right: 12px;
            }
          }

          &-password {
            i {
              font-size: 12px !important;
            }
          }
        }

        &-action {
          padding: 8px 16px 24px;
          display: flex;
          align-items: center;
          justify-content: center;

          &-login {
            width: 146px;
            height: 40px;
          }
        }

        .register-screen-left-panel-body-form-action--google-active {
          padding: 8px 16px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          column-gap: 8px;

          .register-screen-left-panel-body-form-action-login {
            flex: 1;
            width: unset;
            height: 40px;
          }

          .register-screen-left-panel-body-form-action-google-login {
            flex: 1;
            display: flex;
            height: 40px;
          }
        }
      }
    }
  }

  &-right-panel {
    background-color: var(--accent);
    height: 100%;
    position: relative;
    width: 100%;

    .deco3 {
      position: absolute;
      right: 0;
    }

    .deco-ill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      margin-left: 20.8%;
      display: flex;
      align-items: center;
      img {
        position: absolute;
        width: 67.6%;
        height: 68.9%;
      }
    }

    .deco4 {
      bottom: 0;
      left: 20%;
      position: absolute;
      right: 20%;
    }
  }
}
</style>
