<template>
  <b-modal ref="modal" id="passwordValidateModal" centered no-close-on-backdrop @close="handleClose">
    <template v-slot:modal-header="{ close }">
      <h5 class="modal-title">Password Validation</h5>
      <p class="h5 mb-2 btn-ghost">
        <b-icon-x role="button" :id="genBtnId('close')" variant="light" @click="close()"></b-icon-x>
      </p>
    </template>
    <template v-slot:default="">
      <p class="mb-2">Password</p>
      <b-form-input
        :id="genInputId('passwordConfig-name')"
        v-model.trim="inputValue"
        variant="dark"
        placeholder="Enter password"
        class="p-3 h-42px"
        autocomplete="off"
        type="password"
        v-on:keydown.enter="submitPassword(inputValue)"
        autofocus
      ></b-form-input>
      <div class="error mt-1">{{ errorMsg }}</div>
    </template>
    <template #modal-footer>
      <b-button :id="genBtnId('cancel')" class="flex-fill h-42px" variant="secondary" @click="handleClose" event="cancel-password">
        Cancel
      </b-button>
      <b-button :id="genBtnId('validate')" class="flex-fill h-42px" variant="primary" @click="submitPassword(inputValue)">
        Access
      </b-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import { SecurityUtils, StringUtils } from '@/utils';
import { BModal } from 'bootstrap-vue';
import { DIException, PasswordConfig } from '@core/common/domain';
import { Log } from '@core/utils';

@Component({
  components: {}
})
export default class PasswordModal extends Vue {
  @Ref()
  private modal!: BModal;

  private passwordConfig: PasswordConfig | null = null;

  private inputValue = '';

  private errorMsg = '';

  private onCompleted: (() => void) | null = null;

  private onCancel: (() => void) | null = null;

  show(passwordConfig: PasswordConfig, onCompleted: () => void, onCancel: () => void) {
    this.reset();
    this.passwordConfig = passwordConfig;
    this.onCancel = onCancel;
    this.onCompleted = onCompleted;
    this.showModal();
  }

  private showModal() {
    this.modal.show();
  }

  private hideModal() {
    this.modal.hide();
    this.reset();
  }

  private reset() {
    this.passwordConfig = null;
    this.inputValue = '';
    this.errorMsg = '';
    this.onCancel = null;
    this.onCompleted = null;
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

  private async submitPassword(password: string) {
    try {
      this.errorMsg = '';
      await this.validate(password);
      this.onCompleted ? this.onCompleted() : void 0;
      this.hideModal();
    } catch (ex) {
      Log.error(ex);
      this.errorMsg = ex.message;
    }
  }

  private handleClose() {
    this.onCancel ? this.onCancel() : void 0;
  }
}
</script>

<style lang="scss" scoped></style>
