<template>
  <div class="dropdown-input">
    <DiDropdown
      class="w-100 dropdown"
      :class="{ 'is-invalid': !inputMode && isError }"
      :id="id"
      :data="data"
      v-model="selected"
      :placeholder="dropdownInputPlaceholder"
      :labelProps="labelProps"
      :valueProps="valueProps"
      :appendAtRoot="true"
      hidePlaceholderOnMenu
      @selected="handleSelected"
      @change="handleChange"
      :disabled="loading"
    >
      <template slot="before-menu" slot-scope="{ hideDropdown }">
        <li class="active color-di-primary font-weight-normal" @click.prevent="selectNewDatabaseOption(hideDropdown)">
          {{ extraOptionLabel }}
        </li>
      </template>
      <template slot="icon-dropdown">
        <i v-if="loading" alt="dropdown" class="fa fa-spin fa-spinner text-muted"></i>
        <i v-else alt="dropdown" class="di-icon-arrow-down text-muted"></i>
      </template>
    </DiDropdown>

    <BFormInput
      v-if="inputMode"
      ref="input"
      v-model="inputValue"
      :debounce="300"
      class="form-control text-truncate mt-12px"
      :placeholder="inputPlaceholder"
      type="text"
      @input="resetErrorMessage"
      @keydown.enter="handleEnterEvent"
    />
  </div>
</template>
<script lang="ts">
import { Component, Model, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { BFormInput } from 'bootstrap-vue';
import { StringUtils } from '@/utils/StringUtils';

@Component({
  components: { DiDropdown }
})
export default class DropdownInput extends Vue {
  private inputMode = false;
  private errorMessage = '';
  private inputValue = '';

  @Ref()
  private readonly input!: BFormInput;

  @Prop({ required: false, default: 'dropdown-input' })
  id!: string;

  @Prop({ required: false, default: false })
  loading!: boolean;

  @Prop({ default: '' })
  private readonly value!: string;

  private selected: string | null = this.value;

  @Prop({ default: 'Dropdown input' })
  dropdownPlaceholder!: string;

  @Prop({ required: true })
  data!: DropdownData[];

  @Prop({ required: false, default: 'input' })
  inputPlaceholder!: string;

  @Prop({ required: false, default: 'Input field' })
  extraOptionLabel!: string;

  @Prop({ required: false, default: 'label' })
  labelProps!: string;

  @Prop({ required: false, default: 'label' })
  valueProps!: string;

  public reset() {
    this.selected = null;
    this.inputValue = '';
    this.errorMessage = '';
  }

  private get dropdownInputPlaceholder() {
    if (this.loading) {
      return 'Loading ...';
    } else if (this.inputMode) {
      return this.extraOptionLabel;
    } else {
      return this.dropdownPlaceholder;
    }
  }

  private get isError() {
    return StringUtils.isNotEmpty(this.errorMessage);
  }

  private selectNewDatabaseOption(callback: Function) {
    this.inputMode = true;
    this.selected = null;
    this.resetErrorMessage();
    callback ? callback() : null;
    this.$nextTick(() => {
      this.input.focus();
    });
  }

  private resetErrorMessage() {
    this.errorMessage = '';
  }

  private handleSelected(value: DropdownData) {
    this.inputMode = false;
    this.$emit('selected', value);
  }

  private handleChange(value: string) {
    this.inputMode = false;
    this.$emit('change', value);
  }

  private handleEnterEvent() {
    this.$emit('submit');
  }

  @Watch('inputValue')
  onSelectedChanged(selectedValue: string | number) {
    this.$emit('change', selectedValue);
  }

  @Watch('inputMode')
  onInputModeChanged(inputMode: boolean) {
    if (inputMode) {
      this.$emit('change', this.inputValue);
    } else {
      this.$emit('change', this.selected);
    }
  }

  private existValueInDropdownItems(value: string, data: DropdownData[]) {
    const index = data.findIndex(item => item[this.valueProps] === value);
    return index >= 0;
  }

  @Watch('data')
  onDropdownItemsChange(data: DropdownData[]) {
    if (StringUtils.isNotEmpty(this.value) && !this.existValueInDropdownItems(this.value, data)) {
      this.inputValue = this.value;
      this.inputMode = true;
    }
  }
}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.dropdown-input {
  .form-group {
    display: flex;
    justify-items: center;

    > label {
      height: 34px;
      display: flex;
      align-items: center;
      margin: 0;
    }

    > div {
      height: fit-content;
    }

    .form-control {
      margin-top: 12px;
    }

    margin-top: 12px;
    margin-bottom: 0;
  }

  input {
    height: 34px;
    padding: 0 16px;
    @include regular-text();
    font-size: 14px;
    color: var(text-color);
    letter-spacing: 0.17px;
    cursor: text;

    ::-webkit-input-placeholder,
    :-ms-input-placeholder,
    ::placeholder {
      @include regular-text-14();
      letter-spacing: 0.18px;
      color: var(--text-disabled-color, #bebebe) !important;
    }
  }

  ::v-deep {
    .select-container {
      margin-top: 0;
    }

    .dropdown {
      //padding-left: 16px;
      height: 34px;

      > div {
        height: 34px;
      }

      .dropdown-input-search {
        font-size: 12px !important;
      }
    }

    .select-popover ul li {
      span.font-normal {
        font-size: 12px;
      }

      padding-left: 16px !important;
    }

    .select-popover ul li.active {
      font-size: 12px;
    }
  }

  .select-container {
    width: 350px;
  }
}

.active {
  color: var(--accent) !important;
}
</style>
