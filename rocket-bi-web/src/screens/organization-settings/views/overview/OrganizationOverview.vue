<template>
  <LayoutContent>
    <LayoutHeader title="Overview" icon="di-icon-org-overview"></LayoutHeader>
    <div class="org-settings-content-body">
      <h6>MANAGE YOUR ORGANIZATION</h6>
      <div class="org-overview">
        <div class="org-overview-item">
          <div class="org-overview-item-label">Company Logo</div>
          <div class="org-overview-item-content">
            <img alt="Logo company" src="@/assets/logo/circle-logo.svg" class="org-logo" />
          </div>
          <div class="org-overview-item-action btn-icon-border" disabled>
            <i class="di-icon-edit"></i>
          </div>
        </div>
        <div class="org-overview-item">
          <div class="org-overview-item-label">Company Name</div>
          <div class="org-overview-item-content">DATA INSIDER</div>
          <div class="org-overview-item-action btn-icon-border" disabled>
            <i class="di-icon-edit"></i>
          </div>
        </div>
        <div class="org-overview-item">
          <div class="org-overview-item-label">Delete Organization</div>
          <div class="org-overview-item-delete-content">
            Close your organization and delete all associated data
          </div>
          <div class="org-overview-item-action btn-icon-border" disabled>
            <i class="di-icon-delete"></i>
          </div>
        </div>
      </div>
    </div>
  </LayoutContent>
</template>
<style src="./OrganizationOverview.scss" lang="scss"></style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';

@Component({
  components: {
    LayoutContent,
    LayoutHeader
  }
})
export default class OrganizationOverview extends Vue {}
</script>
