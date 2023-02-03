<template>
  <EtlModal
    ref="modal"
    :actionName="actionName"
    :borderCancel="true"
    :loading="isLoading"
    :width="468"
    backdrop="static"
    class="token-config-modal"
    @hidden="handleHidden"
    @submit="handleSubmitAPIKey(apiKeyResponse)"
  >
    <template #header>
      <div class="mr-auto">
        <h4 class="title">{{ modalTitle }}</h4>
        <h6 class="sub-title">Decentralized settings for API key</h6>
      </div>
    </template>
    <div v-if="apiKeyResponse" class="token-config-modal-body">
      <StatusWidget :status="loadAPIStatus" :error="loadAPIErrorMessage" @retry="handleLoadApiKey(apiKeyResponse.apiKeyInfo.apiKey)" class="privilege-status">
        <vuescroll :ops="scrollOption">
          <div class="scroll-body">
            <form @submit.prevent="handleSubmitAPIKey(apiKeyResponse)">
              <div class="form-custom">
                <label>Token name</label>
                <DiInputComponent v-model="apiKeyResponse.apiKeyInfo.displayName" placeholder="Token name" />
              </div>

              <div class="form-custom">
                <label>Expired date</label>
                <DiDatePicker :disabled="false" :date.sync="expireDate" @change="updateExpireTime" />
              </div>

              <div class="form-custom mb-3">
                <label>Privileges</label>
                <div v-for="(group, index) in permissionGroups" :key="index">
                  <div class="group-privilege pb-3">
                    <GroupListCheckbox
                      class="group-list-checkbox"
                      :id="genMultiSelectionId('group-list-checkbox', index)"
                      :selected-items="apiKeyResponse.permissions"
                      :group="group"
                      :is-show-all-checkbox="true"
                      @change="handleChangeListCheckbox"
                    ></GroupListCheckbox>
                  </div>
                </div>
              </div>
              <input type="submit" class="d-none" />
            </form>
          </div>
        </vuescroll>
      </StatusWidget>
      <div v-if="isError" class="error-message text-left mb-1" :title="errorMessage">{{ errorMessage }}</div>
    </div>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '@/screens/data-cook/components/etl-modal/EtlModal.vue';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { Status, VerticalScrollConfigs } from '@/shared';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { ApiKeyInfo, ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '@core/organization';
import { FormMode } from '@core/data-ingestion';
import { PermissionGroup, SupportPermissionGroups } from '@core/admin/domain/permissions/PermissionGroup';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import GroupListCheckbox from '@/screens/user-management/components/user-detail/GroupListCheckbox.vue';
import { APIKeyService } from '@core/organization/service/APIKeyService';
import { Inject } from 'typescript-ioc';
import { difference } from 'lodash';
import StatusWidget from '@/shared/components/StatusWidget.vue';

@Component({
  components: {
    StatusWidget,
    DiDatePicker,
    DiInputComponent,
    EtlModal,
    GroupListCheckbox
  },
  validations: {}
})
export default class APIKeyConfigModal extends Vue {
  private scrollOption = VerticalScrollConfigs;
  private status = Status.Loaded;
  private loadAPIStatus = Status.Loaded;
  private errorMessage = '';
  private loadAPIErrorMessage = '';
  private oldPermissions: string[] = [];
  private apiKeyResponse: ApiKeyResponse = ApiKeyResponse.default();
  private expireDate = new Date();
  private formMode = FormMode.Create;
  private createCallback: ((request: CreateApiKeyRequest) => void) | null = null;
  private updateCallback: ((request: UpdateApiKeyRequest) => void) | null = null;

  @Ref()
  private readonly modal!: EtlModal;

  @Inject
  private tokenService!: APIKeyService;

  private get actionName() {
    return this.isEditMode ? 'Update' : 'Create';
  }

  private get isEditMode() {
    return this.formMode === FormMode.Edit;
  }

  private get modalTitle() {
    return this.isEditMode ? 'Update API Key' : 'Create API Key';
  }

  private get isLoading() {
    return this.status === Status.Loading || this.loadAPIStatus === Status.Loading;
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get permissionGroups(): PermissionGroup[] {
    return UserDetailModule.permissionGroups.filter(per => per.groupName !== SupportPermissionGroups.apiKey().groupName);
  }

  private handleChangeListCheckbox(selectedItems: string[]) {
    const permissionsSet: Set<string> = new Set(selectedItems);
    this.apiKeyResponse.permissions = Array.from(permissionsSet);
  }

  private updateExpireTime(date?: Date) {
    this.apiKeyResponse?.apiKeyInfo?.updateExpireTime(date);
  }

  async create(apiKeyInfo: ApiKeyInfo, createCallback: (request: CreateApiKeyRequest) => void) {
    this.formMode = FormMode.Create;
    //@ts-ignored
    this.modal.show();
    UserDetailModule.loadSupportPermissionGroups();
    this.expireDate = apiKeyInfo.expireDate!;
    this.createCallback = createCallback;
  }

  async update(apiKeyInfo: ApiKeyInfo, updateCallback: (request: UpdateApiKeyRequest) => void) {
    this.formMode = FormMode.Edit;
    this.apiKeyResponse.apiKeyInfo = apiKeyInfo;
    //@ts-ignored
    this.modal.show();
    UserDetailModule.loadSupportPermissionGroups();
    await this.handleLoadApiKey(apiKeyInfo.apiKey);
    this.updateCallback = updateCallback;
  }

  private async handleLoadApiKey(apiKey: string) {
    try {
      this.showLoadAPILoading();
      this.apiKeyResponse = await this.tokenService.get(apiKey);
      this.oldPermissions = this.apiKeyResponse.permissions;
      this.expireDate = this.apiKeyResponse.apiKeyInfo.expireDate!;
      this.hideLoadAPILoading();
    } catch (e) {
      Log.debug(`TokenConfigModal::getApiKey::error::`, e);
      this.showLoadAPIError(e.message);
    }
  }

  hide() {
    //@ts-ignored
    this.modal.hide();
  }

  private handleHidden() {
    this.hideLoading();
    this.$v.$reset();
    this.formMode = FormMode.Create;
    this.createCallback = null;
    this.updateCallback = null;
    this.apiKeyResponse = ApiKeyResponse.default();
    this.oldPermissions = [];
    this.expireDate = new Date();
    this.status = Status.Loaded;
  }

  private hideLoading() {
    this.status = Status.Loaded;
  }

  private showError(message: string) {
    this.status = Status.Error;
    this.errorMessage = message;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showLoadAPIError(message: string) {
    this.loadAPIStatus = Status.Error;
    this.errorMessage = message;
  }

  private showLoadAPILoading() {
    this.loadAPIStatus = Status.Loading;
  }

  private hideLoadAPILoading() {
    this.loadAPIStatus = Status.Loaded;
  }

  @AtomicAction()
  private async handleSubmitAPIKey(apiKeyResponse: ApiKeyResponse) {
    try {
      this.showLoading();
      apiKeyResponse.apiKeyInfo.ensure();
      if (this.isValidJob()) {
        if (this.isEditMode) {
          this.updateApiKey(apiKeyResponse);
        } else {
          this.createApiKey(apiKeyResponse);
        }
        this.hide();
      }
    } catch (e) {
      const exception = DIException.fromObject(e);
      this.showError(exception.message);
      Log.error('JobCreationModal::handleSubmitAPIKeyJob::exception::', exception.message);
    }
  }

  private createApiKey(apiKeyResponse: ApiKeyResponse) {
    if (this.createCallback) {
      const request = new CreateApiKeyRequest(apiKeyResponse.apiKeyInfo.displayName, apiKeyResponse.apiKeyInfo.expiredTimeMs!, apiKeyResponse.permissions);
      this.createCallback(request);
    }
  }

  private updateApiKey(apiKeyResponse: ApiKeyResponse) {
    if (this.updateCallback) {
      const request = new UpdateApiKeyRequest(
        apiKeyResponse.apiKeyInfo.apiKey,
        apiKeyResponse.apiKeyInfo.displayName,
        apiKeyResponse.apiKeyInfo.expiredTimeMs!,
        this.apiKeyResponse.permissions,
        difference(this.oldPermissions, this.apiKeyResponse.permissions)
      );
      this.updateCallback(request);
    }
  }

  private isValidJob() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.token-config-modal {
  .title {
    @include regular-text();
    font-size: 24px;
    margin-bottom: 4px;
  }

  .sub-title {
    margin-bottom: 12px;

    @media screen and (max-width: 500px) {
      display: none;
    }
  }

  .modal-dialog {
    margin: auto;
  }

  .modal-header {
    background: var(--secondary);
    border-bottom: solid 1px var(--primary) !important;
  }

  .modal-body {
    background: var(--secondary);
    padding: 0;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .mb-12px {
    margin-bottom: 12px;
  }

  .mt-12px {
    margin-top: 12px !important;
  }

  .select-container {
    margin-top: 0;

    .relative > span > button > div {
      height: 34px !important;
    }

    button {
      padding-left: 12px !important;
    }

    .dropdown-input-placeholder {
      //color: #a8aaaf !important;
    }
  }
}

.token-config-modal-body {
  //height: 370px;
  width: 100%;

  .privilege-status {
    .status-loading,
    .chart-error {
      min-height: 371px;
    }
  }

  .error-message {
    color: var(--danger);
    background: var(--secondary);
    padding: 0 12px;
    word-break: break-word;
  }

  .scroll-body {
    max-height: 371px;
    padding: 16px;
  }

  .form-custom {
    > label {
      @include regular-text(0.23px, var(--text-color));
      font-size: 14px;
      margin-bottom: 12px;
      line-height: 1;
    }
    .di-input-component--input {
      height: 34px;
    }
    input {
      height: 34px;
      background-color: var(--primary);
      padding-left: 12px;

      &::placeholder {
        @include regular-text(0.17px, #a8aaaf);
        font-size: 12px;
      }
    }

    #date.input-calendar {
      width: calc(100% - 12px);
    }

    .dropdown-input-placeholder.default-label,
    .dropdown-input-placeholder.use-placeholder {
      @include regular-text(0.17px);
      font-size: 12px;
      color: #a8aaaf !important;
    }

    &:not(:last-child) {
      margin-bottom: 16px;
    }
  }

  .group-list-checkbox {
    background: var(--primary);
    border-radius: 4px;
    .title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 0;
      color: var(--secondary-text-color);
    }
    label.custom-control-label {
      color: var(--secondary-text-color);
      opacity: 1;
    }
  }
}
</style>
