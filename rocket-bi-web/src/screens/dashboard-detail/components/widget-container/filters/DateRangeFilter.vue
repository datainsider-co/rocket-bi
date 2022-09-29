<template>
  <div style="max-width: 235px" class="w-100">
    <DatePicker
      :popover="{ visibility: 'click', positionFixed: true }"
      color="blue"
      mode="range"
      isDark
      v-model="date"
      :masks="{ input: ['MMM D, YYYY'] }"
      :attributes="attrs"
      title-position="left"
    >
      <template v-slot:default="{ inputProps }">
        <DiButton :id="genBtnId('date-range-filter')" :placeholder="inputProps.value || placeholder">
          <i class="di-icon-calendar"></i>
        </DiButton>
      </template>
    </DatePicker>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
// @ts-ignore
import DatePicker from 'v-calendar/lib/components/date-picker.umd';
import { DateRange } from '@/shared';
import { Log } from '@core/utils';

@Component({
  components: {
    DatePicker
  }
})
export default class DateRangeFilter extends Vue {
  // @Prop({required: true})
  // filter!: RangeDateFilter;

  @Prop({ default: 'Please pick a date range' })
  placeholder!: string;

  // currentFilter = RangeDateFilter.empty();

  mounted() {
    // if (this.filter) {
    //   Log.debug('filter:::', this.filter);
    //   this.currentFilter = RangeDateFilter.fromObject(this.filter);
    // }
  }

  @Watch('date')
  watchDate() {
    if (this.date) {
      const start = new Date(this.date.start);
      const end = new Date(this.date.end);

      //clone currentFilter
      // const changedFilter = RangeDateFilter.fromObject(this.currentFilter);
      // changedFilter.setDate(FormatDateTime.formatDate(start), FormatDateTime.formatDate(end));
      // this.$parent.$emit('change', changedFilter);
      // this.$parent.$emit('apply-filter');
    }
  }

  attrs: Array<object> = [
    {
      key: 'today',
      dot: 'blue',
      popover: {
        label: "You just hovered over today's date!"
      },
      dates: new Date()
    }
  ];

  public visibility = 'hidden';

  date: DateRange = {
    start: '',
    end: ''
  };

  clickShow() {
    Log.debug('clickShow', this.visibility);
    this.visibility = this.visibility == 'hidden' ? 'visible' : 'hidden';
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.hover {
  cursor: pointer;
}

.date-input {
  opacity: 0.5;
  @include regular-text;
}
</style>
