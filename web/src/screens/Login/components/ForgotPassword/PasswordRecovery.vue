<template>
  <div class="container">
    <div class="group-label">
      <label class="label-text">
        {{ labelPasswordRecovery }}
      </label>
      <label class="regular-text">{{ messagePasswordRecovery }}</label>
    </div>
    <div class="btn-password-recovery">
      <button class="btn btn-primary" type="submit" @click.prevent="handleBackToLogin()">
        {{ btnBackToLogin }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import InputEmail from '../InputComponents/InputEmail.vue';
import { Component, Vue } from 'vue-property-decorator';
import { LoginConstants } from '@/shared/constants/login.constants';
import { Routers } from '@/shared';

@Component({
  components: {
    InputEmail
  }
})
export default class PasswordRecovery extends Vue {
  labelPasswordRecovery = LoginConstants.LABEL_PASSWORD_RECOVERY;
  messagePasswordRecovery = LoginConstants.MESSAGE_PASSWORD_RECOVERY;
  btnBackToLogin = LoginConstants.BUTTON_BACK_TO_LOGIN;

  handleBackToLogin() {
    this.$router.push({ name: Routers.Login });
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables.scss';

.label-text {
  @include regular-text;
  font-size: 16px !important;
  margin-top: 16px;
}

.regular-text {
  @include regular-text;
  letter-spacing: 0.2px !important;
  opacity: 0.5;
  font-size: 14px;
}

.group-label {
  display: flex;
  flex-flow: column;
  text-align: justify;
}

.btn-password-recovery {
  display: flex;
  justify-content: flex-start;
}

button {
  width: 142px;
  height: 42px;
  border-radius: 4px;
  margin: 8px 0 77px 0;
}
</style>
