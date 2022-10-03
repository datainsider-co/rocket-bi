<template>
  <v-date-picker
    v-model="syncedDate"
    :attributes="datePickerAttrs"
    :inputDebounce="inputDebounce"
    :locale="locale"
    :masks="{ input: [formatter] }"
    :max-date="maxDate"
    :min-date="minDate"
    :popover="popover"
    :updateOnInput="true"
    class="di-date-picker"
    :style="{ pointerEvents: disabled ? 'none' : 'auto' }"
    color="blue"
    isDark
    @input="onChange"
  >
    <template v-slot="{ inputValue, inputEvents }">
      <div class="input-container position-relative">
        <input
          id="date"
          :placeholder="placeholder"
          :value="formatDisplay(inputValue)"
          autocomplete="off"
          class="input-calendar"
          v-on="inputEvents"
          :disabled="disabled"
          @keyup.enter="handleCatchEnterEvent"
        />
        <i v-if="isShowIconDate" class="di-icon-calendar position-absolute" style="font-size: 16px"></i>
      </div>
    </template>
  </v-date-picker>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import moment from 'moment';
import { DateUtils } from '@/utils';

export type Visibility = 'hover-focus' | 'focus' | 'click' | 'hover' | 'visible' | 'hidden';

//Each placement can have suffixed variations -start or -end.
export type Placement = 'auto' | 'top' | 'right' | 'left' | 'bottom';

@Component
export default class DiDatePicker extends Vue {
  @PropSync('date')
  syncedDate!: Date;
  @Prop({ required: false })
  readonly maxDate?: Date;
  @Prop({ required: false })
  readonly minDate?: Date;
  @Prop({ required: false, default: true, type: Boolean })
  private readonly isHighlightToday!: boolean;

  @Prop({ required: false, default: 1000, type: Number })
  private readonly inputDebounce!: number;

  //popover date picker visibility
  @Prop({ required: false, default: 'click' })
  private readonly visibility!: Visibility;

  //popover date picker placement
  @Prop({ required: false, default: 'auto' })
  private readonly placement!: Placement;

  @Prop({ required: false, default: true })
  private readonly isShowIconDate!: boolean;

  @Prop({ required: false, type: String, default: 'MM/DD/YYYY' })
  private readonly formatter!: string;

  @Prop({ required: false, type: String, default: '' })
  private readonly placeholder!: string;

  @Prop({ required: false, type: String, default: '' })
  private readonly failureText!: string;

  @Prop({ required: false, default: DateUtils.DefaultLocale })
  private readonly locale!: string;

  @Prop({ required: false, default: false })
  private readonly disabled!: string;

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

  private get popover() {
    return { visibility: this.visibility, placement: this.placement, positionFixed: true };
  }

  onChange(newDate: Date | string) {
    this.$emit('change', newDate);
  }

  private formatDisplay(value: any) {
    if (value) {
      return moment(value).format(this.formatter);
    }
    return this.failureText;
  }

  private handleCatchEnterEvent() {
    this.$emit('change', this.syncedDate);
  }
}
</script>

<style lang="scss" scoped>
@import 'CalendarContextMenu';
</style>
