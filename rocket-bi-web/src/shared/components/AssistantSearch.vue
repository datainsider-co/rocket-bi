<template>
  <BContainer>
    <BRow align-v="center">
      <BInput
        id="search"
        v-model="textInput"
        class="col"
        :debounce="timeBound"
        style="cursor: text"
        autocomplete="off"
        :placeholder="hintText"
        @keydown.enter="handleEnterText(textInput)"
      ></BInput>

      <ChatGPTIcon color="var(--accent)" />
    </BRow>
  </BContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { TimeoutUtils } from '@/utils';
import ChatGPTIcon from '@/shared/ChatGPTIcon.vue';

@Component({
  components: { ChatGPTIcon }
})
export default class AssistantSearch extends Vue {
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

  handleEnterText(newValue: string) {
    this.$emit('onEnter', this.textInput);
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
