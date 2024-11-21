<template>
  <div class="param-container">
    <div class="param-name" @click="onSelectParam">{{ param.displayName }}</div>
    <DiDatePicker
      :class="{ 'value-default--date': isValueDefault }"
      :is-show-icon-date="false"
      class="date-picker-input "
      :date.sync="tempValueAsDate"
      v-if="param.valueType === ValueTypes.date"
    />
    <DiDropdown
      class="list-default-value"
      :class="{ 'value-default--dropdown': isValueDefault }"
      v-else-if="param.valueType === ValueTypes.list"
      :data="listItemOps"
      labelProps="name"
      valueProps="id"
      v-model="tempValue"
      :appendAtRoot="true"
      boundary="window"
      @change="handleListDefaultValueChanged"
    />
    <template v-else>
      <input
        class="param-input-value"
        ref="textInput"
        v-if="isFocus"
        v-model="tempValue"
        @enter="unfocus"
        @keyup.enter="unfocus"
        @blur="unfocus"
        :style="inputStyle"
      />
      <div ref="paramValue" class="param-value" v-else @click="onChangeParam">
        <div class="default-value" v-if="isEmptyValue">
          default value
        </div>
        <div v-else :class="{ 'value-default': isValueDefault }">{{ displayValue }}</div>
      </div>
    </template>
    <i :id="actionBtnId" class="di-icon-setting btn-ghost p-1" @click="onEditParam" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { ParamValueType, QueryParameter } from '@core/common/domain';
import { DateTimeUtils, ListUtils, PopupUtils, StringUtils } from '@/utils';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { Log } from '@core/utils';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import DiInputDateTime from '@/screens/data-management/components/DiInputDateTime.vue';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import moment from 'moment';
import { max, min } from 'lodash';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { AtomicAction } from '@core/common/misc';

@Component({ components: { DiDropdown, DiInputDateTime, DiInputComponent, PopoverV2, DiDatePicker } })
export default class ParamItem extends Vue {
  private readonly ValueTypes = ParamValueType;
  @Prop({ required: true })
  private readonly param!: QueryParameter;
  private isFocus = false;
  private tempValue = this.param.value;
  private inputWidth = '';

  @Ref()
  private readonly textInput?: HTMLInputElement;

  @Ref()
  private readonly paramValue?: HTMLDivElement;

  @Ref()
  private readonly popover?: PopoverV2;

  private get inputStyle(): any {
    return {
      width: this.inputWidth
    };
  }

  private get isValueDefault(): boolean {
    return this.tempValue === this.param.value;
  }

  private get listItemOps() {
    if (this.param.list) {
      return this.param.list?.map(item => {
        return {
          id: item,
          name: item
        };
      });
    } else {
      return [];
    }
  }

  private calculateInputWidth() {
    const defaultWidth = 50;
    const spaceWidth = 4;
    const inputWidth = max([this.paramValue?.getBoundingClientRect()?.width ?? defaultWidth, defaultWidth])!;
    this.inputWidth = StringUtils.toPx(inputWidth + spaceWidth);
  }

  focus() {
    this.isFocus = true;
    this.calculateInputWidth();
    ///Show calendar
    if (this.param.valueType === ParamValueType.date) {
      this.showCalendarPopover(this.paramValue!);
    }
    if (this.param.valueType === ParamValueType.text || this.param.valueType === ParamValueType.number) {
      this.$nextTick(() => {
        this.textInput?.focus();
      });
    }
  }

  mounted() {
    this.setListDefaultValue();
  }

  setListDefaultValue() {
    if (this.param.valueType === ParamValueType.list) {
      if (!this.param.value && this.param.list && ListUtils.isNotEmpty(this.param.list)) {
        this.tempValue = this.param.list[0];
      }
    }
  }

  @AtomicAction()
  unfocus() {
    this.isFocus = false;
    this.$emit('change', this.param.displayName, this.tempValue);
  }

  private onChangeParam() {
    this.focus();
  }

  private onSelectParam() {
    this.$emit('select', this.param);
  }

  private onEditParam(event: MouseEvent) {
    PopupUtils.hideAllPopup();
    event.stopPropagation();
    this.$emit('edit', event, this.param, this.tempValue);
  }

  private get displayValue(): string {
    switch (this.param.valueType) {
      case ParamValueType.text:
      case ParamValueType.number:
        return `${this.tempValue}`;
      case ParamValueType.date:
        return DateTimeUtils.formatDateTime(this.tempValue);
      default:
        return '';
    }
  }

  private get actionBtnId(): string {
    return `action-${this.param.displayName}`;
  }

  private get isEmptyValue(): boolean {
    return StringUtils.isEmpty(this.displayValue);
  }

  private showCalendarPopover(element: HTMLDivElement) {
    Log.debug('showCalendarPopover::');
    this.popover?.showPopover(element);
  }

  @Watch('param.value')
  onValueChanged() {
    this.tempValue = this.param.value;
  }

  @Watch('tempValue')
  private onParamValueChange() {
    this.popover?.hidePopover();
  }

  private get tempValueAsDate(): Date {
    return moment(this.tempValue).toDate();
  }

  private set tempValueAsDate(date: Date) {
    this.tempValue = DateTimeUtils.formatDate(date);
    this.unfocus();
  }

  private handleListDefaultValueChanged(value: string) {
    this.tempValue = value;
    this.unfocus();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

$nameColor: #2236f5;
$valueColor: #5f6368;
$inputColor: #000;
$height: 26px;
$opacityValue: 0.5;
.param-container {
  height: $height;
  padding: 0 12px;
  background: var(--primary);
  display: flex;
  flex-direction: row;
  cursor: pointer;
  align-items: center;
  border-radius: 4px;

  .value-default {
    opacity: $opacityValue;

    &--date {
      opacity: unset;

      .input-calendar {
        opacity: $opacityValue;
        &:focus {
          opacity: unset;
        }
      }
    }

    &--dropdown {
      opacity: unset;
      .dropdown-input-placeholder {
        opacity: $opacityValue;
      }
    }
  }

  .param-name {
    @include regular-text-14();
    color: $nameColor;
    cursor: pointer;
  }

  .param-input-value {
    @include regular-text-14();
    color: $inputColor;
    margin: 0 6px;
    background: transparent;
    border: unset;
  }

  .date-picker-input {
    height: 23px;
    width: 90px;
    @include regular-text-14();
    color: $inputColor;
    background: transparent;

    input {
      height: 23px;
      width: 80px;
      background: transparent;
      padding: 0 0 0 8px;
    }
    .vc-popover-content {
      z-index: 1000;
    }
  }

  .param-value {
    @include regular-text-14();
    color: $inputColor;
    margin: 0 8px;
    cursor: pointer;
    min-width: 50px;
    text-align: left;

    .default-value {
      color: $valueColor;
    }
  }

  .list-default-value {
    margin-top: 0;
    height: 23px;
    width: 160px;
    overflow: hidden;

    button {
      height: 23px;
    }

    .dropdown-input-placeholder {
      color: #000000;
      font-size: 14px;
    }

    &:hover {
      button {
        background: rgba(242, 242, 247, 0.6);
      }
    }
  }

  &:hover {
    //border: 1px solid var(--accent);
    background: rgba(242, 242, 247, 0.6);

    .param-name {
      //text-decoration: underline;
    }

    .list-default-value {
      button {
        background: rgba(242, 242, 247, 0.6);
      }
    }
  }

  i {
    font-size: 12px;
  }
}
</style>
