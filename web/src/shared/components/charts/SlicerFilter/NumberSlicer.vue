<template>
  <div class="d-flex flex-column number-slicer-container">
    <div class="d-flex flex-row mb-3">
      <template v-if="isDate">
        <div class="mr-2 w-50">
          <DiDatePicker
            v-if="isPreview"
            :date.sync="fromValueAsDate"
            :isShowIconDate="false"
            :max-date="maxAsDate"
            :min-date="minAsDate"
            class="calender-picker"
            placement="bottom"
          ></DiDatePicker>
          <DiButton
            v-else
            :id="`calender-picker-from`"
            :title="fromDateAsString"
            class="calender-picker btn-picker"
            @click="handleClickCalender(`calender-picker-from`, fromValueAsDate, handleFromDateChanged, ...arguments)"
          />
        </div>
        <div class="w-50">
          <DiDatePicker
            v-if="isPreview"
            :date.sync="toValueAsDate"
            :isShowIconDate="false"
            :max-date="maxAsDate"
            :min-date="minAsDate"
            class="w-50"
            placement="bottom"
          ></DiDatePicker>
          <DiButton
            v-else
            :id="`calender-picker-to`"
            :title="toDateAsString"
            class="calender-picker btn-picker"
            @click="handleClickCalender(`calender-picker-to`, toValueAsDate, handleToDateChanged, ...arguments)"
          />
        </div>
      </template>
      <template v-else>
        <InputSetting
          id="min-input"
          :applyFormatNumber="useFormat"
          :value="`${fromValue}`"
          class="mr-2 w-50"
          type="number"
          @onChanged="handleMinInputChanged"
        />
        <InputSetting id="max-input" :applyFormatNumber="useFormat" :value="`${toValue}`" class="w-50" type="number" @onChanged="handleMaxInputChanged" />
      </template>
    </div>
    <div class="d-flex flex-row">
      <RangeSlider
        :class="sliderClass"
        :from="fromValue"
        :max="max"
        :min="min"
        :step="step"
        :to="toValue"
        type="number"
        @change="handleChangeCompleted"
        @update:from="updateMinValue"
        @update:to="updateMaxValue"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import RangeSlider from '@/shared/components/Common/DiSlider/RangeSlider/RangeSlider.vue';
import { toNumber } from 'lodash';
import { SlicerRange } from '@/shared';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { DateTimeFormatter } from '@/utils';
import { MouseEventData } from '@chart/BaseChart';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';
import { isDate } from 'moment';
import { Log } from '@core/utils';

export enum SlicerDisplay {
  number = 'number',
  date = 'date',
  dateAsNumber = 'dateAsNumber' //2018, 2019
}

@Component({ components: { RangeSlider, DiDatePicker } })
export default class NumberSlicer extends Vue {
  @Prop({ type: Object, required: true })
  readonly range!: SlicerRange;

  @Prop({ type: Number, required: true })
  readonly max!: number;

  @Prop({ type: Number, required: true })
  readonly min!: number;

  @Prop({ type: Number, default: 1 })
  readonly step!: number;

  @Prop({ type: Boolean, default: true })
  readonly useFormat!: boolean;

  @Prop({ type: Boolean, required: true })
  readonly isDate!: boolean;

  @Prop({ type: Boolean, required: false, default: false })
  readonly isPreview!: boolean;

  private toValue = this.range.to.value;

  private fromValue = this.range.from.value;

  private toEqual = this.range.to.equal;

  private fromEqual = this.range.from.equal;

  private get sliderClass(): string {
    const fromClass = this.fromEqual ? 'from-equal' : '';
    const toClass = this.toEqual ? 'to-equal' : '';
    return `range-slider ${fromClass} ${toClass}`;
  }

  private get maxAsDate(): Date {
    return new Date(this.max);
  }

  private get minAsDate(): Date {
    return new Date(this.min);
  }

  private get fromValueAsDate(): Date {
    return new Date(this.fromValue);
  }

  private set fromValueAsDate(value: Date) {
    this.updateMinValue(value);
    this.emitValue();
  }

  private get fromDateAsString(): string {
    return DateTimeFormatter.formatAsDDMMYYYY(this.fromValueAsDate);
  }

  private get toValueAsDate(): Date {
    return new Date(this.toValue);
  }

  private set toValueAsDate(value: Date) {
    this.updateMaxValue(value);
    this.emitValue();
  }

  private get toDateAsString(): string {
    return DateTimeFormatter.formatAsDDMMYYYY(this.toValueAsDate);
  }

  @Watch('range', { deep: true, immediate: true })
  handleRangeChanged() {
    Log.debug('handleRangeChanged', this.range);
    this.toValue = this.range.to.value;
    this.fromValue = this.range.from.value;
    this.toEqual = this.range.to.equal;
    this.fromEqual = this.range.from.equal;
    Log.debug('handleRangeChanged::set', this.toValue, this.fromValue);
    Log.debug('handleRangeChanged::set::date', this.toValueAsDate, this.fromValueAsDate);
  }

  private updateMinValue(value: string | Date) {
    const fromValueAsNumber: number = isDate(value) ? value.valueOf() : toNumber(value);
    if (fromValueAsNumber > this.toValue) {
      this.fromValue = this.toValue;
    } else {
      this.fromValue = fromValueAsNumber;
    }
  }

  private updateMaxValue(value: string | Date) {
    const toValueAsNumber: number = isDate(value) ? value.valueOf() : toNumber(value);
    if (toValueAsNumber < this.fromValue) {
      this.toValue = this.fromValue;
    } else {
      this.toValue = toValueAsNumber;
    }
  }

  private handleChangeCompleted(data: { from: number; to: number }) {
    const { from, to } = data;
    this.updateMinValue(`${from}`);
    this.updateMaxValue(`${to}`);
    this.emitValue();
  }

  private handleMinInputChanged(min: string | Date) {
    this.updateMinValue(min);
    this.emitValue();
  }

  private handleMaxInputChanged(max: string | Date) {
    this.updateMaxValue(max);
    this.emitValue();
  }

  private emitValue() {
    const newRange: SlicerRange = {
      from: {
        value: this.fromValue,
        equal: this.fromEqual
      },
      to: {
        value: this.toValue,
        equal: this.toEqual
      }
    };
    this.$emit('change', newRange);
  }

  private toggleFromEqual() {
    this.fromEqual = !this.fromEqual;
    this.emitValue();
  }

  private toggleToEqual() {
    this.toEqual = !this.toEqual;
    this.emitValue();
  }

  private handleClickCalender(target: string, date: Date, handleCalenderPicked: (newDate: Date) => void, event: MouseEvent) {
    const mouseEventData = new MouseEventData(event, date, { target: target });
    this.$root.$emit(DashboardEvents.ShowCalendar, mouseEventData, handleCalenderPicked, {
      minDate: this.minAsDate,
      maxDate: this.maxAsDate
    });
  }

  private handleToDateChanged(newDate: Date) {
    this.toValueAsDate = newDate;
  }

  private handleFromDateChanged(newDate: Date) {
    this.fromValueAsDate = newDate;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.number-slicer-container {
  .range-slider {
    margin-top: 2px;

    .from,
    .to {
      height: 16px !important;
      width: 16px !important;
    }

    &.from-equal {
      .from {
        border-radius: 4px !important;
      }
    }

    &.to-equal {
      .to {
        border-radius: 4px !important;
      }
    }
  }

  .calender-picker {
    .title {
      width: 100%;
    }
  }

  .btn-picker {
    input {
      height: 33px;
      padding-left: 0;
      background: transparent !important;
    }

    //background-color: var(--tab-filter-dropdown-background) !important;

    &:hover {
      //background-color: var(--hover-color) !important;
    }
  }

  .di-button .regular-text-14 {
    text-align: start;
  }
}
</style>
