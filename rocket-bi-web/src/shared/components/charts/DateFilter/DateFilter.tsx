// import { Component, Inject, Prop, Watch } from 'vue-property-decorator';
// import { BaseWidget } from '@/screens/DashboardDetail/components/WidgetContainer/BaseWidget';
// import {
//   ChartInfo,
//   Condition,
//   DateSelectFilterOption,
//   DIException,
//   FieldRelatedCondition,
//   FilterMode,
//   FilterRequest,
//   GroupedTableQuerySetting,
//   GroupTableResponse
// } from '@core/domain';
// import { WidgetRenderer } from '@chart/WidgetRenderer';
// import { DefaultDateFilter } from '@chart/DateFilter/DefaultDateFilter';
// import { ConditionData, DateHistogramConditionTypes, InputType, TableSettingColor } from '@/shared';
// import DateSelectFilter from '@chart/DateFilter/DateSelectFilter.vue';
// import { ConditionBuilder } from '@core/services';
// import { DI } from '@core/modules';
// import { ConditionUtils, Log } from '@core/utils';
// import { get, isArray } from 'lodash';
// import { _ConfigBuilderStore } from '@/screens/ChartBuilder/ConfigBuilder/ConfigBuilderStore';
// import moment from 'moment/moment';
// import { ChartUtils, DateTimeFormatter, DateUtils } from '@/utils';
// import { PopupUtils } from '@/utils/popup.utils';
//
// @Component({ components: { DateSelectFilter } })
// export default class DateFilter extends BaseWidget {
//   protected renderer: WidgetRenderer<BaseWidget> = new DefaultDateFilter();
//
//   @Prop({ default: -1 })
//   id!: string | number;
//
//   @Prop({ type: String, default: '' })
//   title!: string;
//
//   @Prop()
//   textColor?: string;
//
//   @Prop()
//   backgroundColor?: string;
//
//   @Prop({ type: Boolean, default: false })
//   isPreview!: boolean;
//
//   @Prop({ required: true, type: Object })
//   setting!: DateSelectFilterOption;
//
//   @Prop({ type: Boolean, default: false })
//   showEditComponent!: boolean;
//
//   @Prop({ required: true, type: Object })
//   data!: GroupTableResponse;
//
//   @Prop({ required: true, type: Object })
//   query!: GroupedTableQuerySetting;
//
//   @Prop({ type: Object, required: true })
//   chartInfo!: ChartInfo;
//   // Inject from ChartContainer.vue
//   @Inject({ default: undefined })
//   private addFilter?: (request: FilterRequest) => void;
//
//   // Inject from ChartContainer.vue
//   @Inject({ default: undefined })
//   private onRemoveFilter?: () => void;
//
//   currentValue: any = this.getDateSelected().currentValue;
//
//   histogramCondition: DateHistogramConditionTypes = this.getDateSelected().histogramCondition;
//
//   resize(): void {
//     //Todo: Add resize method
//   }
//
//   mounted() {
//     this.validQuerySetting(this.query);
//   }
//
//   @Watch('setting', { immediate: true, deep: true })
//   onChartSettingChanged() {
//     this.updateChartData();
//   }
//
//   get subTitle(): string {
//     return this.setting.options.subtitle?.text ?? '';
//   }
//
//   private updateChartData() {
//     Log.debug('updateChartData', this.id, this.getDateSelected());
//     this.currentValue = this.getDateSelected().currentValue;
//     this.histogramCondition = this.getDateSelected().histogramCondition;
//     this.renderer = new DefaultDateFilter();
//     this.$forceUpdate();
//   }
//
//   get containerClass(): any {
//     if (this.id == -2) {
//       if (this.backgroundColor) {
//         return `p-3 flex-column`;
//       } else {
//         return `tab-filter-container${TableSettingColor.secondaryBackgroundColor}`;
//       }
//     } else if (this.isPreview) {
//       if (this.backgroundColor) {
//         return `flex-column`;
//       } else {
//         return `tab-filter-container${TableSettingColor.secondaryBackgroundColor}`;
//       }
//     }
//     return `tab-filter-container flex-column p-3`;
//   }
//
//   get containerStyle() {
//     return {
//       '--background-color': this.backgroundColor
//     };
//   }
//
//   get subtitleClass(): any {
//     return 'd-flex row m-0 mb-1 w-100 single-line';
//   }
//
//   get subtitleStyle() {
//     return {
//       ...this.setting.options.subtitle?.style,
//       justifyContent: this.setting.options.subtitle?.align
//     };
//   }
//
//   get titleClass() {
//     return 'd-flex row filter-chart single-line px-3 mb-3 single-line';
//   }
//
//   get titleStyle() {
//     return {
//       ...this.setting.options.title?.style,
//       justifyContent: this.setting.options.title?.align
//     };
//   }
//
//   get filterClass(): string {
//     return this.showEditComponent ? `disable ml-1 mt-3` : `ml-1 mt-3`;
//   }
//
//   handleFilterChange(data: { type: DateHistogramConditionTypes; value: any } | undefined) {
//     this.saveFilterDate(data);
//     if (data) {
//       const filterRequest: FilterRequest | undefined = this.buildFilterRequest(data);
//       //In dashboard
//       if (this.addFilter && filterRequest && !this.isPreview) {
//         this.addFilter(filterRequest);
//       } else if (filterRequest && this.isPreview) {
//         this.saveTempSelectedValue(filterRequest.condition);
//       }
//     } else {
//       //In dashboard
//       if (this.onRemoveFilter && !this.isPreview) {
//         this.onRemoveFilter();
//       } else if (this.isPreview) {
//         this.saveTempSelectedValue(void 0);
//       }
//     }
//   }
//
//   private saveTempSelectedValue(condition: Condition | undefined) {
//     _ConfigBuilderStore.setTempFilterValue({
//       value: {
//         currentValue: this.currentValue,
//         histogramCondition: this.histogramCondition
//       },
//       conditions: condition
//     });
//   }
//
//   private buildFilterRequest(data: { type: DateHistogramConditionTypes; value: any }) {
//     const { type, value } = data;
//     const familyType = ConditionUtils.getFamilyTypeFromFieldType(this.query.getFilter().function.field.fieldType);
//     if (familyType) {
//       const isArrayValue = isArray(value);
//       const conditionData: ConditionData = {
//         field: this.query.getFilter().function.field,
//         familyType: familyType,
//         subType: type,
//         isNested: false,
//         id: +this.id,
//         groupId: -1,
//         firstValue: this.getFirstValue(value),
//         secondValue: this.getSecondValue(value),
//         allValues: isArrayValue ? value : [],
//         currentInputType: InputType.date,
//         currentOptionSelected: type,
//         filterModeSelected: FilterMode.selection
//       };
//       const conditionBuilder: ConditionBuilder = DI.get(ConditionBuilder);
//       const condition: Condition | undefined = conditionBuilder.buildCondition(conditionData);
//       Log.debug('DateFilter:: buildFilterRequest:', '\n Filter data::', data, ' \n Condition built', condition);
//       return condition ? new FilterRequest(+this.id, condition) : void 0;
//     }
//     return void 0;
//   }
//
//   private getFirstValue(value: any) {
//     const isArrayValue = isArray(value);
//     if (isArrayValue) {
//       return get(value, '[0]', void 0);
//     }
//     const isDateRange = value?.start && value?.end;
//     if (isDateRange) {
//       return DateTimeFormatter.formatDateWithTime(moment(value.start).toDate(), '');
//     }
//     return value;
//   }
//
//   private getSecondValue(value: any) {
//     const isArrayValue = isArray(value);
//     if (isArrayValue) {
//       return get(value, '[1]', void 0);
//     }
//     const isDateRange = value?.start && value?.end;
//     if (isDateRange) {
//       return DateTimeFormatter.formatDateWithTime(moment(value.end).toDate(), '');
//     }
//     return value;
//   }
//
//   private saveFilterDate(data: { type: DateHistogramConditionTypes; value: any } | undefined) {
//     this.currentValue = data?.value;
//     this.histogramCondition = data?.type ?? DateHistogramConditionTypes.allTime;
//   }
//
//   getDateSelected() {
//     const isUsingDefault = this.setting.options.default?.setting?.value != null;
//     Log.debug('getDateSelected', isUsingDefault);
//     return isUsingDefault
//       ? this.setting.options.default?.setting?.value
//       : {
//           currentValue: void 0,
//           histogramCondition: DateHistogramConditionTypes.allTime
//         };
//   }
//
//   get idAsString() {
//     if (!this.isPreview || this.id == -2) {
//       return `${this.id}-date-filter`;
//     }
//     return 'preview-date-filter';
//   }
//
//   get max(): Date | undefined {
//     const key = this.data.headers[1].key ?? '';
//     if (key) {
//       const record: Record<string, any> = this.data.records[0];
//       return moment(record[key]).toDate();
//     }
//     return DateUtils.DefaultMaxDate;
//   }
//
//   get min(): Date | undefined {
//     const key = this.data.headers[0].key ?? '';
//     if (key) {
//       const record: Record<string, any> = this.data.records[0];
//       return moment(record[key]).toDate();
//     }
//     return DateUtils.DefaultMinDate;
//   }
//
//   private validQuerySetting(query: GroupedTableQuerySetting) {
//     const fieldType: string = get(query, 'columns[0].function.field.fieldType', '');
//     if (ChartUtils.isDateType(fieldType)) {
//       return;
//     } else {
//       throw new DIException('Date Filter only support config with Date Field!');
//     }
//   }
//
//   downloadCSV(): void {
//     PopupUtils.showError('Unsupported Download CSV');
//   }
// }
