<template>
  <div class="di-search-input">
    <b-input
      :id="id"
      ref="input"
      :debounce="200"
      :placeholder="placeHolder"
      :value="value"
      autocomplete="off"
      autofocus
      class="b-input position-relative w-100"
      trim
      @blur="blur"
      @input="handleValueChanged"
      @keydown.enter="handleValueChanged(value)"
    />
    <div v-if="showClearIcon" class="search-clear-icon" @click="clearInput">
      <CloseIcon class="btn-icon btn-icon-border"></CloseIcon>
    </div>
    <!--    <img v-if="showClearIcon" alt="" class="close-search-btn position-absolute btn-ghost" src="@/assets/icon/ic_close.svg" @click="clearInput"/>-->
  </div>
</template>

<script lang="ts">
import { Emit, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { BFormInput } from 'bootstrap-vue';
import { StringUtils } from '@/utils/string.utils';
import CloseIcon from '@/shared/components/Icon/CloseIcon.vue';
@Component({
  components: { CloseIcon }
})
export default class SearchInput extends Vue {
  @Prop({ required: false, type: String })
  private readonly id!: string;
  @Model('input', { default: '' })
  private readonly value!: string;
  @Prop({ required: false, type: String, default: '' })
  private readonly placeHolder!: string;
  @Ref()
  private readonly input!: BFormInput;

  private get showClearIcon() {
    return StringUtils.isNotEmpty(this.value);
  }

  @Emit('blur')
  private blur(event: Event) {
    return event;
  }

  private clearInput() {
    this.handleValueChanged('');
    this.input.focus();
  }

  @Emit('input')
  private handleValueChanged(value: string) {
    return value;
  }
}
</script>

<style lang="scss">
.di-search-input {
  width: 100%;
  position: relative;
  .b-input {
    background: var(--input-background-color);
    height: 36px;
    padding-left: 10px;
    padding-right: 30px;
    width: 100%;

    &::placeholder {
      color: var(--text-color);
      opacity: var(--normal-opacity);
    }
  }

  .search-clear-icon {
    position: absolute;
    top: 3px;
    right: 3px;

    > * {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
