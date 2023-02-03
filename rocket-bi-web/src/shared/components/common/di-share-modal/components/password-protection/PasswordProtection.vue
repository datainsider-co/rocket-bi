<template>
  <CollapseTransition class="w-100 share-section">
    <b-container :class="cursorClass" class="header-area" fluid="" @click.prevent="!isExpand && expand()">
      <div v-if="isExpand" :key="'expanded'" class="d-flex flex-column">
        <div class="share-anyone-header">
          <div class="get-link">
            <LinkIcon active></LinkIcon>
            <span>{{ HEADER_TITLE }}</span>
            <!--            <ToggleSetting id="enable-password" class="ml-auto" label="" :value="enablePassword" @onChanged="onPasswordToggle" />-->
          </div>
        </div>

        <div class="d-flex flex-column mt-3" :class="inputPasswordClass">
          <div class="mb-1">Password:</div>
          <DiInputComponent
            :disabled="!isCreateNew || !enablePassword"
            class="w-100 mb-2"
            :id="genInputId('password')"
            placeholder="Your password"
            autocomplete="off"
            label=""
            v-model="inputValue"
            :type="inputType"
            @enter="inputPassword"
            @input="inputPassword"
          />
          <div class="ml-auto mb-3 d-flex flex-row">
            <DiButton v-if="showConfirm" title="Cancel" @click="onCancel"></DiButton>
            <DiButton primary class="ml-1" v-if="showConfirm" id="reset-password-btn" title="Confirm" @click="onConfirm"></DiButton>
            <DiButton class="ml-1" :is-disable="isCreateNew" title="Reset Password" @click="onReset">
              <i class="di-icon-delete" />
            </DiButton>
          </div>
        </div>
        <div class="d-flex">
          <DiButton :id="genBtnId('password-cancel')" border class="flex-fill h-42px m-1" @click="$emit('cancel')" placeholder="Cancel"></DiButton>
          <DiButton
            :id="genBtnId('password-ok')"
            :is-loading="isBtnLoading"
            primary
            class="flex-fill h-42px m-1"
            @click="$emit('ok')"
            placeholder="Apply"
          ></DiButton>
        </div>
      </div>
      <b-container v-else key="collapsed" class="d-flex flex-column px-0">
        <div class="share-anyone-header">
          <div class="get-link">
            <LinkIcon deactive></LinkIcon>
            <span>{{ HEADER_TITLE }}</span>
          </div>
        </div>
      </b-container>
    </b-container>
  </CollapseTransition>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, PropSync } from 'vue-property-decorator';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { PasswordConfig } from '@core/common/domain';
import LinkIcon from '@/shared/components/Icon/LinkIcon.vue';
import { CollapseTransition } from 'vue2-transitions';
import DiButton from '@/shared/components/common/DiButton.vue';
import ToggleSetting from '@/shared/settings/common/ToggleSetting.vue';

@Component({ components: { DiButton, CollapseTransition, ToggleSetting, DiInputComponent, LinkIcon } })
export default class PasswordProtection extends Vue {
  readonly HEADER_TITLE = 'Password Protection';
  private isExpand = false;
  private showConfirm = false;

  @PropSync('config')
  private syncConfig?: PasswordConfig;

  @Prop({ default: true })
  private isCreateNew!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly isBtnLoading!: boolean;

  collapse() {
    this.isExpand = false;
    this.showConfirm = false;
  }

  expand() {
    this.isExpand = true;
    this.showConfirm = false;
    this.$emit('expand');
  }

  private get cursorClass() {
    return this.isExpand ? 'cursor-default' : 'cursor-pointer';
  }

  private inputPassword(value: string) {
    this.$emit('input', value);
  }

  private get inputType(): string {
    return this.isCreateNew ? 'password' : 'text';
  }

  private get inputValue(): string {
    if (this.isCreateNew) {
      return this.syncConfig?.hashedPassword ?? '';
    } else {
      return '********';
    }
  }

  private set inputValue(text: string) {
    if (this.syncConfig) {
      this.syncConfig.hashedPassword = text;
    }
  }

  private get enablePassword(): boolean {
    return this.syncConfig?.enabled ?? false;
  }

  private onPasswordToggle(enable: boolean) {
    if (this.syncConfig) {
      this.syncConfig.enabled = enable;
    }
  }

  private get inputPasswordClass(): string {
    const enabled = this.syncConfig?.enabled ?? false;
    if (this.isCreateNew) {
      return '';
    }
    if (enabled) {
      return '';
    } else {
      return 'input-password-disable';
    }
  }

  private onReset() {
    this.showConfirm = !this.showConfirm;
  }

  private onConfirm() {
    this.$emit('reset');
    this.showConfirm = false;
  }
  private onCancel() {
    this.showConfirm = false;
  }
}
</script>

<style lang="scss" />
