<template>
  <!--  <BModal ref="modal">-->
  <div class="job-scheduler-form">
    <div class="job-scheduler-form-group">
      <label>Scheduler type</label>
      <DiDropdown
        id="job-scheduler-type"
        v-model="selectedJobSchedulerType"
        :appendAtRoot="true"
        :data="jobSchedulerDropdownData"
        label-props="label"
        value-props="value"
      ></DiDropdown>
    </div>
    <div v-if="isRunOnlyOnceMode" class="run-only-once d-flex col-12 p-0">
      <div class="job-scheduler-form-group m-0 col-6 pl-0">
        <label>Date</label>
        <DiDatePicker :date.sync="date" class="w-100" style="margin-right: 12px" />
      </div>
      <div class="job-scheduler-form-group d-flex flex-column m-0 col-6 p-0">
        <label>Time</label>
        <ATimePicker :open.sync="isTimePickerPopoverOpen" :value="selectedTime" class="time-picker w-100" @change="onChangeTime">
          <a-button slot="addon" class="w-100" size="small" type="primary" @click="hideTimePickerPopover">
            Ok
          </a-button>
        </ATimePicker>
      </div>
    </div>
    <div v-else>
      <div class="job-scheduler-form-group ">
        <div class="frequency-options frequency-setting">
          <label>Frequency</label>
          <b-form-group v-slot="{ ariaDescribedby }" class="frequency-radio-item">
            <b-form-radio-group
              v-model="selectedFrequencyType"
              :aria-describedby="ariaDescribedby"
              :options="frequencyOptions"
              name="plain-inline"
              plain
            ></b-form-radio-group>
          </b-form-group>
        </div>
      </div>
      <div class="job-scheduler-form-group recurs-times pt-2">
        <div class="frequency-options d-flex align-items-center">
          <label>{{ preLabel }}</label>
          <div class="d-flex align-items-center">
            <BFormInput v-model="interval" class="loop-time time-input" type="number"></BFormInput>
            <div class="text">{{ postLabel }}</div>
            <div v-if="isMonthly" class="d-flex align-items-center">
              <BFormInput v-model="monthInterval" class="time-input ml-2" type="text" />
              <label class="text m-0">months</label>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isWeekly" class="job-scheduler-form-group">
        <div class="frequency-options d-flex">
          <label class="align-items-start" style="height: 48.33px">On these days</label>
          <b-form-group v-slot="{ ariaDescribedby }" class="day-select d-flex align-items-center">
            <template>
              <b-form-checkbox-group
                v-if="isMultiChoiceDay"
                v-model="selectedDayOfWeek"
                :aria-describedby="ariaDescribedby"
                :options="daysOfWeekOptions"
                plain
              ></b-form-checkbox-group>
              <b-form-radio-group v-else v-model="selectedDayOfWeek" :aria-describedby="ariaDescribedby" :options="daysOfWeekOptions" plain>
              </b-form-radio-group>
            </template>
          </b-form-group>
        </div>
      </div>
      <div v-if="isShowTimePicker" class="job-scheduler-form-group">
        <div class="frequency-options">
          <label>At</label>
          <!--            <input type="time" mode="time"/>-->
          <ATimePicker :open.sync="isTimePickerPopoverOpen" :value="selectedTime" class="time-picker" @change="onChangeTime">
            <a-button slot="addon" class="w-100" size="small" type="primary" @click="hideTimePickerPopover">
              Ok
            </a-button>
          </ATimePicker>
        </div>
      </div>
    </div>
  </div>
  <!--  </BModal>-->
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import TabSelection from '@/shared/components/TabSelection.vue';
import { DaysOfWeek } from '@/shared/enums/DayOfWeeks';
import {
  DaysOfWeekOptions,
  FrequencyOptions,
  JobSchedulerDropdownData,
  OnlyRecurringDropdownData
} from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/scheduler.constant';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import moment, { Moment } from 'moment';
import { Log } from '@core/utils';
import { DateTimeFormatter } from '@/utils';
import { toNumber } from 'lodash';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import { SchedulerType } from '@/shared/enums/SchedulerType';
import { SchedulerMinutely } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMinutely';
import { SchedulerMonthly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMonthly';
import { SchedulerWeekly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerWeekly';
import { SchedulerHourly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerHourly';
import { SchedulerDaily } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerDaily';
import { SchedulerOnce } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerOnce';

@Component({
  components: { TabSelection, DiDropdown }
})
export default class SchedulerSettingV2 extends Vue {
  private selectedTime = moment(new Date());
  private monthInterval = 1;
  private interval = 1;
  private selectedDayOfWeek: DaysOfWeek[] = [];
  private isTimePickerPopoverOpen = false;
  private date = new Date();

  private daysOfWeekOptions = DaysOfWeekOptions;

  private selectedJobSchedulerType: SchedulerType = this.jobSchedulerDropdownData[0].value;

  private selectedFrequencyType: SchedulerName | null = null;

  @Prop({ required: true })
  private readonly schedulerTime!: TimeScheduler;

  @Prop({ type: Boolean })
  private readonly ignoreMinutely!: boolean;

  @Prop({ type: Boolean, default: true })
  private readonly isMultiChoiceDay!: boolean;

  @Prop({ type: Boolean, default: false })
  private readonly disableRunOneTime!: boolean;

  private get frequencyOptions() {
    if (this.ignoreMinutely) {
      return FrequencyOptions.filter(option => option.value !== SchedulerName.Minutely);
    }
    return FrequencyOptions;
  }

  private get isRunOnlyOnceMode() {
    return this.selectedJobSchedulerType === SchedulerType.RunOnlyOnce;
  }

  private get jobSchedulerDropdownData() {
    return this.disableRunOneTime ? OnlyRecurringDropdownData : JobSchedulerDropdownData;
  }

  private get preLabel() {
    switch (this.selectedFrequencyType) {
      case SchedulerName.Monthly:
        return 'Recurs on days';
      default:
        return 'Recurs every';
    }
  }

  private get postLabel() {
    switch (this.selectedFrequencyType) {
      case SchedulerName.Hourly:
        return 'hours';
      case SchedulerName.Daily:
        return 'days';
      case SchedulerName.Weekly:
        return 'weeks';
      case SchedulerName.Minutely:
        return 'minutes';
      default:
        return 'of every';
    }
  }

  private get isShowTimePicker() {
    return !this.isHourly && !this.isMinutely;
  }

  private get isHourly() {
    return this.selectedFrequencyType === SchedulerName.Hourly;
  }

  private get isMinutely() {
    return this.selectedFrequencyType === SchedulerName.Minutely;
  }

  private get isWeekly() {
    return this.selectedFrequencyType === SchedulerName.Weekly;
  }

  private get isMonthly() {
    return this.selectedFrequencyType === SchedulerName.Monthly;
  }

  private get dateAsMs(): number {
    const stringFormat = DateTimeFormatter.formatAsHHmmss(this.selectedTime);
    Log.debug('StringFormat::', stringFormat, this.selectedTime);
    return Date.parse(DateTimeFormatter.formatDateWithTime(this.date, stringFormat));
  }

  mounted() {
    this.selectedFrequencyType = this.frequencyOptions[0].value;
    this.initData();
  }

  hideTimePickerPopover() {
    this.isTimePickerPopoverOpen = false;
  }

  onChangeTime(newValue: Moment) {
    Log.debug('onChangeTime::', newValue);
    this.selectedTime = newValue;
    this.emitJobScheduler();
  }

  getJobScheduler(): TimeScheduler {
    switch (this.selectedJobSchedulerType) {
      case SchedulerType.RunOnlyOnce: {
        return new SchedulerOnce(this.dateAsMs);
      }
      default:
        return this.getJobSchedulerOnRecurringMode();
    }
  }

  getJobschedulerUI() {
    switch (this.selectedJobSchedulerType) {
      case SchedulerType.RunOnlyOnce: {
        return new SchedulerOnce(this.dateAsMs);
      }
      default:
        return this.getJobSchedulerOnRecurringModeUI();
    }
  }

  @Watch('date')
  onDateChange(newValue: Date) {
    this.emitJobScheduler();
  }

  @Watch('selectedJobSchedulerType')
  onChangeJobSchedulerType(newValue: SchedulerType) {
    this.emitJobScheduler();
  }

  @Watch('selectedFrequencyType')
  onChangeFrequencyType(newValue: SchedulerName) {
    this.emitJobScheduler();
  }

  @Watch('recurEvery')
  onChangeRecurEvery() {
    this.emitJobScheduler();
  }

  @Watch('recurEveryMonth')
  onChangeRecurEveryMonth() {
    this.emitJobScheduler();
  }

  @Watch('selectedDayOfWeek')
  onChangeSelectedDayOfWeek() {
    this.emitJobScheduler();
  }

  @Watch('selectedTime')
  onChangeSelectedTime() {
    this.emitJobScheduler();
  }

  @Watch('interval')
  onChangeInterval() {
    this.emitJobScheduler();
  }

  private initData() {
    this.initSelectedJobSchedulerType();
    this.initSelectedFrequencyType();
    this.initSelectedDate();
    this.initSelectedTime();
    this.initInterval();
    this.initMonthInterval();
    this.initSelectedDaysOfWeek();
  }

  private initSelectedDate() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Once: {
        this.date = moment((this.schedulerTime as SchedulerOnce).startTime).toDate();
        break;
      }
      default:
        this.date = new Date();
    }
  }

  private initSelectedJobSchedulerType() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Once: {
        this.selectedJobSchedulerType = SchedulerType.RunOnlyOnce;
        break;
      }
      default:
        this.selectedJobSchedulerType = SchedulerType.Recurring;
    }
  }

  private initSelectedFrequencyType() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Minutely:
        this.selectedFrequencyType = SchedulerName.Minutely;
        break;
      case SchedulerName.Hourly:
        this.selectedFrequencyType = SchedulerName.Hourly;
        break;
      case SchedulerName.Daily:
        this.selectedFrequencyType = SchedulerName.Daily;
        break;
      case SchedulerName.Weekly:
        this.selectedFrequencyType = SchedulerName.Weekly;
        break;
      case SchedulerName.Monthly:
        this.selectedFrequencyType = SchedulerName.Monthly;
    }
  }

  private initSelectedTime() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Once:
        this.selectedTime = moment((this.schedulerTime as SchedulerOnce).startTime);
        break;
      case SchedulerName.Daily:
      case SchedulerName.Weekly:
      case SchedulerName.Monthly:
        this.selectedTime = moment(this.schedulerTime.atTime);
        break;
      default:
        this.selectedTime = moment(Date.now());
    }
  }

  private initInterval() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Minutely:
      case SchedulerName.Hourly:
      case SchedulerName.Daily:
      case SchedulerName.Weekly: {
        this.interval = this.schedulerTime?.recurEvery ?? 1;
        break;
      }
      case SchedulerName.Monthly: {
        this.interval = toNumber((this.schedulerTime as SchedulerMonthly).recurOnDays[0]) ?? 1;
        break;
      }
      default:
        this.interval = 1;
    }
  }

  private initMonthInterval() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Monthly: {
        this.monthInterval = (this.schedulerTime as SchedulerMonthly).recurEveryMonth;
      }
    }
  }

  private initSelectedDaysOfWeek() {
    switch (this.schedulerTime.className) {
      case SchedulerName.Weekly: {
        this.selectedDayOfWeek = (this.schedulerTime as SchedulerWeekly).includeDays;
        break;
      }
      default:
        this.selectedDayOfWeek = [];
    }
  }

  private emitJobScheduler() {
    const jobScheduler = this.getJobScheduler();
    this.$emit('change', jobScheduler);
  }

  private getJobSchedulerOnRecurringMode(): TimeScheduler {
    switch (this.selectedFrequencyType) {
      case SchedulerName.Minutely: {
        return new SchedulerMinutely(this.interval);
      }
      case SchedulerName.Hourly: {
        return new SchedulerHourly(this.interval);
      }
      case SchedulerName.Daily: {
        return new SchedulerDaily(this.interval, this.dateAsMs);
      }
      case SchedulerName.Weekly: {
        return new SchedulerWeekly(this.interval, this.dateAsMs, this.selectedDayOfWeek);
      }
      case SchedulerName.Monthly: {
        return new SchedulerMonthly([this.interval], this.dateAsMs, this.monthInterval);
      }
      default:
        return new SchedulerMinutely(this.interval);
    }
  }

  private getJobSchedulerOnRecurringModeUI(): TimeScheduler {
    switch (this.selectedFrequencyType) {
      case SchedulerName.Minutely: {
        return new SchedulerMinutely(this.interval);
      }
      case SchedulerName.Hourly: {
        return new SchedulerHourly(this.interval);
      }
      case SchedulerName.Daily: {
        return new SchedulerDaily(this.interval, this.dateAsMs);
      }
      case SchedulerName.Weekly: {
        return new SchedulerWeekly(this.interval, this.dateAsMs, this.selectedDayOfWeek);
      }
      case SchedulerName.Monthly: {
        return new SchedulerMonthly([this.interval], this.dateAsMs, this.monthInterval);
      }
      default:
        return new SchedulerMinutely(this.interval);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/calendar/new-custom-vcalendar.scss';
.job-scheduler-form {
  //width: 400px;

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }

  #date.input-calendar {
    height: 32px !important;
  }

  .job-scheduler-form-group {
    &:not(:last-child) {
      margin-bottom: 16px;
    }

    .text {
      color: var(--secondary-text-color);
      opacity: 0.8;
    }

    > label {
      margin-bottom: 12px;
      opacity: 0.8;
    }

    .input {
      height: 34px;
      padding: 0 16px;
    }

    .display-name {
      //width: 400px;
    }

    #job-scheduler-type {
      height: 34px;
      padding-left: 16px;
      //width: 400px;
    }

    .time-picker {
      .ant-time-picker-input {
        background: var(--input-background-color);
        height: 34px;
        border: none;
      }
    }

    .frequency-options {
      display: flex;
      align-items: center;
      //height: 16px;

      > label:first-child {
        display: flex;
        align-items: center;
        width: 107px;
        margin: 0;
        height: max-content;
        color: var(--secondary-text-color);
        opacity: 0.8;
      }

      .time-input {
        width: 45px;
        height: 34px;
        padding-left: 16px;
        margin-right: 8px;
      }

      .day-select {
        width: 290px;
        margin: 0;

        .form-check {
          width: 57px;

          .form-check-input {
            width: 16px;
            height: 16px;
            margin-right: 8px;
          }
        }
      }

      .frequency-radio-item {
        display: flex;
        align-items: center;
        margin-bottom: 0;

        div[role='radiogroup'] {
          display: flex;
        }

        .form-check-inline {
          margin-right: 8px;
        }

        .form-check-input {
          height: 16px;
          width: 16px;
          margin-right: 7px;
        }

        .form-check-label {
          font-size: 12px;
          letter-spacing: 0.17px;
        }
      }
    }
  }
}
</style>
