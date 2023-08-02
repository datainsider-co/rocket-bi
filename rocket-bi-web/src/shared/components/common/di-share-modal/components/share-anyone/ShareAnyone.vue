<template>
  <CollapseTransition class="share-section">
    <b-container :class="cursorClass" class="anyone-header-area" fluid="" @click.prevent="!isExpand && expand()">
      <b-container v-if="isExpand" key="collapsed" class="d-flex flex-column">
        <b-row class="share-anyone-header">
          <div class="get-link">
            <LinkIcon active></LinkIcon>
            <span>Get link</span>
          </div>
        </b-row>
        <b-row>
          <b-input-group>
            <b-input :value="link" class="p-3 width-fit input-link cursor-default" plaintext size="sm"></b-input>
            <b-input-group-append class="copy-reset">
              <CopyButton :text="link" />
            </b-input-group-append>
          </b-input-group>
        </b-row>

        <div class="row share-anyone-action mb-3">
          <img src="@/assets/icon/users.svg" alt="user" />
          <div class="share-anyone-info">
            <span class="header">Anyone with the link</span>
            <span>Anyone on the internet with this link can {{ isEdit ? 'edit' : 'view' }}</span>
          </div>
          <DiDropdown
            class="share-anyone-permission-select"
            :id="genDropdownId('share-anyone')"
            :value="currentPermission"
            @change="value => $emit('change', value)"
            :data="permissionTypes"
            value-props="type"
          />
        </div>

        <!--            <br />-->
        <template v-if="showPasswordProtection">
          <div class="row share-anyone-action mb-3">
            <img src="@/assets/icon/ic-password-protection.svg" alt="password protection" />
            <div class="share-anyone-info">
              <span class="header">Password protection</span>
              <span>Set a password to secure your data</span>
            </div>
            <DiToggle
              id="enable-toggle-password"
              :value="enablePasswordProtection"
              @onSelected="handleTogglePasswordProtection(!enablePasswordProtection)"
            ></DiToggle>
          </div>
          <b-row>
            <b-collapse :visible="enablePasswordProtection" class="w-100 mb-3">
              <DiInputComponent
                class="password-protection-input"
                autocomplete="new-password"
                :readonly="!isCreateNewPassword"
                :type="passwordInputType"
                :id="genInputId('password-protection')"
                :value="passwordValue"
                placeholder="Your password"
                @input="changePassword"
              >
                <template #suffix>
                  <template v-if="isCreateNewPassword">
                    <i v-if="isShowPassword" class="fas fa-eye" @click="toggleShowPassword"></i>
                    <i v-else class="fas fa-eye-slash" @click="toggleShowPassword"></i>
                  </template>

                  <i v-else class="di-icon-close" @click="resetPassword"></i>
                </template>
              </DiInputComponent>
            </b-collapse>
          </b-row>
        </template>

        <div ref="embedded" class="row embedded">
          <CopyButton id="embedded" :text="dashboardEmbeddedCode" v-if="isShareDashboard" #default="{copy}">
            <DiButton :id="genBtnId('embedded-copy')" border title="Copy embed code" @click="copy(dashboardEmbeddedCode)">
              <i class="di-icon-embed"></i>
            </DiButton>
          </CopyButton>
        </div>
        <div class="row d-flex mar-t-24">
          <DiButton :id="genBtnId('share-anyone-cancel')" border class="flex-grow-1 h-42px m-0 mr-1" @click="$emit('cancel')" placeholder="Cancel"></DiButton>
          <DiButton
            :id="genBtnId('share-anyone-done')"
            :is-loading="isBtnLoading"
            :disabled="isBtnLoading"
            primary
            class="flex-grow-1 h-42px m-0 ml-1"
            @click="$emit('ok')"
            placeholder="Apply"
          ></DiButton>
        </div>
      </b-container>
      <b-container v-else :key="'expanded'" class="px-0 d-flex flex-row justify-content-between flex-auto" fluid="">
        <div class="share-anyone-header">
          <div class="get-link">
            <LinkIcon deactive></LinkIcon>
            <span>Get link</span>
          </div>
          <span class="cursor-pointer">Anyone on the internet with this link can <span v-if="isEdit">edit</span> <span v-else>view</span></span>
        </div>
        <div ref="container" class="d-flex flex-row ml-auto align-items-center">
          <!--              todo: don't delete this line below-->
          <b-input :value="link" class="p-3 h-42px width-fit input-link cursor-default d-none" plaintext size="sm"></b-input>
          <CopyButton v-if="link" id="shareLink" :text="link" />
        </div>
      </b-container>
    </b-container>
  </CollapseTransition>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model, PropSync } from 'vue-property-decorator';
import LinkIcon from '@/shared/components/Icon/LinkIcon.vue';
import CopyButton from '@/shared/components/common/di-share-modal/components/CopyButton.vue';
import { ActionType, PERMISSION_ACTION_NODES, ResourceType } from '@/utils';
import { ActionNode } from '@/shared';
import { Log, UrlUtils } from '@core/utils';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import { PasswordConfig, PermissionTokenResponse } from '@core/common/domain';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';

@Component({ components: { CollapseTransition, LinkIcon, CopyButton, DiInputComponent } })
export default class ShareAnyone extends Vue {
  private isShowPassword = false;

  @Model('change', { type: String, default: ActionType.none })
  private readonly currentPermission!: ActionType;

  @Prop({ type: Boolean, default: false })
  private readonly isBtnLoading!: boolean;

  @Prop()
  private linkHandler?: LinkHandler;

  @Prop({ default: '' })
  private readonly link!: string;

  @Prop()
  private permissionTokenResponse?: PermissionTokenResponse;

  @Prop({ required: false, default: false, type: Boolean })
  private showPasswordProtection!: boolean;

  @Prop({ default: true })
  private isCreateNewPassword!: boolean;

  @PropSync('passwordConfig')
  private syncedPasswordConfig!: PasswordConfig | null; ///Use for edit password

  private isExpand = false;

  private get permissionTypes(): ActionNode[] {
    if (
      this.linkHandler?.resourceType === ResourceType.directory ||
      this.linkHandler?.resourceType === ResourceType.dashboard ||
      this.linkHandler?.resourceType === ResourceType.query
    ) {
      return PERMISSION_ACTION_NODES;
    } else {
      return PERMISSION_ACTION_NODES.filter(item => item.type !== ActionType.viewAndDownLoad);
    }
  }

  collapse() {
    this.isExpand = false;
  }

  expand() {
    this.isExpand = true;
    this.$emit('expand');
  }

  private get cursorClass() {
    return this.isExpand ? 'cursor-default' : 'cursor-pointer';
  }

  private get passwordValue(): string {
    if (this.isCreateNewPassword) {
      return this.syncedPasswordConfig?.hashedPassword ?? '';
    } else {
      return '********';
    }
  }

  private get enablePasswordProtection() {
    return this.syncedPasswordConfig?.enabled ?? false;
  }

  get isEdit() {
    return this.currentPermission === ActionType.edit;
  }
  private get dashboardEmbeddedCode() {
    return UrlUtils.createDashboardEmbedCode(this.linkHandler!.id, this.permissionTokenResponse?.tokenId ?? '');
  }

  private get passwordInputType() {
    if (this.isCreateNewPassword) {
      return this.isShowPassword ? 'text' : 'password';
    } else {
      return 'password';
    }
  }

  private get isShareDashboard() {
    return this.linkHandler!.resourceType === ResourceType.dashboard;
  }

  private resetPassword() {
    this.syncedPasswordConfig = this.defaultPasswordConfig(true);
    this.$emit('resetPassword');
  }

  private defaultPasswordConfig(enable: boolean) {
    return {
      enabled: enable,
      hashedPassword: ''
    } as PasswordConfig;
  }

  private handleTogglePasswordProtection(enable: boolean) {
    Log.debug('ShareAnyone::handleTogglePasswordProtection::enable::', enable);
    if (this.syncedPasswordConfig) {
      this.syncedPasswordConfig.enabled = enable;
    } else {
      this.syncedPasswordConfig = this.defaultPasswordConfig(enable);
    }
  }

  private changePassword(password: string) {
    if (this.syncedPasswordConfig) {
      this.syncedPasswordConfig.hashedPassword = password;
    } else {
      this.syncedPasswordConfig = this.defaultPasswordConfig(true);
      this.syncedPasswordConfig.hashedPassword = password;
    }
  }

  private toggleShowPassword() {
    this.isShowPassword = !this.isShowPassword;
  }
}
</script>

<style lang="scss"></style>
