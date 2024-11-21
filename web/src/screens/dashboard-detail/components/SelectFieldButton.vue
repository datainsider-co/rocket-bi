<template>
  <div class="position-relative">
    <DiIconTextButton :id="id" ref="btn" :title="title" class="col-auto pl-8" tabindex="-1" @click="toggleShowPopover">
      <slot name="icon"></slot>
    </DiIconTextButton>
    <BPopover :show.sync="isShowPopover" :target="id" boundary="window" custom-class="db-listing-searchable" placement="bottom" triggers="blur">
      <StatusWidget :error="databaseError" :status="databaseStatus" btn-icon-40 d-table @retry="handleLoadDatabases">
        <SlideXRightTransition group>
          <div key="1">
            <slot v-if="isShowExtraSlot" name="extraStep"></slot>
            <div v-else>
              <DataListingSearchable
                v-if="isSelectDatabase"
                key="db-listing"
                :options="databaseOptions"
                hintText="Search database..."
                @onClickOption="handleClickDatabase"
              >
              </DataListingSearchable>
              <DataListingSearchable
                v-else-if="isSelectTable"
                key="table-listing"
                :canBack="true"
                :displayBackTitle="databaseSelected.displayName || databaseSelected.name"
                :options="tableOptions"
                hintText="Search table..."
                @onClickBack="handleClickBackToSelectDatabase"
                @onClickOption="handleClickTable"
              >
              </DataListingSearchable>
              <FieldListingSearchable
                v-else
                key="field-listing"
                :canBack="true"
                :displayBackTitle="tableSelected.displayName || tableSelected.name"
                :groupedFields="groupedFields"
                :isShowGroupedHeader="isShowGroupedHeader"
                :isShowResetFilterButton="isShowResetFilterButton"
                @onClickBack="handleClickBackToTSelectTable"
              >
              </FieldListingSearchable>
            </div>
          </div>
        </SlideXRightTransition>
      </StatusWidget>
    </BPopover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Provide, Ref, Vue, Watch } from 'vue-property-decorator';
import DataListingSearchable from '@/shared/components/DataListingSearchable.vue';
import FieldListingSearchable from '@/shared/components/FieldListingSearchable.vue';
import { GroupedField, SelectOption, Status, Stores } from '@/shared';
import { DatabaseInfo, DIException, FieldDetailInfo, TableSchema } from '@core/common/domain';
import { SlideXRightTransition } from 'vue2-transitions';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { mapGetters } from 'vuex';
import { ListUtils, SchemaUtils } from '@/utils';
import { SchemaService } from '@core/schema/service/SchemaService';
import { Di } from '@core/common/modules';
import { DataManager } from '@core/common/services';
import { GroupFieldBuilder } from '@core/schema/service/GroupFieldBuilder';
import { DateFieldFilter, NumberFieldFilter, TextFieldFilter } from '@core/schema/service/FieldFilter';
import { DashboardModule } from '@/screens/dashboard-detail/stores';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';

@Component({
  components: {
    DiIconTextButton,
    StatusWidget,
    FieldListingSearchable,
    DataListingSearchable,
    SlideXRightTransition
  }
})
export default class SelectFieldButton extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly isShowExtraSlot!: boolean;
  @Prop({ type: Boolean, default: true })
  readonly isShowResetFilterButton!: boolean;
  @Prop({ type: Boolean, default: true })
  readonly isShowGroupedHeader!: boolean;
  @Prop({ required: true, type: Number })
  readonly dashboardId!: number;
  @Prop()
  readonly fnProfileFieldFilter?: (profileField: FieldDetailInfo) => boolean;
  private isShowPopover = false;
  private databaseStatus = Status.Loading;
  private databaseError = '';
  private databaseInfos: DatabaseInfo[] = [];
  private databaseSelected: DatabaseInfo | null = null;
  private tableSelected: TableSchema | null = null;
  @Prop({ type: Boolean, default: false })
  private isShowPopoverImmediate!: boolean;
  @Prop({ required: true, type: String })
  private id!: string;
  @Prop({ required: true, type: String })
  private title!: string;

  @Ref()
  private readonly btn!: any;

  private get databaseUniqueNames(): string[] {
    return DashboardModule.databaseUniqueNames;
  }

  private get databaseOptions(): SelectOption[] {
    return this.databaseInfos.map((item, index) => {
      return { id: index, displayName: item.displayName || item.name, data: item };
    });
  }

  private get tableOptions(): SelectOption[] {
    if (this.databaseSelected) {
      return this.databaseSelected.tables.map((table, index) => {
        return { id: index, displayName: table.displayName || table.name, data: table };
      });
    } else {
      return [];
    }
  }

  private get groupedFields(): GroupedField[] {
    if (ListUtils.isNotEmpty(this.profileFields)) {
      return new GroupFieldBuilder(this.profileFields)
        .addFilter(new NumberFieldFilter())
        .addFilter(new DateFieldFilter())
        .addFilter(new TextFieldFilter())
        .build();
    } else {
      return [];
    }
  }

  private get profileFields(): FieldDetailInfo[] {
    if (this.tableSelected && ListUtils.isNotEmpty(this.tableSelected.columns)) {
      if (this.fnProfileFieldFilter) {
        return SchemaUtils.buildFieldsFromTableSchemas([this.tableSelected]).filter(this.fnProfileFieldFilter);
      }

      return SchemaUtils.buildFieldsFromTableSchemas([this.tableSelected]);
    } else {
      return [];
    }
  }

  private get isSelectDatabase(): boolean {
    return !this.databaseSelected;
  }

  private get isSelectTable(): boolean {
    return !this.tableSelected;
  }

  private get isNeedLoadDatabases(): boolean {
    return this.databaseStatus == Status.Error || ListUtils.isEmpty(this.databaseInfos);
  }

  private get schemaService(): SchemaService {
    return Di.get(SchemaService);
  }

  @Watch('isShowPopoverImmediate', { immediate: true })
  onShowPopoverChanged(isShowPopoverImmediate: boolean) {
    if (isShowPopoverImmediate) {
      this.toggleShowPopover();
      this.$nextTick(() => {
        this.btn.$el.focus();
      });
    }
  }

  @Watch('isShowPopover')
  handleClearResetMainDate(val: boolean, oldVal: boolean) {
    if (!val) this.$emit('handle-clear-reset-main-date');
  }

  @Provide('handleHideListing')
  hide(): void {
    this.isShowPopover = false;
  }

  show(): void {
    this.isShowPopover = true;
  }

  private toggleShowPopover() {
    this.isShowPopover = !this.isShowPopover;
    if (this.isSelectDatabase && this.isNeedLoadDatabases) {
      this.handleLoadDatabases();
    }
  }

  private handleClickDatabase(selectOption: SelectOption) {
    this.databaseSelected = selectOption.data as DatabaseInfo;
  }

  private handleClickTable(selectOption: SelectOption) {
    this.tableSelected = selectOption.data as TableSchema;
  }

  private handleClickBackToSelectDatabase() {
    this.databaseSelected = null;
  }

  private handleClickBackToTSelectTable() {
    this.tableSelected = null;
  }

  private async handleLoadDatabases(): Promise<void> {
    this.databaseStatus = Status.Loading;
    this.databaseError = '';
    if (ListUtils.isNotEmpty(this.databaseUniqueNames)) {
      try {
        this.databaseInfos = (await this.schemaService.getListDatabaseSchema(this.databaseUniqueNames)).map(dbInfos => dbInfos.database);
        if (!this.databaseSelected) {
          this.loadUsedDatabaseInfo();
        }
        this.databaseStatus = Status.Loaded;
      } catch (ex) {
        this.handleErrorLoadDatabases(ex);
      }
    } else {
      this.databaseStatus = Status.Loaded;
    }
  }

  private handleErrorLoadDatabases(ex: any) {
    if (ex instanceof DIException) {
      this.databaseError = ex.message;
      this.databaseStatus = Status.Error;
    }
  }

  private getDatabaseInfo(dbName: string) {
    return (this.databaseSelected = this.databaseInfos.find(dbInfo => dbInfo.name === dbName) ?? null);
  }

  private loadUsedDatabaseInfo(): void {
    const dbSelected = DashboardModule.mainDatabase;
    if (dbSelected) {
      this.databaseSelected = this.getDatabaseInfo(dbSelected);
    }
  }
}
</script>

<style lang="scss" scoped>
.db-listing-searchable {
  background-color: var(--secondary--root);
  border-radius: 4px;
  box-shadow: var(--menu-shadow--root);
  box-sizing: content-box;
  max-width: unset;
  padding: 16px;
  width: 311px;
  ///Not small than 10000
  z-index: 10000;

  ::v-deep {
    .arrow {
      display: none;
    }

    .popover-body {
      padding: 0 !important;
    }
  }
}
</style>
