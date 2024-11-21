<template>
  <BContainer class="h-100">
    <BRow class="h-100" align-v="center">
      <slot v-if="this.$slots.default"></slot>
      <img v-if="!this.$slots.default" src="@/assets/icon/ic_search.svg" class="ic-16" />
      <BInput
        :id="genInputId('search')"
        v-model="textInput"
        class="col"
        :debounce="timeBound"
        style="cursor: text"
        autocomplete="off"
        :placeholder="hintText"
        @keydown.enter="handleSubmitText(textInput)"
      ></BInput>
    </BRow>
  </BContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { TimeoutUtils } from '@/utils';

@Component
export default class SearchInput extends Vue {
  @Prop({ default: '' })
  hintText?: string;

  @Prop({ default: '' })
  text?: string;

  @Prop({ type: Number, default: 250 })
  timeBound!: number;

  textInput = '';

  private idProcessed: number | null = null;

  mounted() {
    if (this.text) {
      this.textInput = this.text;
    }
  }

  setTextInput(value: string) {
    this.textInput = value;
  }

  @Watch('textInput')
  handleSubmitText(newValue: string) {
    this.idProcessed = TimeoutUtils.waitAndExec(
      this.idProcessed,
      () => {
        this.$emit('onTextChanged', this.textInput);
      },
      this.timeBound
    );
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

::v-deep {
  .form-control {
    @include regular-text;
    font-size: 14px;
    line-height: 1.4;
    padding-left: 8px;
    padding-right: 8px;
    border-radius: 0 !important;

    &:focus {
      outline: none;
      -webkit-box-shadow: none;
      caret-color: var(--text-color);
    }
  }
}
</style>
