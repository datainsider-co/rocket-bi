<template>
  <LayoutContent>
    <LayoutHeader title="API Key Management" icon="di-icon-user-access"> </LayoutHeader>
    <div class="token-management" ref="container">
      <div class="token-management-header d-flex align-items-center">
        <div class="token-management-title">API KEY</div>
        <div v-if="isShowSearchInput" class="d-flex align-items-center ml-auto">
          <DiSearchInput
            autofocus
            style="width: 236px"
            class=" mr-3"
            border
            :value="searchKeyword"
            @change="value => (searchKeyword = String(value).trim())"
            placeholder="Search API key name..."
          />
          <DiButton border title="Create API key" @click="handleCreateNewToken">
            <i class="di-icon-add"></i>
          </DiButton>
        </div>
      </div>
      <StatusWidget class="token-management-body position-relative" :status="status" :error="errorMessage" @retry="handleLoadTokens(true)">
        <div class="token-management-empty" v-if="isEmptyToken">
          <template v-if="isEmptySearchKeyword">
            <i class="di-icon-access"></i>
            <div class="token-management-empty-title">
              Personal access tokens are used to authenticate<br />
              with the DataInsider
            </div>
            <DiButton border title="Create API key" @click="handleCreateNewToken">
              <i class="di-icon-add"></i>
            </DiButton>
          </template>
          <EmptyDirectory title="No API keys found" v-else />
        </div>
        <div v-else class="token-management-content">
          <vuescroll ref="vuescroll" class="token-management-content-scroll-body" :ops="verticalScrollConfig">
            <table class="table table-sm">
              <thead>
                <tr class="text-nowrap">
                  <th class="name-col">Name</th>
                  <th class="token-col">API key</th>
                  <th class="expire-time-col">Expired Date</th>
                  <th class="setting-col"></th>
                  <th class="delete-col"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(token, index) in apiKeyInfos" class="token-management-content-token" :key="token.apiKey">
                  <td>
                    <div>
                      <BFormInput
                        autocomplete="off"
                        class="token-management-content-token-label text-truncate"
                        placeholder="Label"
                        disabled
                        :value="token.displayName"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="token-management-content-token-key">
                      <BFormInput
                        :id="genInputId(`token-key-${index}`)"
                        autocomplete="off"
                        class="token-management-content-token-key-input text-truncate"
                        disabled
                        :value="token.apiKey"
                      />
                      <i
                        :id="genInputId(`token-key-copy-${index}`)"
                        class="cursor-pointer di-icon-copy"
                        @click="handleCopyToken(token.apiKey, 'api-key-copy-tooltip-' + index)"
                      ></i>
                    </div>

                    <b-tooltip
                      class="api-key-copy-tooltip"
                      :id="'api-key-copy-tooltip-' + index"
                      :disabled="true"
                      :target="genInputId(`token-key-copy-${index}`)"
                      placement="top"
                    >
                      <div class="custom-tooltip-body tooltip-success-bg">
                        Copied
                      </div>
                    </b-tooltip>
                  </td>
                  <td>
                    <div class="token-management-content-token-expire-time">
                      <BFormInput
                        :id="genInputId(`token-key-${index}`)"
                        autocomplete="off"
                        class="token-management-content-token-key-input text-truncate"
                        :value="token.expireDateAsDisplay"
                      />
                      <i :id="genInputId(`token-key-copy-${index}`)" class="di-icon-calendar"></i>
                    </div>
                  </td>
                  <td>
                    <i class="di-icon-setting  btn-icon-border" @click="handleUpdateToken(token)"></i>
                  </td>
                  <td>
                    <i class="di-icon-delete  btn-icon-border" @click="showDeleteTokenConfirm(token)"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </vuescroll>
          <ListingFooter v-if="enablePagination" ref="footer" :total-rows="total" class="token-footer" @onPageChange="handlePageChange"></ListingFooter>
        </div>
      </StatusWidget>
    </div>
    <APIKeyConfigModal ref="apiKeyConfigModal" />
  </LayoutContent>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { LayoutContent, LayoutHeader } from '@/shared/components/layout-wrapper';
import { ListUtils } from '@/utils';
import DiButton from '@/shared/components/common/DiButton.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { DefaultPaging, Status, VerticalScrollConfigs } from '@/shared';
import VueClipboard from 'vue-clipboard2';
import { Log } from '@core/utils';
import { DIException } from '@core/common/domain';
import APIKeyConfigModal from '@/screens/organization-settings/views/token-management/APIKeyConfigModal.vue';
import { ApiKeyInfo, ApiKeyResponse, CreateApiKeyRequest, APIKeyService, UpdateApiKeyRequest } from '@core/organization';
import ListingFooter from '@/shared/components/user-listing/ListingFooter.vue';
import { Pagination } from '@/shared/models';
import { Modals } from '@/utils/Modals';
import { PopupUtils } from '@/utils/PopupUtils';
import { Inject } from 'typescript-ioc';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { StringUtils } from '@/utils/StringUtils';
import EmptyDirectory from '@/screens/dashboard-detail/components/EmptyDirectory.vue';
import { ListingRequest } from '@core/common/domain/request/ListingRequest';

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);
@Component({
  components: { EmptyDirectory, APIKeyConfigModal, StatusWidget, LayoutContent, LayoutHeader, DiButton, ListingFooter, DiSearchInput }
})
export default class APIKeyManagement extends Vue {
  private readonly verticalScrollConfig = VerticalScrollConfigs;
  private apiKeyInfos: ApiKeyInfo[] = [];
  private total = 0;
  private status: Status = Status.Loaded;
  private errorMessage = '';

  private from = 0;
  private size = DefaultPaging.DefaultPageSize;
  private searchKeyword = '';
  private isFirstLoading = true;

  @Ref()
  private apiKeyConfigModal!: APIKeyConfigModal;

  @Ref()
  private vuescroll?: any;

  @Inject
  private apiKeyService!: APIKeyService;

  private get isShowSearchInput(): boolean {
    if (this.isFirstLoading) {
      return false;
    }
    if (!this.isLoading && this.isEmptyToken && this.isEmptySearchKeyword) {
      return false;
    }
    return true;
  }

  @Watch('searchKeyword')
  onKeywordChanged(keyword: string) {
    this.from = 0;
    Log.error('TokenManagement::handleLoadApiKey::searchKeyword::', keyword);
    this.handleLoadTokens();
  }

  private get isEmptyToken() {
    return ListUtils.isEmpty(this.apiKeyInfos);
  }

  private get isEmptySearchKeyword() {
    return StringUtils.isEmpty(this.searchKeyword);
  }

  private get enablePagination() {
    return this.total > this.size && this.status !== Status.Loading && this.status !== Status.Error;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private get isLoading() {
    return this.status === Status.Loading || this.status === Status.Updating;
  }

  private showError(ex: DIException) {
    this.status = Status.Error;
    this.errorMessage = ex.getPrettyMessage();
  }

  async mounted() {
    this.isFirstLoading = true;
    await this.handleLoadTokens(true);
    this.isFirstLoading = false;
  }

  private async handleLoadTokens(force = false) {
    try {
      force ? this.showLoading() : this.showUpdating();
      //todo: load data
      const response = await this.apiKeyService.list(new ListingRequest(this.searchKeyword, this.from, this.size));
      this.apiKeyInfos = response.data;
      this.total = response.total;
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showError(ex);
      Log.error('TokenManagement::handleLoadApiKey::error::', ex);
    }
  }

  private handleCreateNewToken() {
    this.apiKeyConfigModal.create(ApiKeyInfo.default(), (request: CreateApiKeyRequest) => {
      this.createToken(request);
    });
  }

  private handleUpdateToken(token: ApiKeyInfo) {
    this.apiKeyConfigModal.update(token, (request: UpdateApiKeyRequest) => {
      this.updateToken(request);
    });
  }

  private async createToken(request: CreateApiKeyRequest) {
    await this.apiKeyService.create(request);
    await this.handleLoadTokens();
  }

  private async updateToken(request: UpdateApiKeyRequest) {
    try {
      this.showUpdating();
      await this.apiKeyService.update(request);
      const response = await this.apiKeyService.list(new ListingRequest(this.searchKeyword, this.from, this.size));
      this.apiKeyInfos = response.data;
      this.total = response.total;
      this.showLoaded();
    } catch (e) {
      Log.error('APIKeyManagement::updateToken::error::', e);
      PopupUtils.showError(e.message);
    } finally {
      this.showLoaded();
    }
  }

  private showDeleteTokenConfirm(apiKeyInfo: ApiKeyInfo) {
    Modals.showConfirmationModal(`Are you sure you want to delete API key "${apiKeyInfo.displayName}"`, {
      onOk: () => this.handleDeleteToken(apiKeyInfo)
    });
  }

  private async handleDeleteToken(token: ApiKeyInfo) {
    try {
      this.showUpdating();
      await this.apiKeyService.delete(token.apiKey);
      await this.handleLoadTokens();
    } catch (e) {
      const ex = DIException.fromObject(e);
      Log.error(`TokenManagement::handleDeleteToken::error::`, ex);
      PopupUtils.showError(ex.getPrettyMessage());
    } finally {
      this.showLoaded();
    }
  }

  private handleCopyToken(token: string, tooltipId: string) {
    this.$copyText(token, this.$refs.container)
      .then(() => {
        //success copy link
        Log.debug('copied link:: ', token);
        this.showTooltip(tooltipId, 'copied', 1000);
      })
      .catch(err => {
        //copy failed
        Log.debug('Copied Failed::error::', err);
        this.showTooltip(tooltipId, 'failed', 1000);
      });
  }

  showTooltip(tooltipId: string, status: string, showingDuration: number) {
    try {
      this.$root.$emit('bv::show::tooltip', tooltipId);
      // this.copyStatus = status;
      setTimeout(() => {
        this.$root.$emit('bv::hide::tooltip', tooltipId);
      }, showingDuration);
    } catch (e) {
      Log.debug('DiShareModel::ShowTooltip::Err::', e.message);
    }
  }

  private async handlePageChange(pagination: Pagination) {
    try {
      this.showUpdating();
      this.from = (pagination.page - 1) * pagination.size;
      this.size = pagination.size;
      await this.handleLoadTokens();
      this.toFirstActivity();
      this.showLoaded();
    } catch (ex) {
      const exception = DIException.fromObject(ex);
      this.showError(exception);
    }
  }

  private toFirstActivity() {
    this.vuescroll?.scrollTo(
      {
        y: '0%'
      },
      50
    );
  }
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~bootstrap/scss/bootstrap-grid';

.token-management {
  background: var(--secondary);
  height: calc(100% - 53px);
  border-radius: 4px;
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;

  &-header {
    height: 32px;
  }

  &-body {
    height: calc(100% - 34px) !important;
  }

  &-title {
    @include regular-text(0.6, var(--text-color));
    font-weight: 500;
    text-align: left;
  }

  &-empty {
    display: flex;
    justify-content: center;
    flex-direction: column;
    flex: 1;
    height: 100%;

    > i {
      font-size: 60px;
    }

    &-title {
      @include medium-text(16px, 0.4px, 1.5);
      font-weight: normal;
      margin: 16px 0;
    }

    .di-button {
      width: fit-content;
      margin: 0 auto;
    }
  }

  &-content {
    padding-top: 32px;
    height: calc(100%);

    display: flex;
    flex-direction: column;

    .token-management-content-scroll-body {
      max-height: calc(100% - 29px);
      position: relative;

      table {
        height: 100%;
        td,
        th {
          padding: 0px;
          border: 0;
        }

        thead {
          tr {
            height: 34px !important;
            position: sticky;
            top: 0;
            left: 0;
            z-index: 1;
            background: var(--secondary);
          }

          th {
            text-align: left;
            color: var(--secondary-text-color);
            opacity: 0.8;
            font-weight: normal;
          }
          .name-col {
            @include media-breakpoint-down(xl) {
              width: 300px;
            }

            @include media-breakpoint-down(lg) {
              width: 250px;
            }

            @include media-breakpoint-down(md) {
              width: 200px;
            }
          }

          .expire-time-col {
            width: 200px;
          }

          .setting-col,
          .delete-col {
            width: 32px;
          }
        }

        tbody {
          tr {
            &:not(:last-child) {
              margin-bottom: 12px;
            }
            td {
              .form-control:disabled {
                background: var(--input-background-color);
              }
              > * {
                margin-right: 8px;
              }

              input {
                height: 40px;
                padding: 0 16px;

                &::placeholder {
                  color: #a8aaaf;
                }
              }

              .token-management-content-token-label {
                @include regular-text(0.18px, var(--text-color));
              }

              .token-management-content-token-key {
                position: relative;

                &-input {
                  pointer-events: none;
                  padding-right: 32px !important;
                }

                > i {
                  height: 100%;
                  position: absolute;
                  right: 12px;
                  top: 12px;
                }
              }

              .token-management-content-token-expire-time {
                position: relative;

                &-input {
                  pointer-events: none;
                  padding-right: 32px !important;
                }

                > i {
                  height: 100%;
                  position: absolute;
                  right: 12px;
                  top: 12px;
                }
              }
            }
          }
        }
      }
    }

    .token-footer {
      margin-top: 8px;
    }
  }
}

[id*='api-key-copy-tooltip-'] {
  .arrow {
    &::before {
      border-top-color: #009c31 !important;
    }
  }

  .tooltip-inner {
    background-color: #009c31 !important;
    padding: 0 !important;

    .custom-tooltip-body {
      background: #009c31 !important;
      border-radius: 4px;
      color: var(--white);
      font-size: 14px;
      letter-spacing: 0.18px;
      padding: 4px 12px;
      text-align: center;
    }
  }
}

.custom-tooltip-body {
  background-color: #009c31;
}
</style>
