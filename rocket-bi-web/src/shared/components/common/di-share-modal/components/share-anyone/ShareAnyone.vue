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
        <div class="row share-anyone-action mb-3">
          <img src="@/assets/icon/users.svg" alt="user" />
          <div class="share-anyone-info">
            <span class="header">Anyone with the link</span>
            <span>Anyone on the internet with this link can {{ isEdit ? 'edit' : 'view' }}</span>
          </div>
          <DiDropdown :id="genDropdownId('share-anyone')" v-model="currentPermission" :data="permissionTypes" value-props="type" />
        </div>
        <b-row>
          <b-input-group>
            <b-input :value="link" class="p-3 h-42px width-fit input-link cursor-default" plaintext size="sm"></b-input>
            <b-input-group-append class="copy-reset">
              <CopyButton :text="link" />
            </b-input-group-append>
          </b-input-group>
        </b-row>
        <!--            <br />-->

        <div ref="embedded" class="row embedded">
          <CopyButton id="embedded" :text="dashboardEmbeddedCode" v-if="isShareDashboard" #default="{copy}">
            <DiButton :id="genBtnId('embedded-copy')" border title="Copy embed code" @click="copy(dashboardEmbeddedCode)">
              <i class="di-icon-embed"></i>
            </DiButton>
          </CopyButton>
        </div>
        <div class="row d-flex mar-t-24">
          <b-button :id="genBtnId('share-anyone-cancel')" class="flex-fill h-42px mr-1" variant="secondary mr" @click="$emit('cancel')" event="share_cancel">
            Cancel
          </b-button>
          <b-button :id="genBtnId('share-anyone-done')" class="flex-fill h-42px ml-1" variant="primary" @click="$emit('ok')">
            Apply
          </b-button>
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
          <CopyButton id="shareLink" :text="link" />
        </div>
      </b-container>
    </b-container>
  </CollapseTransition>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import LinkIcon from '@/shared/components/Icon/LinkIcon.vue';
import CopyButton from '@/shared/components/common/di-share-modal/components/CopyButton.vue';
import { ActionType, PERMISSION_ACTION_NODES, ResourceType } from '@/utils';
import { ActionNode } from '@/shared';
import { UrlUtils } from '@core/utils';
import { LinkHandler } from '@/shared/components/common/di-share-modal/link-handler/LinkHandler';
import { PermissionTokenResponse } from '@core/common/domain';
import { CollapseTransition, FadeTransition } from 'vue2-transitions';

@Component({ components: { CollapseTransition, LinkIcon, CopyButton } })
export default class ShareAnyone extends Vue {
  @Prop({ default: ActionType.none })
  private currentPermission!: ActionType;

  @Prop()
  private linkHandler?: LinkHandler;

  @Prop({ default: '' })
  private readonly link!: string;

  @Prop()
  private permissionTokenResponse?: PermissionTokenResponse;

  private isExpand = false;

  private readonly permissionTypes: ActionNode[] = PERMISSION_ACTION_NODES;

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

  get isEdit() {
    return this.currentPermission === ActionType.edit;
  }
  private get dashboardEmbeddedCode() {
    return UrlUtils.createDashboardEmbedCode(this.linkHandler!.id, this.permissionTokenResponse?.tokenId ?? '');
  }

  private get isShareDashboard() {
    return this.linkHandler!.resourceType === ResourceType.dashboard;
  }
}
</script>

<style lang="scss"></style>
