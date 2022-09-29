<template>
  <div style="max-width: 235px" class="w-100">
    <DatePicker
      :popover="{ visibility: 'click', positionFixed: true }"
      mode="single"
      color="blue"
      isDark
      v-model="date"
      :masks="{ input: ['MMM D, YYYY'] }"
      :attributes="attrs"
      title-position="left"
      :wpositionFixed="true"
    >
      <template v-slot:default="{ inputProps }">
        <DiButton :id="genBtnId('single-date-filter')" :placeholder="inputProps.value || placeholder">
          <i class="di-icon-calendar"></i>
        </DiButton>
      </template>
    </DatePicker>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { DateFilter } from '@core/common/domain/model';
// @ts-ignore
import DatePicker from 'v-calendar/lib/components/date-picker.umd';
import { DateTimeFormatter } from '@/utils/DateUtils';
import { Log } from '@core/utils';

@Component({
  components: {
    DatePicker
  }
})
export default class DateSingleFilter extends Vue {
  @Prop({ required: true })
  filter!: DateFilter;

  @Prop({ default: 'Please pick a date filter' })
  placeholder!: string;

  currentFilter = DateFilter.empty();
  date: Date = new Date();

  mounted() {
    if (this.filter) {
      this.currentFilter = DateFilter.fromObject(this.filter);
    }
  }

  @Watch('date')
  watchDate() {
    const changedFilter = DateFilter.fromObject(this.currentFilter);
    changedFilter.setDate(DateTimeFormatter.formatDate(this.date));
    this.$parent.$emit('change', changedFilter);
    this.$parent.$emit('apply-filter');
  }

  attrs: Array<object> = [
    {
      key: 'today',
      bar: 'blue',
      popover: {
        label: "You just hovered over today's date!"
      },
      dates: new Date()
    }
  ];

  public visibility = 'hidden';

  clickShow() {
    Log.debug('clickShow', this.visibility);
    this.visibility = this.visibility == 'hidden' ? 'visible' : 'hidden';
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.hover {
  cursor: pointer;
}

img.ic-16 {
  margin-right: 8px;
}

.date-input {
  opacity: 0.5;
  @include regular-text;
}

.grid-stack-item-content {
}
</style>
