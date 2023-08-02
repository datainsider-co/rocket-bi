<template>
  <b-modal ref="modal" id="passwordValidateModal" centered no-close-on-backdrop no-close-on-esc @cancel="handleClose" @hidden="reset()">
    <template #modal-header>
      <h5 class="modal-title">Password Validation</h5>
    </template>
    <template v-slot:default="">
      <p class="mb-2">Password</p>
      <DiInputComponent
        :id="genInputId('passwordConfig-name')"
        autocomplete="new-password"
        autofocus
        placeholder="Enter password"
        v-model="inputValue"
        type="password"
        variant="dark"
        @enter="submitPassword(inputValue, ...arguments)"
      />
      <div class="error mt-1">{{ errorMsg }}</div>
    </template>
    <template #modal-footer>
      <b-button :id="genBtnId('cancel')" class="flex-fill h-42px" variant="secondary" @click="handleClose" event="cancel-password">
        Cancel
      </b-button>
      <b-button :id="genBtnId('validate')" class="flex-fill h-42px" variant="primary" @click="submitPassword(inputValue, ...arguments)">
        Access
      </b-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import { SecurityUtils, StringUtils } from '@/utils';
import { BModal } from 'bootstrap-vue';
import { Dashboard as CoreDashboard, DIException, Directory, PasswordConfig, Passwordable } from '@core/common/domain';
import { Log } from '@core/utils';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';

@Component({
  components: {}
})
export default class PasswordModal extends Vue {
  @Ref()
  private modal!: BModal;

  private passwordConfig: PasswordConfig | null = null;

  private inputValue = '';

  private errorMsg = '';
  private isShowPassword = false;

  private onCompleted: (() => void) | null = null;

  private onCancel: (() => void) | null = null;
  show(passwordConfig: PasswordConfig, onCompleted: () => void, onCanceled?: () => void) {
    this.reset();
    this.passwordConfig = passwordConfig;
    this.onCancel = onCanceled || null;
    this.onCompleted = onCompleted;
    this.showModal();
  }

  private showModal() {
    this.modal?.show();
  }

  private hideModal() {
    Log.debug('hideModal', this.modal);
    this.modal?.hide();
  }

  private reset() {
    Log.debug('reset');
    this.isShowPassword = false;
    this.passwordConfig = null;
    this.inputValue = '';
    this.errorMsg = '';
    this.onCancel = null;
    this.onCompleted = null;
  }

  private get currentType(): string {
    return this.isShowPassword ? 'text' : 'password';
  }

  private toggleShowPassword() {
    this.isShowPassword = !this.isShowPassword;
  }

  private validate(password: string) {
    if (StringUtils.isEmpty(password)) {
      throw new DIException('Password is required!');
    }
    if (!this.passwordConfig?.hashedPassword) {
      throw new DIException('Password not found!');
    }
    const hashedInput = SecurityUtils.hash(password);
    if (this.passwordConfig?.hashedPassword !== hashedInput) {
      throw new DIException('Password is incorrect!');
    }
  }

  private async submitPassword(password: string, event: Event) {
    try {
      event.preventDefault();
      this.errorMsg = '';
      await this.validate(password);
      if (this.onCompleted) {
        this.onCompleted();
      }
      this.$nextTick(() => {
        this.hideModal();
      });
    } catch (ex) {
      Log.error(ex);
      this.errorMsg = ex.message;
    }
  }

  private handleClose() {
    Log.debug('handleClose');
    this.onCancel ? this.onCancel() : void 0;
    this.hideModal();
  }

  requirePassword(directory: Directory, ownerId: string, onCompleted: () => void, onCanceled?: () => void): void {
    if (!directory) {
      throw new DIException('Dashboard not found!');
    }
    const curDirectory = Directory.fromObject(directory);
    const isOwner: boolean = this.isOwner(ownerId);
    const isPasswordRequired = Passwordable.is(curDirectory.data) && curDirectory.data.config?.enabled;
    Log.debug('requirePassword::isOwner', isOwner, 'isPasswordRequired', isPasswordRequired);
    if (isOwner || !isPasswordRequired) {
      onCompleted();
    } else if (isPasswordRequired) {
      this.show((curDirectory.data as Passwordable).config!, onCompleted, onCanceled);
    }
  }

  private isOwner(resourceOwner: string): boolean {
    const loggedUsername = AuthenticationModule.userProfile.username;
    Log.debug('isOwner::loggedUsername', loggedUsername, 'resource owner::', resourceOwner);

    return loggedUsername === resourceOwner;
  }
}
</script>
