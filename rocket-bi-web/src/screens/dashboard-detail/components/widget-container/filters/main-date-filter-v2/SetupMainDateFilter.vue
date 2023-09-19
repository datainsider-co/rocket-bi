<template>
  <div class="setup-main-date-filter d-flex align-items-center">
    <SelectFieldButton
      ref="selectButton"
      id="btn-set-main-date-filter"
      title="Setup Main Date Filter"
      :isShowPopoverImmediate="isResetMainDateFilter"
      :isShowResetFilterButton="false"
      :isShowGroupedHeader="false"
      :isShowExtraSlot="true"
      :dashboardId="dashboardId"
      :fnProfileFieldFilter="fnProfileFieldFilter"
      @handle-clear-reset-main-date="handleClearResetMainDate"
    >
      <template #icon>
        <i class="di-icon-calendar"></i>
      </template>
      <template #extraStep>
        <div class="select-default-time">
          <div class="title">Choose Default Time Range</div>
          <vuescroll class="vuescroll-select-default-time">
            <div class="dropdown-default-time-container">
              <a
                href=""
                class="default-time-item btn-ghost"
                v-for="(item, index) in DATE_MODE_LIST"
                :key="index"
                @click.prevent="handleSelectDefaultTime(item.mode)"
              >
                {{ item.text }}
              </a>
            </div>
          </vuescroll>
        </div>
      </template>
    </SelectFieldButton>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Provide, Ref, Vue } from 'vue-property-decorator';
import FieldListingItem from '@/shared/components/FieldListingItem.vue';
import SelectFieldButton from '@/screens/dashboard-detail/components/SelectFieldButton.vue';
import { MainDateMode } from '@core/common/domain/model';
import DiButton from '@/shared/components/common/DiButton.vue';
import { DashboardModule } from '@/screens/dashboard-detail/stores/dashboard/DashboardStore';
import { DateTimeConstants } from '@/shared';
import { ChartUtils } from '@/utils';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import { Log } from '@core/utils';

@Component({
  components: {
    DiButton,
    SelectFieldButton,
    FieldListingItem
  }
})
export default class SetupMainDateFilter extends Vue {
  private readonly DATE_MODE_LIST: { mode: MainDateMode; text: string }[] = DateTimeConstants.MAIN_DATE_FILTER_MODE_LIST;
  private selectedProfileField: FieldDetailInfo = FieldDetailInfo.default();

  @Prop({ required: false, default: false, type: Boolean })
  readonly isResetMainDateFilter!: boolean;

  @Ref()
  private readonly selectButton?: SelectFieldButton;

  @Provide()
  // FIXME: rename this folder
  private handleAddNewFilter(profileField: FieldDetailInfo) {
    Log.debug('SetupMainDateFilter::handleSelectedField::profilField: ', profileField);
    this.selectedProfileField = profileField;
    this.selectButton?.show();
  }

  handleClearResetMainDate() {
    this.$emit('handle-clear-reset-main-date');
  }

  private handleSelectDefaultTime(mainDateFilterMode: MainDateMode) {
    this.$emit('handle-setup-main-date-filter', mainDateFilterMode);
  }

  private get dashboardId(): number | undefined {
    //Todo: not show
    return DashboardModule.id;
  }

  private fnProfileFieldFilter(profileField: FieldDetailInfo): boolean {
    return ChartUtils.isDateType(profileField.field.fieldType);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables.scss';

.hidden {
  display: none;
}

.select-default-time {
  .title {
    color: var(--text-color--root);
    font-weight: 600;
    padding: 8px 0;
    font-size: 14px;
  }

  .back-to-select-db {
    display: flex;
    align-items: center;
    opacity: 0.8;
    color: var(--text-color--root);
    padding: 8px 0;
    font-size: 14px;

    img {
      padding-right: 8px;
      width: 16px;
      height: 16px;
    }

    .title-btn-back {
    }

    &:hover {
      text-decoration: none;
    }
  }

  .vuescroll-select-default-time {
    .dropdown-default-time-container {
      font-size: 14px;
      font-family: Barlow;
      max-height: 300px;
      display: flex;
      flex-direction: column;

      .default-time-item {
        opacity: 0.8;
        color: var(--text-color--root);
        padding-top: 8px;
        padding-bottom: 8px;
        padding-left: 20px;
        text-decoration: none;

        &:hover {
          color: var(--text-color--root);
        }
      }
    }
  }
}

.setup-main-date-filter {
}
</style>
