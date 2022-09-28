<template>
  <div class="manage-policy">
    <StatusWidget :status="status" :error="errorMessage">
      <vuescroll v-if="policiesResponse">
        <div class="h-100 d-flex flex-column">
          <table class="table table-sm">
            <thead>
              <tr class="text-nowrap">
                <th class="attribute-col">Attributed Name</th>
                <th class="condition-col">Condition</th>
                <th class="filter-col">Filters</th>
                <th class="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(policy, index) in policiesResponse.data" :key="index">
                <td>
                  <div v-if="isViewMode">{{ toSnakeKey(policy.userAttribute.key) }}</div>
                  <DiInputComponent
                    v-else
                    @change="updateRLSAttribute(policiesResponse.data, index, ...arguments)"
                    class="attribute-name"
                    :value="toSnakeKey(policy.userAttribute.key)"
                    placeholder="Attribute name"
                  >
                  </DiInputComponent>
                </td>
                <td class="policy-condition">
                  <div class="view-operator" v-if="isViewMode">{{ getOperatorDisplayName(policy.userAttribute.operator) }}</div>
                  <DiDropdown
                    v-else
                    :data="rlsOperators"
                    labelProps="label"
                    valueProps="value"
                    v-model="policy.userAttribute.operator"
                    :appendAtRoot="true"
                  ></DiDropdown>

                  <template v-if="isEqualOperator(policy)">
                    <div class="view-equal-value" v-if="isViewMode">{{ policy.userAttribute.values[0] }}</div>
                    <DiInputComponent v-else trim v-model="policy.userAttribute.values[0]" placeholder="Attribute value"></DiInputComponent>
                  </template>

                  <TagsInput
                    v-else-if="isInOperator(policy)"
                    placeholder="Attribute value"
                    id="attribute-values"
                    :style="{ 'pointer-events': isViewMode ? 'none' : 'auto' }"
                    :default-tags="policy.userAttribute.values"
                    :addOnKey="[13, ',', ';', ' ']"
                    @tagsChanged="handlePolicyValuesChanged(policiesResponse.data, index, ...arguments)"
                  >
                  </TagsInput>
                  <div v-else></div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <!--                    <DiButton-->
                    <!--                      class="rls-button filter"-->
                    <!--                      primary-->
                    <!--                      :disabled="isViewMode"-->
                    <!--                      :title="'' + policy.conditions.length"-->
                    <!--                      @click="showEditFilterBuilderModal(policy, index, true, handleUpdateFilter)"-->
                    <!--                    >-->
                    <!--                      <i v-if="index === policyLoadingIndex" class="fa fa-spin fa-spinner"></i>-->
                    <!--                      <i v-else class="di-icon-filter"></i>-->
                    <!--                    </DiButton>-->
                    <PopoverV2 class="dropdown" auto-hide>
                      <DiButton
                        v-if="policy.isAlwaysTrueCondition"
                        :disabled="isViewMode"
                        class="rls-button"
                        border
                        :is-loading="index === policyLoadingIndex"
                        title="View All"
                      >
                      </DiButton>

                      <DiButton
                        v-else-if="policy.isAlwaysFalseCondition"
                        :disabled="isViewMode"
                        class="rls-button"
                        border
                        :is-loading="index === policyLoadingIndex"
                        title="View Nothing"
                      >
                      </DiButton>
                      <!--                      <DiButton v-else-if="policy.conditions.length <= 0" :diabled="isViewMode" class="rls-button" border title="Add Filter">-->
                      <!--                        &lt;!&ndash;                        @click="showFilterBuilderModal(index)"&ndash;&gt;-->
                      <!--                        <i v-if="index === newPolicyLoadingIndex" class="fa fa-spin fa-spinner"></i>-->
                      <!--                        <i v-else class="di-icon-add"></i>-->
                      <!--                      </DiButton>-->
                      <DiButton v-else class="rls-button filter" primary :disabled="isViewMode" :title="'' + policy.conditions.length">
                        <!--                        @click="showEditFilterBuilderModal(policy, index, false, handleUpdateFilterForNewPolicy)"-->
                        <i v-if="index === policyLoadingIndex" class="fa fa-spin fa-spinner"></i>
                        <i v-else class="di-icon-filter"></i>
                      </DiButton>
                      <template v-if="isEditMode" #menu>
                        <div class="dropdown-menu filter-type-menu">
                          <a title="View All" @click="handleRLSPolicyFilterTypeChanged(policy, rlsFilterType.SeeAll)">View All</a>
                          <a title="View Nothing" @click="handleRLSPolicyFilterTypeChanged(policy, rlsFilterType.SeeNothing)">View Nothing</a>
                          <a
                            v-if="policy.isAlwaysTrueCondition || policy.isAlwaysFalseCondition || policy.isEmptyConditions"
                            title="Custom"
                            @click="showEditFilterBuilderModal(policy, index, true, handleUpdateFilter)"
                          >
                            Custom
                          </a>
                          <a v-else title="Custom" @click="showEditFilterBuilderModal(policy, index, true, handleUpdateFilter)">
                            Custom
                          </a>
                        </div>
                      </template>
                    </PopoverV2>
                  </div>
                </td>
                <td><i class="btn-icon btn-icon-border di-icon-delete p-0" :disabled="isViewMode" @click="showDeleteConfirmationModal(index)"></i></td>
              </tr>
              <tr v-for="(policy, index) in newPolicies" :key="'new-policy-' + index">
                <td>
                  <div v-if="isViewMode">{{ toSnakeKey(policy.userAttribute.key) }}</div>
                  <DiInputComponent
                    v-else
                    @change="updateRLSAttribute(newPolicies, index, ...arguments)"
                    class="attribute-name"
                    :value="toSnakeKey(policy.userAttribute.key)"
                    placeholder="Attribute name"
                  >
                  </DiInputComponent>
                </td>
                <td class="policy-condition">
                  <div class="view-operator" v-if="isViewMode">{{ getOperatorDisplayName(policy.userAttribute.operator) }}</div>
                  <DiDropdown
                    v-else
                    :data="rlsOperators"
                    labelProps="label"
                    valueProps="value"
                    v-model="policy.userAttribute.operator"
                    :appendAtRoot="true"
                  ></DiDropdown>
                  <template v-if="isEqualOperator(policy)">
                    <div class="view-equal-value" v-if="isViewMode">{{ policy.userAttribute.values[0] }}</div>
                    <DiInputComponent v-else trim v-model="policy.userAttribute.values[0]" placeholder="Attribute value"></DiInputComponent>
                  </template>

                  <TagsInput
                    v-else-if="isInOperator(policy)"
                    placeholder="Attribute value"
                    id="new-attribute-values"
                    :style="{ 'pointer-events': isViewMode ? 'none' : 'auto' }"
                    :default-tags="policy.userAttribute.values"
                    :addOnKey="[13, ',', ';', ' ']"
                    @tagsChanged="handlePolicyValuesChanged(newPolicies, index, ...arguments)"
                  >
                  </TagsInput>
                  <div v-else></div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <!-- Update Filter here  -->
                    <PopoverV2 class="dropdown" auto-hide>
                      <DiButton
                        v-if="policy.isAlwaysTrueCondition"
                        :disabled="isViewMode"
                        class="rls-button"
                        border
                        :is-loading="index === newPolicyLoadingIndex"
                        title="View All"
                      >
                      </DiButton>

                      <DiButton
                        v-else-if="policy.isAlwaysFalseCondition"
                        :disabled="isViewMode"
                        class="rls-button"
                        border
                        :is-loading="index === newPolicyLoadingIndex"
                        title="View Nothing"
                      >
                      </DiButton>
                      <DiButton v-else-if="policy.isEmptyConditions" :disabled="isViewMode" class="rls-button" border title="Add Filter">
                        <!--                        @click="showFilterBuilderModal(index)"-->
                        <i v-if="index === newPolicyLoadingIndex" class="fa fa-spin fa-spinner"></i>
                        <i v-else class="di-icon-add"></i>
                      </DiButton>
                      <DiButton v-else class="rls-button filter" primary :disabled="isViewMode" :title="'' + policy.conditions.length">
                        <!--                        @click="showEditFilterBuilderModal(policy, index, false, handleUpdateFilterForNewPolicy)"-->
                        <i v-if="index === newPolicyLoadingIndex" class="fa fa-spin fa-spinner"></i>
                        <i v-else class="di-icon-filter"></i>
                      </DiButton>
                      <template v-if="isEditMode" #menu>
                        <div class="dropdown-menu filter-type-menu">
                          <a title="View All" @click="handleRLSPolicyFilterTypeChanged(policy, rlsFilterType.SeeAll)">View All</a>
                          <a title="View Nothing" @click="handleRLSPolicyFilterTypeChanged(policy, rlsFilterType.SeeNothing)">View Nothing</a>
                          <a
                            v-if="policy.isAlwaysTrueCondition || policy.isAlwaysFalseCondition || policy.isEmptyConditions"
                            title="Custom"
                            @click="showFilterBuilderModal(index)"
                          >
                            Custom
                          </a>
                          <a v-else title="Custom" @click="showEditFilterBuilderModal(policy, index, false, handleUpdateFilterForNewPolicy)">
                            Custom
                          </a>
                        </div>
                      </template>
                    </PopoverV2>
                  </div>
                </td>
                <td><i class="btn-icon btn-icon-border di-icon-delete p-0" @click="showDeleteNewConfirmationModal(index)"></i></td>
              </tr>
            </tbody>
          </table>
        </div>
      </vuescroll>
      <div v-if="isRLSPoliciesEmpty && isNewRLSPoliciesEmpty" class="no-data flex-auto d-flex align-items-center justify-content-center">
        No RLS created yet
      </div>
    </StatusWidget>
    <ChartBuilderComponent ref="chartBuilderComponent"></ChartBuilderComponent>
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import { Prop, Ref, Vue } from 'vue-property-decorator';
import {
  AlwaysFalse,
  AlwaysTrue,
  ChartInfo,
  Condition,
  ConditionType,
  DatabaseSchema,
  DIException,
  PageResult,
  RlsPolicy,
  TableSchema,
  UserAttributeOperator
} from '@core/domain';
import { Inject } from 'typescript-ioc';
import { RlsService } from '@core/schema/service/RlsService';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { Status } from '@/shared';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import { DropdownData } from '@/shared/components/Common/DiDropdown';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { Log } from '@core/utils';
import TagsInput from '@/shared/components/TagsInput.vue';
import { ListUtils } from '@/utils';
import { cloneDeep, difference } from 'lodash';
import { PopupUtils } from '@/utils/popup.utils';
import ChartBuilderComponent from '@/screens/DashboardDetail/components/DataBuilderModal/ChartBuilderComponent.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { StringUtils } from '@/utils/string.utils';
import { ViewMode } from '@/screens/DataManagement/views/DataSchema/model';
import { Modals } from '@/utils/modals';
import { RLSFilterBuilderConfig } from '@/screens/DashboardDetail/components/DataBuilderModal/ChartBuilderConfig';
import { UpdateRLSPolicyRequest } from '@core/domain/Model/Schema/Rls/UpdateRLSPolicyRequest';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';

enum RLSFilterType {
  SeeAll = 'see_all',
  SeeNothing = 'see_nothing',
  Normal = 'normal'
}

@Component({
  components: {
    DiButton,
    DiInputComponent,
    DiDropdown,
    StatusWidget,
    TagsInput,
    ChartBuilderComponent,
    PopoverV2
  }
})
export default class ManageRLSPolicy extends Vue {
  private readonly rlsFilterType = RLSFilterType;
  private status: Status = Status.Loaded;
  private errorMessage = '';
  private policiesResponse: PageResult<RlsPolicy> | null = null;
  private oldPolicies: RlsPolicy[] = [];
  private newPolicies: RlsPolicy[] = [];
  private newPolicyLoadingIndex = -1;
  private policyLoadingIndex = -1;

  @Inject
  private rlsService!: RlsService;

  @Ref()
  private readonly chartBuilderComponent!: ChartBuilderComponent;

  @Prop()
  private tableSchema!: TableSchema;

  @Prop()
  private mode!: ViewMode;

  private get isViewMode() {
    return this.mode === ViewMode.ViewRLS;
  }

  private get isEditMode() {
    return this.mode === ViewMode.EditRLS;
  }

  private get rlsOperators(): DropdownData[] {
    return [
      {
        label: 'in',
        value: UserAttributeOperator.Contain
      },
      {
        label: 'equal',
        value: UserAttributeOperator.Equal
      },
      {
        label: 'is null',
        value: UserAttributeOperator.IsNull
      }
    ];
  }

  private getOperatorDisplayName(operator: UserAttributeOperator) {
    switch (operator) {
      case UserAttributeOperator.Contain:
        return 'in';
      case UserAttributeOperator.Equal:
        return 'equal';
      default:
        return 'is null';
    }
  }

  toSnakeKey(text: string) {
    return StringUtils.toSnakeCase(text);
  }

  public get canSave() {
    return ListUtils.isNotEmpty(this.newPolicies) || ListUtils.isNotEmpty(difference(this.oldPolicies, this.policiesResponse?.data ?? []));
  }

  private get isRLSPoliciesEmpty() {
    return ListUtils.isEmpty(this.policiesResponse?.data ?? []);
  }

  private get isNewRLSPoliciesEmpty() {
    return ListUtils.isEmpty(this.newPolicies);
  }

  private isEqualOperator(policy: RlsPolicy) {
    return policy.userAttribute.isEqualOperator;
  }

  private isInOperator(policy: RlsPolicy) {
    return policy.userAttribute.isInOperator;
  }

  private showLoading() {
    this.status = Status.Loading;
  }

  private showLoaded() {
    this.status = Status.Loaded;
  }

  private showUpdating() {
    this.status = Status.Updating;
  }

  private showError(ex: DIException) {
    this.errorMessage = ex.message;
    this.status = Status.Error;
  }

  async mounted() {
    await this.handleLoadRLSPolicies();
  }

  private handlePolicyValuesChanged(policies: RlsPolicy[], policyIndex: number, data: any[]) {
    policies[policyIndex].userAttribute.values = data.map(tags => tags['text']);
    Log.debug('ManageRLSPolicy::handlePolicyValuesChanged:policy::', this.policiesResponse?.data[policyIndex]);
  }

  private updateRLSAttribute(policies: RlsPolicy[], policyIndex: number, text: string) {
    policies[policyIndex].userAttribute.key = this.toSnakeKey(text);
  }

  async handleLoadRLSPolicies(force = true) {
    try {
      force ? this.showLoading() : this.showUpdating();
      await this.loadRLSPolicies();
      this.updateData();
      this.showLoaded();
    } catch (e) {
      const ex = DIException.fromObject(e);
      this.showError(ex);
      Log.error('ManageRLSPolicy::handleLoadRLSPolicies::error::', ex.message);
    }
  }

  public cancelRLS() {
    this.policiesResponse!.data = cloneDeep(this.oldPolicies);
    this.newPolicies = [];
  }

  private async loadRLSPolicies() {
    this.policiesResponse = await this.rlsService.listPolicies(this.tableSchema.dbName, this.tableSchema.name);
  }

  public addRLSPolicy() {
    const policy = RlsPolicy.empty()
      .withDatabaseName(this.tableSchema.dbName)
      .withTableName(this.tableSchema.name);
    this.newPolicies.push(policy);
  }

  public async handleSavePolicies() {
    try {
      this.showUpdating();
      const request = this.createRequest();
      this.policiesResponse = await this.rlsService.updatePolicy(request);
      this.updateData();
    } catch (e) {
      const ex = DIException.fromObject(e);
      PopupUtils.showError(ex.message);
      Log.error('ManageRLSPolicy::savePolicies::error::', e?.message);
      throw ex;
    } finally {
      this.showLoaded();
    }
  }

  private updateData() {
    this.oldPolicies = cloneDeep(this.policiesResponse!.data);
    this.newPolicies = [];
  }

  private createRequest(): UpdateRLSPolicyRequest {
    const savePolicies: RlsPolicy[] = [];
    for (const policy of this.policiesResponse!.data) {
      Log.debug('saveUpdatedPolicies::policy::', policy);
      policy.ensurePolicy();
      savePolicies.push(policy);
    }
    for (const policy of this.newPolicies) {
      policy.ensurePolicy();
      savePolicies.push(policy);
    }
    return new UpdateRLSPolicyRequest(this.tableSchema.dbName, this.tableSchema.name, savePolicies);
  }

  private async handleDeleteRLSPolicy(index: number) {
    try {
      if (this.policiesResponse?.data) {
        this.showUpdating();
        this.policiesResponse!.data = ListUtils.removeAt(this.policiesResponse.data, index);
      }
    } catch (e) {
      PopupUtils.showError(e.message);
      Log.error('ManageRLSPolicy::handleDeleteRLSPolicy::error::', e);
    } finally {
      this.showLoaded();
    }
  }

  private showDeleteConfirmationModal(index: number) {
    Modals.showConfirmationModal('Are you sure you want to delete this RLS', { onOk: () => this.handleDeleteRLSPolicy(index) });
  }

  private showDeleteNewConfirmationModal(index: number) {
    Modals.showConfirmationModal('Are you sure you want to delete this RLS', { onOk: () => this.handleDeleteNewPolicy(index) });
  }

  private handleDeleteNewPolicy(index: number) {
    try {
      this.showUpdating();
      this.newPolicies = ListUtils.removeAt(this.newPolicies, index);
    } catch (e) {
      PopupUtils.showError(e.message);
      Log.error('ManageRLSPolicy::handleDeleteRLSPolicy::error::', e);
    } finally {
      this.showLoaded();
    }
  }

  private async showFilterBuilderModal(policyIndex: number) {
    const tableChartInfo = this.tableSchema.toTableChart([]);
    this.newPolicyLoadingIndex = policyIndex;
    this.chartBuilderComponent.showModal({
      chart: tableChartInfo,
      selectedTables: [this.tableSchema.name],
      database: new DatabaseSchema(this.tableSchema.dbName, this.tableSchema.organizationId, this.tableSchema.dbName, [this.tableSchema]),
      onCompleted: chartInfo => this.handleUpdateFilterForNewPolicy(chartInfo, policyIndex),
      onCancel: this.resetLoadingIndex,
      config: RLSFilterBuilderConfig
    });
  }

  private async showEditFilterBuilderModal(
    policy: RlsPolicy,
    policyIndex: number,
    isCreatedPolicy: boolean,
    onSubmitFilter: (chartInfo: ChartInfo, policyIndex: number) => Promise<void>
  ) {
    isCreatedPolicy ? (this.policyLoadingIndex = policyIndex) : (this.newPolicyLoadingIndex = policyIndex);
    const tableChartInfo = this.tableSchema.toTableChart(policy.conditions ?? []);
    this.chartBuilderComponent.showModal({
      chart: tableChartInfo,
      selectedTables: [this.tableSchema.name],
      database: new DatabaseSchema(this.tableSchema.dbName, this.tableSchema.organizationId, this.tableSchema.dbName, [this.tableSchema]),
      onCompleted: chartInfo => onSubmitFilter(chartInfo, policyIndex),
      onCancel: this.resetLoadingIndex,
      config: RLSFilterBuilderConfig
    });
  }

  private async handleUpdateFilterForNewPolicy(chartInfo: ChartInfo, policyIndex: number) {
    this.newPolicies[policyIndex].conditions = chartInfo.setting.filters;
    this.newPolicyLoadingIndex = -1;
  }

  private async handleUpdateFilter(chartInfo: ChartInfo, policyIndex: number) {
    this.policiesResponse!.data[policyIndex].conditions = chartInfo.setting.filters;
    this.policyLoadingIndex = -1;
  }

  private resetLoadingIndex() {
    this.newPolicyLoadingIndex = -1;
    this.policyLoadingIndex = -1;
  }

  private getConditions(filerType: RLSFilterType): Condition[] {
    switch (filerType) {
      case RLSFilterType.SeeNothing:
        return [new AlwaysFalse()];
      case RLSFilterType.SeeAll:
        return [new AlwaysTrue()];
      case RLSFilterType.Normal:
        return [];
    }
  }

  private handleRLSPolicyFilterTypeChanged(policy: RlsPolicy, filterType: RLSFilterType) {
    policy.conditions = this.getConditions(filterType);
  }
}
</script>

<style lang="scss">
@import 'node_modules/bootstrap/scss/functions';
@import 'node_modules/bootstrap/scss/variables';
@import 'node_modules/bootstrap/scss/mixins/breakpoints';

.manage-policy {
  height: 100%;
  position: relative;

  .rls-button {
    height: 26px;
  }

  .rls-button.filter {
    .title {
      padding-left: 4px;
    }
  }

  .no-data {
    position: absolute;
    height: calc(100% - 48px);
    width: 100%;
    top: 48px;
    left: 0px;
    font-family: Roboto;
    font-size: 14px;
    letter-spacing: 0.2px;
    text-align: center;
    color: var(--secondary-text-color);
  }

  table {
    margin-bottom: 0;

    thead {
      position: sticky;
      top: 0;
      left: 0;

      th {
        background: #fafafb;
        border: 0;
      }

      .attribute-col {
        @media screen and(min-width: 2000px) {
          width: 450px;
        }

        @media screen and(min-width: 2500px) {
          width: 650px;
        }

        @include media-breakpoint-up(lg) {
          width: 300px;
        }

        @include media-breakpoint-down(lg) {
          width: 250px;
        }
      }

      .condition-col {
      }

      .filter-col {
        width: 125px;
      }

      .action-col {
        width: 64px;
      }
    }

    tbody {
      tr {
        td {
          min-height: 48px;
          border-top: 0;
          border-bottom: 1px solid #f0f0f0 !important;
          padding-top: 6px !important;
          padding-top: 5px;

          .di-input-component {
            height: 34px;

            &--input {
              height: 34px !important;
            }
          }

          .attribute-name {
            margin-right: 40px;

            .di-input-component--input {
              //width: 200px;
            }
          }

          .filter-type-menu {
            a {
              padding: 8px;
              cursor: pointer;

              &:hover {
                background-color: var(--active-color);
              }
            }
          }
        }

        .policy-condition {
          display: flex;
          align-items: center;

          .select-container {
            width: 100px;
            height: 34px;
            margin-right: 8px;
            margin-top: 0;

            button {
              height: 34px;
            }
          }

          .di-input-component {
            width: calc(100% - 150px);
          }

          .view-operator {
            margin-right: 12px;
            width: 37px;
          }

          .view-equal-value {
            padding: 5px 12px;
            background: #f2f2f7;
            line-height: 1;
            border-radius: 4px;
          }

          .vue-tags-input-container {
            width: calc(100% - 150px);

            .ti-tag.ti-valid {
              height: 22px;
            }

            .ti-icon-close {
              width: 16px;
              height: 16px;
              border-radius: 16px;
            }

            .vue-tags-input {
              background: var(--input-background-color) !important;
              max-width: unset;
              border-radius: 4px;

              .ti-input {
                max-height: unset;
                width: 100%;
              }
            }
          }
        }
      }
    }
  }
}
</style>
