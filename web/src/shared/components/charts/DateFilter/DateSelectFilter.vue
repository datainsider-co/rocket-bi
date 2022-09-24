<!--<template>-->
<!--  <div class="filter-date-select-container">-->
<!--    <div class="d-flex flex-row mb-3">-->
<!--      <DropdownSetting-->
<!--        :id="`${id}-condition-dropdown`"-->
<!--        :class="`mr-2 dropdown ${condition}`"-->
<!--        :options="conditionOptions"-->
<!--        :value="condition"-->
<!--        @onChanged="selectCondition"-->
<!--      />-->
<!--      <template>-->
<!--        <template v-if="isCurrentCondition">-->
<!--          <DropdownSetting :id="`${id}-date-dropdown`" :options="currentDateOptions" :value="dateType" class="w-60" @onChanged="handleDateSelected" />-->
<!--        </template>-->
<!--        <template v-else-if="isEarlierDateCondition || isLaterDateCondition">-->
<!--          <DiDatePicker-->
<!--            v-if="isPreview"-->
<!--            :date.sync="selectedDate"-->
<!--            :isShowIconDate="false"-->
<!--            :max-date="maxDate"-->
<!--            :min-date="minDate"-->
<!--            class="calender-picker"-->
<!--            placement="bottom"-->
<!--          />-->
<!--          <DiButton-->
<!--            v-else-->
<!--            :id="`calender-picker-${id}`"-->
<!--            :title="selectedDateAsString"-->
<!--            class="calender-picker"-->
<!--            @click="handleClickDatePicker(`calender-picker-${id}`, ...arguments)"-->
<!--          />-->
<!--        </template>-->
<!--        <template v-else-if="isBetweenCondition">-->
<!--          <template>-->
<!--            <DiCalendar-->
<!--              v-if="isPreview"-->
<!--              class="calender-picker"-->
<!--              :isHiddenCompareToSection="true"-->
<!--              :container="parentElement"-->
<!--              :isShowIconDate="false"-->
<!--              :isShowResetFilterButton="false"-->
<!--              :mainDateFilterMode="MainDateMode.custom"-->
<!--              :defaultDateRange="dateRange"-->
<!--              :mode-options="MainDateModeOptions"-->
<!--              :get-date-range-by-mode="getDateRangeByMode"-->
<!--              applyTextButton="Ok"-->
<!--              placement="bottomLeft"-->
<!--              @onCalendarSelected="handleCalendarSelected"-->
<!--            >-->
<!--            </DiCalendar>-->
<!--            &lt;!&ndash;            <DiButton :id="`calender-picker-${id}`" v-else :title="betweenDateRangeAsString" class="calender-picker"></DiButton>&ndash;&gt;-->
<!--          </template>-->
<!--        </template>-->
<!--        <template v-else-if="isLastCondition">-->
<!--          <InputSetting :id="`${id}-date-input`" :value="`${selectedDateValue}`" class="mr-2 date-value-input" type="number" @onChanged="handleDateChanged" />-->
<!--          <DropdownSetting-->
<!--            :id="`${id}-date-dropdown`"-->
<!--            :options="currentDateOptions"-->
<!--            :value="dateType"-->
<!--            class="last-date-dropdown"-->
<!--            @onChanged="handleDateSelected"-->
<!--          />-->
<!--        </template>-->
<!--      </template>-->
<!--    </div>-->
<!--    <div>-->
<!--      <div class="d-flex flex-row align-items-center">-->
<!--        <i class="di-icon-calendar mr-2"></i>-->
<!--        <div class="date-time-range">{{ timeRangeAsString }}</div>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import { Component, Prop, Vue, Watch } from 'vue-property-decorator';-->
<!--import { DateConditionTypes, DateHistogramConditionTypes, DateRange, DateTimeConstants, DateTypes, SelectOption } from '@/shared';-->
<!--import { DI } from '@core/modules';-->
<!--import { DateHistogramConditionCreator } from '@chart/DateFilter/DateHistogramConditonBuilder/DateHistogramConditionBuilder';-->
<!--import DiDatePicker from '@/shared/components/DiDatePicker.vue';-->
<!--import moment from 'moment';-->
<!--import { toNumber } from 'lodash';-->
<!--import { DateTimeFormatter, DateUtils } from '@/utils';-->
<!--import { Log } from '@core/utils';-->
<!--import DiButton from '@/shared/components/Common/DiButton.vue';-->
<!--import { MouseEventData } from '../BaseChart';-->
<!--import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';-->
<!--import { MainDateMode } from '@core/domain';-->
<!--import DiCalendar from '@filter/MainDateFilterV2/DiCalendar.vue';-->
<!--import { CalendarData } from '@/shared/models';-->

<!--@Component({ components: { DiDatePicker, DiButton, DiCalendar } })-->
<!--export default class DateSelectFilter extends Vue {-->
<!--  private readonly MainDateMode = MainDateMode;-->
<!--  private readonly MainDateModeOptions = DateTimeConstants.ListDateRangeModeOptions;-->
<!--  @Prop({ required: false, type: String })-->
<!--  readonly id?: string;-->

<!--  @Prop({ required: false, type: Boolean, default: false })-->
<!--  readonly isPreview!: boolean;-->

<!--  @Prop({ required: true, type: String })-->
<!--  readonly dateConditionType!: DateHistogramConditionTypes;-->

<!--  ///value is number if dateType, value is array is range between-->
<!--  @Prop({ required: false })-->
<!--  readonly value?: Date | number | string | DateRange;-->
<!--  @Prop({ required: false })-->
<!--  readonly maxDate?: Date;-->
<!--  @Prop({ required: false })-->
<!--  readonly minDate?: Date;-->

<!--  private condition: DateConditionTypes = DateConditionTypes.allTime;-->

<!--  private dateType?: DateTypes = DateTypes.day;-->
<!--  // 1/10/2021-->
<!--  private selectedDate?: Date = this.maxDate ?? moment().toDate();-->

<!--  // Last 21 days => selectedDateValue = 21-->
<!--  private selectedDateValue?: number = 0;-->

<!--  private dateRange?: DateRange = this.minDate && this.maxDate ? { start: this.minDate, end: this.maxDate } : void 0;-->

<!--  private readonly dateConditionCreator = DI.get<DateHistogramConditionCreator>(DateHistogramConditionCreator);-->

<!--  private readonly conditionOptions: SelectOption[] = [-->
<!--    {-->
<!--      id: DateConditionTypes.allTime,-->
<!--      displayName: 'All time'-->
<!--    },-->
<!--    {-->
<!--      id: DateConditionTypes.current,-->
<!--      displayName: 'Current'-->
<!--    },-->
<!--    {-->
<!--      id: DateConditionTypes.earlierThan,-->
<!--      displayName: 'Earlier than'-->
<!--    },-->
<!--    {-->
<!--      id: DateConditionTypes.last,-->
<!--      displayName: 'Last'-->
<!--    },-->
<!--    {-->
<!--      id: DateConditionTypes.laterThan,-->
<!--      displayName: 'Later than'-->
<!--    }-->
<!--    // {-->
<!--    //   id: DateConditionTypes.between,-->
<!--    //   displayName: 'Between'-->
<!--    // },-->
<!--    // {-->
<!--    //   id: DateConditionTypes.betweenAndInclude,-->
<!--    //   displayName: 'Between And Including'-->
<!--    // }-->
<!--  ];-->

<!--  private get currentDateOptions(): SelectOption[] {-->
<!--    const allDateHistogramOfCurrent: Set<DateHistogramConditionTypes> = this.dateConditionCreator.preferenceOfCondition(this.condition);-->
<!--    return Array.from(allDateHistogramOfCurrent)-->
<!--      .map(dateHistogram => {-->
<!--        const conditionWithDate: [DateConditionTypes, DateTypes | undefined] | undefined = this.dateConditionCreator.separator(dateHistogram);-->
<!--        const date: DateTypes | undefined = conditionWithDate ? conditionWithDate[1] : void 0;-->
<!--        return {-->
<!--          id: date ?? 'unknown',-->
<!--          displayName: date ?? 'unknown'-->
<!--        };-->
<!--      })-->
<!--      .filter(option => option.id !== 'unknown');-->
<!--  }-->

<!--  private get isCurrentCondition() {-->
<!--    return this.condition === DateConditionTypes.current;-->
<!--  }-->

<!--  private get isEarlierDateCondition(): boolean {-->
<!--    return this.condition == DateConditionTypes.earlierThan;-->
<!--  }-->

<!--  private get isLaterDateCondition(): boolean {-->
<!--    return this.condition == DateConditionTypes.laterThan;-->
<!--  }-->

<!--  private get isLastCondition(): boolean {-->
<!--    return this.condition == DateConditionTypes.last;-->
<!--  }-->

<!--  private get isBetweenCondition(): boolean {-->
<!--    return this.condition === DateConditionTypes.between || this.condition === DateConditionTypes.betweenAndInclude;-->
<!--  }-->

<!--  private get selectedValue(): string | DateRange | undefined {-->
<!--    switch (this.condition) {-->
<!--      case DateConditionTypes.earlierThan:-->
<!--      case DateConditionTypes.laterThan:-->
<!--        return this.selectedDate ? DateTimeFormatter.formatDate(this.selectedDate) : void 0;-->
<!--      case DateConditionTypes.last:-->
<!--        return `${this.selectedDateValue}`;-->
<!--      case DateConditionTypes.current:-->
<!--        return void 0;-->
<!--      case DateConditionTypes.betweenAndInclude:-->
<!--      case DateConditionTypes.between:-->
<!--        return this.dateRange;-->
<!--      default:-->
<!--        return undefined;-->
<!--    }-->
<!--  }-->

<!--  private get lastDateRange(): string {-->
<!--    let dateAsString = '';-->
<!--    if (this.dateType && this.selectedDateValue) {-->
<!--      const lastDateRange = DateUtils.getLastNDate(this.dateType, this.selectedDateValue);-->
<!--      dateAsString = DateTimeFormatter.formatDateRange(lastDateRange, this.dateType);-->
<!--    }-->
<!--    return dateAsString;-->
<!--  }-->

<!--  private get allTimeDateRange(): string {-->
<!--    let dateAsString = '';-->
<!--    if (this.minDate && this.maxDate) {-->
<!--      dateAsString = DateTimeFormatter.formatDateRange({-->
<!--        start: this.minDate,-->
<!--        end: this.maxDate-->
<!--      });-->
<!--    }-->
<!--    return dateAsString;-->
<!--  }-->

<!--  private get earlierDateRange(): string {-->
<!--    let dateAsString = '';-->
<!--    if (this.selectedDate) {-->
<!--      const minDate = this.minDate ?? DateUtils.DefaultMinDate;-->
<!--      const selectedDate = this.selectedDate ?? Date();-->
<!--      dateAsString = DateTimeFormatter.formatDateRange({ start: minDate, end: selectedDate }, this.dateType);-->
<!--    }-->
<!--    return dateAsString;-->
<!--  }-->

<!--  private get betweenDateRangeAsString(): string {-->
<!--    return DateTimeFormatter.formatDateRange(this.dateRange);-->
<!--  }-->

<!--  private get laterDateRange(): string {-->
<!--    let dateAsString = '';-->
<!--    if (this.selectedDate) {-->
<!--      const selectedDate = this.selectedDate ?? Date();-->
<!--      const maxDate = this.maxDate ?? DateUtils.DefaultMaxDate;-->
<!--      dateAsString = DateTimeFormatter.formatDateRange({ start: selectedDate, end: maxDate }, this.dateType);-->
<!--    }-->
<!--    return dateAsString;-->
<!--  }-->

<!--  private get currentDateRange(): string {-->
<!--    let dateAsString = '';-->
<!--    if (this.dateType) {-->
<!--      const currentRange = DateUtils.getCurrentDate(this.dateType);-->
<!--      dateAsString = DateTimeFormatter.formatDateRange(currentRange, this.dateType);-->
<!--    }-->
<!--    return dateAsString;-->
<!--  }-->

<!--  private get selectedDateAsString() {-->
<!--    return DateTimeFormatter.formatAsDDMMYYYY(this.selectedDate as any);-->
<!--  }-->

<!--  created() {-->
<!--    // super();-->
<!--    const conditionWithDate: [DateConditionTypes, DateTypes | undefined] | undefined = this.dateConditionCreator.separator(this.dateConditionType);-->
<!--    if (conditionWithDate) {-->
<!--      this.condition = conditionWithDate[0];-->
<!--      this.dateType = conditionWithDate[1];-->
<!--    }-->
<!--    this.initSelected(this.condition);-->
<!--    this.assignValue(this.value);-->
<!--    this.$forceUpdate();-->
<!--  }-->

<!--  @Watch('dateConditionType')-->
<!--  handleDateConditionChange(newDateCondition: DateHistogramConditionTypes) {-->
<!--    const conditionWithDate: [DateConditionTypes, DateTypes | undefined] | undefined = this.dateConditionCreator.separator(this.dateConditionType);-->
<!--    if (conditionWithDate) {-->
<!--      this.condition = conditionWithDate[0];-->
<!--      this.dateType = conditionWithDate[1];-->
<!--    }-->
<!--    this.initSelected(this.condition);-->
<!--  }-->

<!--  @Watch('value')-->
<!--  handleValueChanged(newValue: any) {-->
<!--    this.assignValue(this.value);-->
<!--  }-->

<!--  private selectCondition(newCondition: DateConditionTypes) {-->
<!--    this.updateNewValue(this.condition, newCondition);-->
<!--    this.condition = newCondition;-->
<!--    this.emitValue();-->
<!--    this.$forceUpdate();-->
<!--  }-->

<!--  private handleDateSelected(newDate: DateTypes) {-->
<!--    this.dateType = newDate;-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private handleDateChanged(newValue: string) {-->
<!--    const valueAsNumber = toNumber(newValue);-->
<!--    this.selectedDateValue = valueAsNumber > 0 ? valueAsNumber : 0;-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private handleCalenderPicked(newDate: Date) {-->
<!--    this.selectedDate = newDate;-->
<!--    Log.debug('handleCalenderPicked::', this.condition, this.dateType);-->
<!--    this.emitValue();-->
<!--  }-->

<!--  private initSelected(condition: DateConditionTypes): void {-->
<!--    this.selectedDate = this.selectedDateValue = this.dateRange = void 0;-->
<!--    switch (condition) {-->
<!--      case DateConditionTypes.earlierThan:-->
<!--        this.selectedDate = this.maxDate ?? moment().toDate();-->
<!--        break;-->
<!--      case DateConditionTypes.laterThan:-->
<!--        this.selectedDate = this.minDate ?? moment().toDate();-->
<!--        break;-->
<!--      case DateConditionTypes.last:-->
<!--        this.selectedDateValue = 1;-->
<!--        break;-->
<!--      case DateConditionTypes.between:-->
<!--      case DateConditionTypes.betweenAndInclude:-->
<!--        this.dateRange = this.maxDate && this.minDate ? { start: this.minDate, end: this.maxDate } : void 0;-->
<!--        break;-->
<!--    }-->
<!--    Log.debug('initSelected', this.dateRange);-->
<!--  }-->

<!--  private initDate(condition: DateConditionTypes): void {-->
<!--    switch (condition) {-->
<!--      case DateConditionTypes.earlierThan:-->
<!--      case DateConditionTypes.laterThan:-->
<!--        this.dateType = void 0;-->
<!--        break;-->
<!--      case DateConditionTypes.last:-->
<!--      case DateConditionTypes.current:-->
<!--        this.dateType = DateTypes.day;-->
<!--        break;-->
<!--      case DateConditionTypes.between:-->
<!--      case DateConditionTypes.betweenAndInclude:-->
<!--        this.dateType = void 0;-->
<!--        break;-->
<!--    }-->
<!--  }-->

<!--  /*-->
<!--  Nếu condition cũ là earlierThan, mới là laterThan (ngược lại) thì giữ nguyên. <br>-->
<!--  Các trường hợp còn lại thì init lại-->
<!--  */-->
<!--  private updateNewValue(condition: DateConditionTypes, newCondition: DateConditionTypes) {-->
<!--    const newConditionIsEarlierThan = newCondition === DateConditionTypes.earlierThan || newCondition === DateConditionTypes.laterThan;-->
<!--    const oldConditionIsLaterThan = condition === DateConditionTypes.earlierThan || condition === DateConditionTypes.laterThan;-->
<!--    if (newConditionIsEarlierThan && oldConditionIsLaterThan) {-->
<!--      return;-->
<!--    } else {-->
<!--      this.initSelected(newCondition);-->
<!--      this.initDate(newCondition);-->
<!--    }-->
<!--  }-->

<!--  private assignValue(value: Date | number | string | DateRange | undefined) {-->
<!--    if (value) {-->
<!--      switch (this.condition) {-->
<!--        case DateConditionTypes.earlierThan:-->
<!--        case DateConditionTypes.laterThan:-->
<!--          this.selectedDate = moment(value as string).toDate();-->
<!--          break;-->
<!--        case DateConditionTypes.last:-->
<!--          this.selectedDateValue = value as number;-->
<!--          break;-->
<!--        case DateConditionTypes.current:-->
<!--          break;-->
<!--        case DateConditionTypes.betweenAndInclude:-->
<!--        case DateConditionTypes.between:-->
<!--          this.dateRange = value as DateRange;-->
<!--          break;-->
<!--      }-->
<!--    }-->
<!--  }-->

<!--  private emitValue() {-->
<!--    const isClearFilter = this.condition == DateConditionTypes.allTime;-->
<!--    if (isClearFilter) {-->
<!--      this.$emit('change', void 0);-->
<!--    } else {-->
<!--      const newDateCondition = this.dateConditionCreator-->
<!--        .withDateCondition(this.condition)-->
<!--        .withDate(this.dateType)-->
<!--        .create();-->
<!--      this.$emit('change', { type: newDateCondition, value: this.selectedValue });-->
<!--    }-->
<!--  }-->

<!--  private handleClickDatePicker(target: string, event: MouseEvent) {-->
<!--    const mouseEventData = new MouseEventData(event, this.selectedDate, { target: target });-->
<!--    this.$root.$emit(DashboardEvents.ShowCalendar, mouseEventData, this.handleCalenderPicked, {-->
<!--      minDate: this.minDate,-->
<!--      maxDate: this.maxDate-->
<!--    });-->
<!--  }-->

<!--  private get timeRangeAsString(): string {-->
<!--    if (this.isCurrentCondition) {-->
<!--      return this.currentDateRange;-->
<!--    }-->
<!--    if (this.isLaterDateCondition) {-->
<!--      return this.laterDateRange;-->
<!--    }-->
<!--    if (this.isLastCondition) {-->
<!--      return this.lastDateRange;-->
<!--    }-->
<!--    if (this.isEarlierDateCondition) {-->
<!--      return this.earlierDateRange;-->
<!--    }-->
<!--    if (this.isBetweenCondition) {-->
<!--      return this.betweenDateRangeAsString;-->
<!--    }-->
<!--    return this.allTimeDateRange;-->
<!--  }-->

<!--  private parentElement(): Element {-->
<!--    return this.$el;-->
<!--  }-->

<!--  private getDateRangeByMode(mode: MainDateMode): DateRange | null {-->
<!--    return DateUtils.getDateRange(mode);-->
<!--  }-->

<!--  private handleCalendarSelected(calendarData: CalendarData) {-->
<!--    if (!this.isBetweenCondition) {-->
<!--      this.condition = DateConditionTypes.between;-->
<!--    }-->
<!--    this.dateRange = calendarData.chosenDateRange ?? void 0;-->
<!--    this.emitValue();-->
<!--  }-->
<!--}-->
<!--</script>-->
<!--<style lang="scss">-->
<!--.filter-date-select-container {-->
<!--  color: var(&#45;&#45;secondary-text-color);-->

<!--  .dropdown {-->
<!--    width: 40%;-->

<!--    &.all_time {-->
<!--      width: 100%;-->
<!--    }-->
<!--  }-->

<!--  .dropdown-setting {-->
<!--    background: var(&#45;&#45;tab-filter-dropdown-background);-->

<!--    .relative > span > button {-->
<!--      background: unset;-->
<!--    }-->
<!--  }-->

<!--  .date-value-input {-->
<!--    width: 15%;-->

<!--    .form-control {-->
<!--      height: 33px;-->
<!--      background: unset !important;-->
<!--      //var(&#45;&#45;tab-filter-dropdown-bacground) !important;-->
<!--    }-->
<!--  }-->

<!--  .last-date-dropdown {-->
<!--    width: calc(45% - 8px);-->
<!--  }-->

<!--  .date-picker {-->
<!--    input {-->
<!--      height: 33px;-->
<!--    }-->
<!--  }-->

<!--  .date-time-range {-->
<!--    line-height: 1;-->
<!--  }-->

<!--  .calender-picker {-->
<!--    width: calc(60% - 8px);-->
<!--    height: 33px;-->

<!--    .title {-->
<!--      width: 100%;-->
<!--      padding-left: 8px;-->
<!--    }-->

<!--    input {-->
<!--      height: 33px;-->
<!--      padding-left: 0;-->
<!--      background: transparent !important;-->
<!--    }-->

<!--    background-color: var(&#45;&#45;tab-filter-dropdown-background) !important;-->

<!--    &:hover {-->
<!--      //background-color: var(&#45;&#45;hover-color) !important;-->
<!--    }-->
<!--  }-->

<!--  .di-button .regular-text-14 {-->
<!--    text-align: start;-->
<!--  }-->
<!--}-->
<!--</style>-->
