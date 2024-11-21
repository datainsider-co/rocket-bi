<template>
  <div class="run-only-once d-flex col-12 p-0 input-date-time">
    <div class="job-scheduler-form-group m-0 col-12 px-0">
      <label>Default Date</label>
      <DiDatePicker :date.sync="date" class="w-100" style="margin-right: 12px" />
    </div>
    <!--    <div class="job-scheduler-form-group d-flex flex-column m-0 col-6 p-0">-->
    <!--      <label>Time</label>-->
    <!--      <ATimePicker :open.sync="isTimePickerPopoverOpen" :value="selectedTime" class="time-picker w-100" @change="onChangeTime">-->
    <!--        <a-button slot="addon" class="w-100" size="small" type="primary" @click="hideTimePickerPopover">-->
    <!--          Ok-->
    <!--        </a-button>-->
    <!--      </ATimePicker>-->
    <!--    </div>-->
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync, Watch } from 'vue-property-decorator';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import moment from 'moment';
import { Moment } from 'moment/moment';
import { Log } from '@core/utils';
import { DateTimeUtils } from '@/utils';

@Component({ components: { DiDatePicker } })
export default class DiInputDateTime extends Vue {
  private isTimePickerPopoverOpen = false;

  @PropSync('value')
  private syncValue!: string;

  private date: Date = new Date();
  private selectedTime: Moment = moment(new Date());

  mounted() {
    this.initDate(this.syncValue);
    // this.initTime(this.syncValue);
  }

  private initDate(dateAsString: string) {
    this.date = moment(dateAsString).toDate();
  }

  private initTime(ts: number) {
    this.selectedTime = moment(ts);
  }

  hideTimePickerPopover() {
    this.isTimePickerPopoverOpen = false;
  }

  onChangeTime(newValue: Moment) {
    this.selectedTime = newValue;
  }

  @Watch('date')
  onDateChanged() {
    this.syncValue = DateTimeUtils.formatDate(this.date);
  }

  // @Watch('selectedTime')
  // onTimeChanged() {
  //   this.syncValue = this.getTimeStamp(this.date, this.selectedTime);
  // }

  // private getTimeStamp(date: Date, time: Moment): number {
  //   return moment(date.setHours(time.hour(), time.minute(), time.second(), time.millisecond())).valueOf();
  // }
}
</script>

<style lang="scss">
.input-date-time {
  .time-picker {
    .ant-time-picker-input {
      background: var(--input-background-color);
      height: 42px;
      border: none;
    }
  }
}
</style>
