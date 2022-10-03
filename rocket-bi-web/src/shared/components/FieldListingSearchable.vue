<template>
  <div class="field-listing-area">
    <div class="custom-search-input">
      <SearchInput :timeBound="200" hintText="Search columns..." @onTextChanged="handleInputTextChanged" />
    </div>
    <div
      v-if="canBack"
      :id="genBtnId('field-listing-searchable-back')"
      class="d-flex flex-row back-area btn-ghost align-items-center"
      @click.prevent="handleBack"
    >
      <div>
        <b-icon-chevron-left></b-icon-chevron-left>
      </div>
      <div class="mr-auto unselectable col-11">
        {{ displayBackTitle }}
      </div>
    </div>
    <vuescroll>
      <div class="custom-listing">
        <FieldListingItem
          v-if="haveGrouped"
          :filters-grouped-fields="filtersGroupedFields"
          :isShowGroupedHeader="isShowGroupedHeader"
          @on-click-field="handleClickFilter"
        >
          <slot slot-scope="{ field }" :data="field"></slot>
        </FieldListingItem>

        <div v-else>
          There are no records to show
        </div>
      </div>
    </vuescroll>
    <div v-if="isShowResetFilterButton" class="custom-button-reset">
      <DiButton :id="genBtnId('reset-filter')" textStyle="unselectable" title="Reset Filters" @click="resetFilter">
        <i class="icon-title di-icon-reset mr-2"></i>
      </DiButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Prop, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { GroupedField } from '@/shared';
import { ListUtils, SchemaUtils } from '@/utils';
import FieldListingItem from '@/shared/components/FieldListingItem.vue';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';

@Component({
  components: { FieldListingItem, DiButton }
})
export default class FieldListingSearchable extends Vue {
  @Prop({ required: true, type: Array })
  groupedFields!: GroupedField[];

  // Inject from UserProfile.vue
  @Prop({ default: false, type: Boolean })
  canBack!: boolean;
  @Prop({ default: '', type: String })
  displayBackTitle!: string;
  @Prop({ type: Boolean, default: true })
  isShowResetFilterButton!: boolean;
  @Prop({ type: Boolean, default: true })
  isShowGroupedHeader!: boolean;
  // Inject from TrackingProfile.vue
  // Inject from DashboardHeader.vue
  @Inject({ default: undefined })
  private readonly handleAddNewFilter?: (profileField: FieldDetailInfo) => void;
  // Inject from SelectFieldButton.vue
  // Inject from DashboardHeader.vue
  @Inject({ default: undefined })
  private readonly handleHideListing?: () => void;

  // Inject from DashboardHeader.vue
  // Inject from TrackingProfile.vue
  @Inject({ default: undefined })
  private readonly handleResetFilter?: () => void;

  private searchString = '';

  private get filtersGroupedFields(): GroupedField[] {
    return SchemaUtils.searchGroupedFields(this.groupedFields, this.searchString);
  }

  private get haveGrouped(): boolean {
    return ListUtils.isNotEmpty(this.filtersGroupedFields);
  }

  private resetFilter() {
    this.handleHideListing?.call(this);
    this.handleResetFilter?.call(this);
  }

  private handleClickFilter(profileField: FieldDetailInfo) {
    this.handleHideListing?.call(this);
    this.handleAddNewFilter?.call(this, profileField);
  }

  @Emit('onClickBack')
  private handleBack(event: MouseEvent) {
    return event;
  }

  private handleInputTextChanged(newText: string) {
    this.searchString = newText;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.field-listing-area {
  .custom-search-input {
    display: flex;
    background-color: var(--dashboard-input-background-color, var(--primary--root));
    border-radius: 4px;
    padding: 0 15px;
    height: 40px;

    ::v-deep {
      .form-control {
        background-color: unset;
        color: var(--text-color);
        caret-color: var(--text-color);
      }
    }
  }

  .back-area {
    letter-spacing: 0.6px;
    @include bold-text-14();
    margin-top: 12px;
    padding: 12px 12px 12px 0;

    cursor: pointer;
  }

  .custom-listing {
    color: var(--text-color);
    font-size: 14px;
    margin-top: 12px;
    max-height: 445px;
  }

  .custom-button-reset {
    margin-top: 24px;

    ::v-deep {
      > div {
        justify-content: center;
        //padding: 0;

        > div {
          color: var(--text-color);
          //opacity: 0.5;
          text-align: center;
        }
      }
    }
  }
}
</style>
