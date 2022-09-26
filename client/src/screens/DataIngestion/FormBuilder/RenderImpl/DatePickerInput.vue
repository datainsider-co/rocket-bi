<template>
  <v-date-picker
    isDark
    class="date-picker-input"
    :popover="{ visibility: 'click', positionFixed: true }"
    v-model="date"
    :minDate="minDate"
    :maxDate="maxDate"
    :locale="locale"
    :attributes="datePickerAttrs"
    :masks="{ input: ['DD/MM/YYYY'] }"
    :updateOnInput="true"
  >
    <template v-slot="{ inputValue, inputEvents }">
      <b-form-input :value="inputValue" v-on="inputEvents" />
    </template>
  </v-date-picker>
</template>

<script lang="ts">
import { Component, Model, Prop, Vue, Watch } from 'vue-property-decorator';
import { DateUtils } from '@/utils';

@Component
export default class DatePickerInput extends Vue {
  @Prop({ default: new Date() })
  private readonly value!: Date | string;

  @Prop({ required: false, default: true, type: Boolean })
  private readonly isHighlightToday!: boolean;

  @Prop({ required: false, default: DateUtils.DefaultLocale })
  private readonly locale!: string;

  private date = this.value;

  @Prop()
  minDate?: string | Date;

  @Prop()
  maxDate?: string | Date;

  private get datePickerAttrs() {
    if (this.isHighlightToday) {
      return [
        {
          highlight: {
            color: 'blue',
            fillMode: 'outline',
            contentClass: 'highlight-solid'
          },
          dates: new Date()
        }
      ];
    } else {
      return [];
    }
  }

  @Watch('date')
  onChange(newDate: Date | string) {
    this.$emit('change', newDate);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/calendar/new-custom-vcalendar.scss';
@import '~@/shared/components/calendar.scss';

.date-picker-input {
  .input-calendar {
    @include regular-text;
    width: calc(100% - 8px);
    font-size: 13.5px;
    letter-spacing: 0.2px;
    color: var(--text-color);
    height: 40px;
    background-color: var(--input-background-color, #333645);
    border: transparent;
    padding-right: 0;
    padding-left: 8px;
    box-sizing: content-box;
    border-radius: 4px;
    justify-content: center;
    cursor: pointer;
  }

  .vc-popover-caret {
    display: none;
  }
  vc-text-white {
    color: var(--secondary) !important;
  }

  .vc-grid-container.grid {
    padding: 16px;
    width: 321px;
  }

  .vc-popover-content-wrapper {
    visibility: visible !important;
  }

  .vc-arrows-container {
    margin-top: 16px;
  }

  .vc-font-bold {
    color: var(--accent-text-color);
  }

  .di-calendar-input-container {
    //background-color: var(--secondary);
    .icon-title {
      display: none;
    }
    padding: 0;

    img {
      display: none;
    }

    input {
      width: 100%;
      margin: 0;
      height: 40px;
      border-radius: 4px;
      background-color: var(--input-background-color, #333645);
      padding-left: 0;
      padding-right: 0;
    }
  }
  //}
}
</style>
