<template>
  <LayoutContent>
    <LayoutHeader title="Overview" icon="di-icon-org-overview"></LayoutHeader>
    <div class="org-settings-content-body">
      <h6>MANAGE YOUR ORGANIZATION</h6>
      <div class="org-overview">
        <div class="org-overview-item">
          <div class="org-overview-item-label">Company Logo</div>
          <LogoComponent class="org-overview-item-content" :company-logo-url="companyLogoUrl"></LogoComponent>
          <div class="org-overview-item-action btn-icon-border" @click="showEditThumbnailModal">
            <i class="di-icon-edit"></i>
          </div>
        </div>
        <div class="org-overview-item">
          <div class="org-overview-item-label">Company Name</div>
          <div class="org-overview-item-content">{{ companyName }}</div>
          <div class="org-overview-item-action btn-icon-border" @click="showEditNameModal">
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

        <div class="org-overview-item">
          <div class="org-overview-item-label">Version</div>
          <div class="org-overview-item-delete-content">{{ version }}.{{ buildVersion }}</div>
        </div>
      </div>
    </div>
    <DiRenameModal
      ref="renameModal"
      title="Rename organization"
      action-name="Rename"
      placeholder="Input organization name"
      label="Organization name"
    ></DiRenameModal>
    <OrganizationLogoModal ref="logoModal"></OrganizationLogoModal>
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { Organization } from '@core/common/domain';
import { Log } from '@core/utils';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { UpdateOrganizationRequest } from '@core/organization/domain/request/UpdateOrganizationRequest';
import { OrganizationStoreModule } from '@/store/modules/OrganizationStore';
import OrganizationLogoModal from '@/screens/organization-settings/components/organization-logo-modal/OrganizationLogoModal.vue';
import { PopupUtils } from '@/utils';
import LogoComponent from '@/screens/organization-settings/components/organization-logo-modal/LogoComponent.vue';
import builder from '../../../../shared/components/builder';

@Component({
  computed: {
    builder() {
      return builder;
    }
  },
  components: {
    LogoComponent,
    LayoutContent,
    LayoutHeader,
    DiRenameModal,
    OrganizationLogoModal
  }
})
export default class OrganizationOverview extends Vue {
  private get organization(): Organization {
    return OrganizationStoreModule.organization;
  }

  @Ref()
  private renameModal!: DiRenameModal;

  @Ref()
  private logoModal!: OrganizationLogoModal;

  private get companyName(): string {
    return this.organization.name || 'RocketBI';
  }

  private get companyLogoUrl(): string {
    return this.organization.thumbnailUrl || '';
  }

  protected get version(): string {
    return process.env.APP_VERSION || 'dev';
  }

  protected get buildVersion(): string {
    return process.env.BUILD_VERSION || 'unknown';
  }

  mounted() {
    // force load organization
    OrganizationStoreModule.loadAndCacheOrganization();
  }

  private showEditNameModal() {
    this.renameModal.show(this.companyName, (newName: string) => {
      this.handleRenameOrganization(newName);
    });
  }

  private showEditThumbnailModal() {
    this.logoModal.show(this.organization.thumbnailUrl || '', newLogoUrl => this.handleLogoChange(newLogoUrl));
  }

  private async handleLogoChange(newLogoUrl: string) {
    try {
      this.logoModal.setLoading(true);
      await this.updateOrganization({ thumbnailUrl: newLogoUrl });
      await OrganizationStoreModule.loadAndCacheOrganization();
    } catch (ex) {
      Log.error('OrganizationOverview::handleLogoChange::error', ex);
      PopupUtils.showError('Failed to update organization logo');
    } finally {
      this.logoModal.setLoading(false);
      this.logoModal.hide();
    }
  }

  private async handleRenameOrganization(newName: string) {
    try {
      this.renameModal.setLoading(true);
      await this.updateOrganization({ name: newName });
      await OrganizationStoreModule.loadAndCacheOrganization();
      this.renameModal.setLoading(false);
      this.renameModal.hide();
    } catch (ex) {
      Log.error('OrganizationOverview::handleRenameOrganization::error', ex);
      this.renameModal.setLoading(false);
      this.renameModal.setError(ex.message);
    }
  }

  private updateOrganization(orgInfo: { name?: string; thumbnailUrl?: string }): Promise<void> {
    const newName: string = orgInfo.name || this.organization.name;
    const thumbnailUrl: string = orgInfo.thumbnailUrl ?? this.organization.thumbnailUrl ?? '';
    Log.debug('OrganizationOverview::updateOrganization', { newName, thumbnailUrl });
    const request: UpdateOrganizationRequest = new UpdateOrganizationRequest(newName, thumbnailUrl);
    return OrganizationStoreModule.update(request);
  }
}
</script>
<style src="./OrganizationOverview.scss" lang="scss"></style>
