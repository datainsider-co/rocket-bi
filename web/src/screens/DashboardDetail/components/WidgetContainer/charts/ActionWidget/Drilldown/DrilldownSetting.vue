<template>
  <div :id="containerId">
    <div class="popover-panel">
      <div class="header">
        <div class="d-inline mr-1 btn-ghost" @click="handleResetDrilldown">
          <b-icon-house-door />
        </div>
        <template v-for="(path, index) in drilldownPaths">
          <div :key="index" class="d-inline btn-ghost" @click.stop="rollbackQueryTo(index)">
            <div class="d-inline">{{ path.value }}</div>
            <div class="d-inline">{{ divider }}</div>
          </div>
        </template>
        <div class="d-inline btn-ghost">
          <div class="d-inline">{{ header }}</div>
          <div v-if="valueSelected" class="d-inline">{{ valueSelectedForDisplay }}</div>
          <div class="d-inline">{{ divider }}</div>
        </div>
      </div>
      <div class="custom-body">
        <div class="divider" />
        <div class="title">{{ title }}</div>
        <template>
          <template v-if="isValueSelectionStep">
            <StatusWidget :error="errorMessage" :status="currentStatus" @retry="tryLoadDrillValue">
              <template v-if="data && data.hasData()">
                <div class="body-value-listing">
                  <vuescroll>
                    <DataListing :records="data.records" class="data-listing" key-for-display="0" key-for-value="0" @onClick="selectValue"></DataListing>
                  </vuescroll>
                </div>
              </template>
              <template v-else>
                <h4>No records for drilldown</h4>
              </template>
            </StatusWidget>
          </template>
          <template v-else>
            <StatusWidget :error="errorMessage" :status="currentStatus" @retry="handleLoadFieldSupported">
              <FieldListingSearchable
                key="field-listing"
                :canBack="false"
                :groupedFields="groupedFields"
                :isShowGroupedHeader="true"
                :isShowResetFilterButton="false"
              >
                <template slot-scope="{ data }">
                  <template v-if="isGroupDate(data)">
                    <DataListing :records="data.children" key-for-display="displayName" key-for-value="field">
                      <div slot-scope="{ row }" class="custom-display-option d-flex flex-row justify-content-center align-items-center btn-ghost">
                        <div class="col-10 btn-row cursor-pointer" @click.stop="selectedDateField(row)">
                          <h4 :title="row.displayName" class="text-nowrap">{{ row.displayName }}</h4>
                        </div>
                        <div :id="genIdSeeMore(row)" class="col-2 custom-more-icon cursor-pointer" tabindex="-1" @click.stop="handleClickSeeMore(row)">
                          <RightIcon width="37" height="37"></RightIcon>
                        </div>
                      </div>
                    </DataListing>
                  </template>
                  <template v-else>
                    <DataListing :records="data.children" key-for-display="displayName" @onClick="selectedField"></DataListing>
                  </template>
                </template>
              </FieldListingSearchable>
            </StatusWidget>
          </template>
        </template>
      </div>
    </div>
    <DIPopover
      v-if="isSeeMoreShowing"
      :isShow="isSeeMoreShowing"
      :targetId="idDimensionSelected"
      :z-index="1070"
      boundary="viewport"
      container="body"
      custom-class="drilldown-scala-function"
      placement="top-right"
      triggers=""
    >
      <div class="function-selection">
        <vuescroll :ops="drilldownScrollOptions">
          <template v-for="(node, index) in functionsSupported">
            <div :key="index" class="btn-row cursor-pointer btn-ghost" @click.stop="handleSelectFunction(node)">
              <h4 class="text-nowrap">{{ node.label }}</h4>
            </div>
          </template>
        </vuescroll>
      </div>
    </DIPopover>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { cloneDeep } from 'lodash';
import { ZoomModule } from '@/store/modules/zoom.store';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';
import { ChartInfo, Field, FieldRelatedFunction, GeoArea, Group, MapQuerySetting, WidgetId } from '@core/domain/Model';
import { DateFunctionTypes, FunctionFamilyTypes, GroupedField, HorizontalScrollConfig, LabelNode, SortTypes, Status, VerticalScrollConfigs } from '@/shared';
import { PopupUtils } from '@/utils/popup.utils';
import { Drilldownable, DrilldownData } from '@core/domain/Model/Query/Features/Drilldownable';
import { DateHistogramFunctionBuilder } from '@core/services';
import { DataType } from '@core/schema/service/FieldFilter';
import { AbstractTableResponse } from '@core/domain/Response/Query/AbstractTableResponse';
import { DIException } from '@core/domain/Exception';
import DataListing from '../DataListing.vue';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import FieldListingSearchable from '@/shared/components/FieldListingSearchable.vue';
import DIPopover from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/DIPopover.vue';
import { Log } from '@core/utils';
import { DashboardControllerModule, DrilldownDataStoreModule, FilterModule, QuerySettingModule } from '@/screens/DashboardDetail/stores';
import { RandomUtils } from '@/utils';
import { GeolocationModule } from '@/store/modules/data_builder/geolocation.store';

export enum DisplayTypes {
  Popover = 'popover',
  Context = 'context'
}

@Component({
  components: {
    StatusWidget,
    DataListing,
    FieldListingSearchable,
    DIPopover
  }
})
export default class DrilldownSetting extends Vue {
  private header = '';
  private title = 'Select a dimension to drilldown';

  private data: AbstractTableResponse | null = null;
  private currentStatus = Status.Loading;
  private errorMessage = '';

  private readonly divider = ' / ';

  private readonly drilldownScrollOptions = VerticalScrollConfigs;

  private readonly functionsSupported: LabelNode[] = [
    { label: DateFunctionTypes.secondOf },
    { label: DateFunctionTypes.minuteOf },
    { label: DateFunctionTypes.hourOf },
    { label: DateFunctionTypes.dayOf },
    { label: DateFunctionTypes.weekOf },
    { label: DateFunctionTypes.monthOf },
    { label: DateFunctionTypes.quarterOf },
    { label: DateFunctionTypes.yearlyOf },

    { label: DateFunctionTypes.year },
    { label: DateFunctionTypes.quarterOfYear },
    { label: DateFunctionTypes.monthOfYear },
    { label: DateFunctionTypes.dayOfYear },
    { label: DateFunctionTypes.dayOfMonth },
    { label: DateFunctionTypes.dayOfWeek },
    { label: DateFunctionTypes.hourOfDay },
    { label: DateFunctionTypes.minuteOfHour },
    { label: DateFunctionTypes.secondOfMinute }
  ];

  private idDimensionSelected = '';
  private valueSelected = '';

  private drilldownPaths: DrilldownData[] = [];
  private fieldSelected: FieldDetailInfo | null = null;
  private groupedFields: GroupedField[] = [];

  private currentQuery!: QuerySetting;
  private isPathChanged = false;
  private currentPathIndex = 0;
  private prefix = RandomUtils.nextString(4);

  @Prop({ required: true })
  private readonly metaData!: ChartInfo;

  @Prop({ required: false, type: String })
  private readonly defaultDrilldownValue?: string;

  @Prop({ required: true, type: String })
  private readonly displayType!: DisplayTypes;

  @Prop({ required: false, type: Object })
  private readonly extraData?: any;

  private get widgetId(): WidgetId {
    return this.metaData.id;
  }

  private get valueSelectedForDisplay(): string {
    return ` (${this.valueSelected}) `;
  }

  private get isValueSelectionStep(): boolean {
    return !this.valueSelected;
  }

  private get isSeeMoreShowing(): boolean {
    return !!this.idDimensionSelected;
  }

  private set isSeeMoreShowing(newValue: boolean) {
    if (!newValue) {
      this.idDimensionSelected = '';
    }
  }

  private get boundary(): string {
    switch (this.displayType) {
      case DisplayTypes.Context:
        return 'viewport';
      default:
        return '';
    }
  }

  private get containerId(): string {
    switch (this.displayType) {
      case DisplayTypes.Popover:
        return `context-${this.idDimensionSelected}`;
      case DisplayTypes.Context:
        return '';
      default:
        return '';
    }
  }

  async mounted() {
    this.currentQuery = cloneDeep(await QuerySettingModule.buildQuerySetting(this.widgetId));
    this.loadHeaderAndTitle();
    this.drilldownPaths = cloneDeep(DrilldownDataStoreModule.drilldownPaths(this.widgetId));
    if (this.defaultDrilldownValue) {
      this.selectValue(this.defaultDrilldownValue);
    } else {
      await this.handleLoadDrilldownValues();
    }
  }

  private genIdSeeMore(row: FieldDetailInfo): string {
    return `${this.prefix}_field_${row.field.dbName}_${row.field.tblName}_${row.field.fieldName}`;
  }

  private isGroupDate(group: GroupedField): boolean {
    return group.groupTitle === DataType.Date;
  }

  private tryLoadDrillValue() {
    this.loadHeaderAndTitle();
    this.handleLoadDrilldownValues();
  }

  private async handleLoadDrilldownValues(): Promise<void> {
    // TODO: fill params in here
    this.currentStatus = Status.Loading;
    const newData: AbstractTableResponse | void = await DrilldownDataStoreModule.loadDrilldownValues({
      query: this.currentQuery,
      filterRequests: FilterModule.getAllFilters(this.widgetId),
      compareRequest: void 0
    })
      .then(data => {
        this.currentStatus = Status.Loaded;
        return data;
      })
      .catch(this.handleError);
    this.data = newData as AbstractTableResponse;
  }

  private handleError(ex: any): void {
    const exception: DIException = DIException.fromObject(ex);
    Log.debug('DrilldownSettingPopover::handleError', exception.message);
    this.errorMessage = 'Load drilldown error, try again';
    this.currentStatus = Status.Error;
  }

  private selectValue(value: string): void {
    this.valueSelected = value;
    this.title = 'Select a dimension to drilldown';
    this.handleLoadFieldSupported();
  }

  private handleLoadFieldSupported(): void {
    this.currentStatus = Status.Loading;
    DrilldownDataStoreModule.loadGroupedFieldsWillDrilldown(this.currentQuery)
      .then(groupFields => {
        this.groupedFields = groupFields;
        this.currentStatus = Status.Loaded;
      })
      .catch(this.handleError);
  }

  private loadHeaderAndTitle() {
    this.header = this.getHeaderFromQuery(this.currentQuery);
    this.title = `Select a ${this.header} to drilldown`;
  }

  private getHeaderFromQuery(query: QuerySetting) {
    if (Drilldownable.isDrilldownable(query)) {
      return query.getColumnWillDrilldown().name;
    } else {
      throw new DIException('Unsupported drilldown');
    }
  }

  private selectedField(field: FieldDetailInfo) {
    const toFieldRelatedFn = new Group(field.field);
    this.drilldown(field, toFieldRelatedFn);
    this.hideSetting();
  }

  private selectedDateField(field: FieldDetailInfo) {
    const toFieldRelatedFn: FieldRelatedFunction | undefined = this.buildFieldRelatedFunction(DateFunctionTypes.year, field);
    if (toFieldRelatedFn) {
      this.drilldown(field, toFieldRelatedFn);
      this.hideSetting();
    }
  }

  private handleClickSeeMore(field: FieldDetailInfo) {
    this.fieldSelected = field;
    this.idDimensionSelected = '';
    this.$nextTick(() => {
      this.idDimensionSelected = this.genIdSeeMore(field);
      const el: HTMLElement | null = document.getElementById(this.idDimensionSelected);
      if (el) {
        el.focus();
      }
    });
  }

  private handleSelectFunction(node: LabelNode): void {
    this.hideSetting();
    if (this.fieldSelected) {
      const toFieldRelatedFn: FieldRelatedFunction | undefined = this.buildFieldRelatedFunction(node.label, this.fieldSelected);
      if (toFieldRelatedFn) {
        this.drilldown(this.fieldSelected!, toFieldRelatedFn);
      } else {
        PopupUtils.showError("Can't drilldown with your option");
      }
    }
  }

  private drilldown(fieldDetailInfo: FieldDetailInfo, toFieldRelatedFn: FieldRelatedFunction): void {
    if (Drilldownable.isDrilldownable(this.currentQuery)) {
      if (this.isPathChanged) {
        DrilldownDataStoreModule.updatePaths({ id: this.widgetId, paths: this.drilldownPaths });
        DrilldownDataStoreModule.sliceQueries({ id: this.widgetId, from: 0, to: this.currentPathIndex });
      }
      const drilldownName = fieldDetailInfo.displayName ?? '';
      ///Using for Map Query
      const geoArea: GeoArea | undefined = MapQuerySetting.isMapQuery(this.currentQuery) ? GeolocationModule.getGeoArea(this.extraData?.code ?? '') : void 0;
      const drilldownData: DrilldownData = { value: this.valueSelected, toField: toFieldRelatedFn, name: drilldownName, geoArea: geoArea };
      const newQuery: QuerySetting = this.currentQuery.buildQueryDrilldown(drilldownData);

      DrilldownDataStoreModule.saveDrilldownData({
        id: this.widgetId,
        newPath: drilldownData,
        query: newQuery
      });
      ZoomModule.registerZoomDataById({ id: this.widgetId, query: newQuery });
      QuerySettingModule.setQuerySetting({ id: this.widgetId, query: newQuery });
      DashboardControllerModule.renderChartOrFilter({ widget: this.metaData });
    }
  }

  private buildFieldRelatedFunction(label: string, fieldDetailInfo: FieldDetailInfo): FieldRelatedFunction | undefined {
    const field: Field = fieldDetailInfo.field;
    if (label === FunctionFamilyTypes.groupBy) {
      return new Group(field);
    } else {
      return new DateHistogramFunctionBuilder().buildFunction({
        id: 1,
        field: field,
        name: fieldDetailInfo.name ?? '',
        functionFamily: FunctionFamilyTypes.dateHistogram,
        functionType: label,
        isShowNElements: false,
        numElemsShown: 10,
        isNested: fieldDetailInfo.isNested ?? false,
        sorting: SortTypes.Unsorted
      });
    }
  }

  public rollbackQueryTo(index: number): void {
    this.currentPathIndex = index;
    this.isSeeMoreShowing = false;
    this.isPathChanged = true;
    this.drilldownPaths = this.drilldownPaths.slice(0, index);

    // TODO: FEATURE  index == 0, sẽ bị reset zoom
    const querySetting: QuerySetting | undefined = index > 0 ? DrilldownDataStoreModule.getQuerySetting(this.widgetId, index - 1) : this.metaData.setting;

    if (querySetting) {
      this.currentQuery = cloneDeep(querySetting);
      this.loadHeaderAndTitle();
      this.handleLoadDrilldownValues();
      this.valueSelected = '';
    }
  }

  private handleResetDrilldown(): void {
    const rootQuery: QuerySetting | undefined = this.metaData.setting;
    DrilldownDataStoreModule.resetDrilldown(this.widgetId);
    ZoomModule.registerZoomDataById({ id: this.widgetId, query: rootQuery });
    QuerySettingModule.setQuerySetting({ id: this.widgetId, query: rootQuery });
    DashboardControllerModule.renderChartOrFilter({ widget: this.metaData });
    this.hideSetting();
  }

  @Emit('hide')
  private hideSetting() {
    this.isSeeMoreShowing = false;
    // TODO: function will emit event hide;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.body-value-listing {
  max-height: 300px;
  overflow-x: scroll;
}

.popover-panel {
  background-color: var(--menu-background-color);
  border: var(--menu-border);
  box-shadow: var(--menu-shadow);
  border-radius: 4px;
  padding: 16px;

  .header {
    @include semi-bold-14();
    display: inline-block;
    letter-spacing: 0.2px;
    max-width: 270px;
  }

  .divider {
    border: solid 1px rgba(255, 255, 255, 0.1);
    margin: 16px 0 11px 0;
  }

  .custom-body {
    max-width: 100%;
    //overflow-x: hidden;

    .body-value-listing .data-listing {
      overflow-x: hidden;
      width: 100%;
    }
  }
}

.title {
  @include regular-text-14();
  margin-bottom: 5px;
}

h4 {
  @include semi-bold-14();
}

.custom-display-option {
  .custom-more-icon {
    box-sizing: border-box;
    height: 37px;
    padding: 0;
    width: 37px;

    > img {
      height: 37px;
      width: 37px;
    }
  }

  .btn-row {
    cursor: pointer !important;
    padding: 6px 12px;

    > h4 {
      @include regular-text();
      color: var(--secondary-text-color);
      cursor: unset;
    }

    &:hover {
      h4 {
        color: var(--text-color);
      }
    }
  }
}

.function-selection {
  height: 615px;
  max-height: 615px;

  @media screen and (max-height: 680px) {
    height: 500;
    max-height: 500px;
  }

  @media screen and (max-height: 580px) {
    height: 400;
    max-height: 400px;
  }

  .btn-row {
    cursor: pointer !important;
    padding: 6px 12px;

    > h4 {
      @include regular-text();
      color: var(--secondary-text-color);
      cursor: unset;
    }

    &:hover {
      h4 {
        color: var(--text-color);
      }
    }
  }
}
</style>

<style lang="scss">
.drilldown-scala-function {
  border: var(--menu-border);
  box-shadow: var(--menu-shadow);

  .popover-body {
    min-width: 200px;

    .custom-popover {
      border: none;
      box-shadow: none;

      padding: 8px 0;

      h4 {
        margin: 0;
        padding: 4px;
      }
    }
  }
}
</style>
