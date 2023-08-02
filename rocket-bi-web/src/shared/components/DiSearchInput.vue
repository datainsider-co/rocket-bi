<template>
  <div class="di-search--input" :border="border">
    <slot>
      <SearchIcon></SearchIcon>
    </slot>
    <BInput
      ref="input"
      :value="value"
      :debounce="debounce"
      :autofocus="autofocus"
      autocomplete="off"
      v-bind="$attrs"
      @blur="handleUnFocus"
      @input="value => handleSubmitValue(value)"
      @keydown.enter="handleEnter"
    />
    <div v-if="isNotEmpty" @click.stop="clearText" class="di-search--clear-text">
      <i class="di-icon-close btn-icon-border"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import { TimeoutUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { BFormInput } from 'bootstrap-vue';

@Component({
  inheritAttrs: true
})
export default class DiSearchInput extends Vue {
  private processIdSubmitChange: null | number = null;
  @Model('input', { required: true, type: String, default: '' })
  private readonly value!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly border!: boolean;

  @Prop({ required: false, default: 300 })
  private readonly debounce!: number;

  @Prop({ required: false, default: false })
  private readonly autofocus!: boolean;
  private curValue = '';

  @Ref()
  private readonly input!: BFormInput;

  private get isNotEmpty() {
    return StringUtils.isNotEmpty(this.value);
  }

  private handleEnter(): void {
    if (this.processIdSubmitChange) {
      clearTimeout(this.processIdSubmitChange);
      this.processIdSubmitChange = null;
    }
    this.$emit('change', this.curValue);
    this.$emit('enter');
  }

  private handleUnFocus(): void {
    this.$emit('blur');
  }

  private handleSubmitValue(text: string): void {
    this.curValue = text;
    this.$emit('input', text);

    this.processIdSubmitChange = TimeoutUtils.waitAndExec(
      this.processIdSubmitChange,
      () => {
        this.$emit('change', this.curValue);
      },
      this.debounce
    );
  }

  private clearText(): void {
    if (this.processIdSubmitChange) {
      clearTimeout(this.processIdSubmitChange);
      this.processIdSubmitChange = null;
    }
    this.curValue = '';
    this.$emit('input', '');
    this.$emit('change', '');
    this.$emit('clear');

    this.focus();
  }

  focus() {
    this.input?.focus();
  }
}
</script>

<style lang="scss">
.di-search--input {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: white;
  height: 34px;
  border-radius: 4px;

  &[border] {
    border: 1px solid rgba(231, 235, 238, 1);
  }

  > svg {
    flex-shrink: 1;
    margin: 12px 8px 12px 14px;
  }

  input.form-control {
    flex: 1;
    background: transparent;
    height: unset;
    margin-right: 14px;

    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    color: var(--text-color);

    &::placeholder {
      color: var(--secondary-text-color);
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 18px;
    }
  }

  .di-search--clear-text {
    margin-right: 8px;
  }
}
</style>
