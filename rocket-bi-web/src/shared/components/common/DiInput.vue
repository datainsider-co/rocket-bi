<template>
  <div class="input-container">
    <b-input-group class="form-control">
      <!--      <InputNumber/>-->
      <b-form-input
        ref="input"
        :id="id"
        :disabled="disable"
        :maxLength="maxLength"
        :placeholder="placeholder"
        :type="currentType"
        v-model="syncValue"
        autocomplete="off"
        class="form-input"
        @blur.native="handleUnFocusInput"
        @keydown.enter="handleUnFocusInput"
      />
    </b-input-group>
    <BPopover v-if="isNotEmptyData" :show.sync="isShowSuggestList" :target="id" custom-class="custom-listing-popover" placement="bottom" triggers="blur">
      <div :style="{ width: `${suggestionInputSize()}px` }" class="listing-data overflow-hidden">
        <div class="status-widget">
          <vuescroll>
            <div class="vuescroll-body">
              <div v-for="(label, index) in filteredData" :key="index" class="item" @click="handleSelectSuggest(label)">
                {{ label }}
              </div>
            </div>
          </vuescroll>
        </div>
        <!--        <div v-else class="text-center">Not found database name</div>-->
      </div>
    </BPopover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch, Ref } from 'vue-property-decorator';
import { InputType } from '@/shared/settings/common/InputSetting.vue';
import { ListUtils } from '@/utils';
import { Log } from '@core/utils';
import { BFormInput } from 'bootstrap-vue';

@Component
export default class DiInput extends Vue {
  @PropSync('value', { default: '' })
  private syncValue!: string;

  @Prop({ required: true, type: String })
  private readonly id!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, type: Number })
  private readonly maxLength?: number;

  @Prop({ required: false, type: String, default: '' })
  private readonly placeholder!: string;

  @Prop({ required: false, default: InputType.Text })
  private readonly type!: InputType;

  @Prop({ required: false, type: Array, default: () => [] })
  private readonly suggestions!: string[];

  @Prop({ required: false, type: Boolean, default: false })
  private readonly applyFormatNumber!: boolean;

  private isShowSuggestList = false;

  @Ref()
  private readonly input!: BFormInput;

  // if use format for number, input must be a text
  private get currentType(): string {
    if (this.useFormatter) {
      return InputType.Text;
    } else {
      return this.type;
    }
  }

  @Watch('syncValue')
  onTextChanged(text: string) {
    // Log.debug('onTextChanged', text);
  }

  private get useFormatter(): boolean {
    return this.type === InputType.Number && this.applyFormatNumber;
  }

  private get isNotEmptyData(): boolean {
    return ListUtils.isNotEmpty(this.filteredData);
  }

  private get filteredData(): string[] {
    return this.suggestions.filter(label => label.toLowerCase().includes(this.syncValue.toLowerCase()));
  }

  displaySuggest(show: boolean) {
    this.isShowSuggestList = show;
  }

  private handleUnFocusInput() {
    const showSuggest = false;
    this.displaySuggest(showSuggest);
  }

  private suggestionInputSize() {
    return this.$el?.clientWidth ?? 500;
  }

  private handleSelectSuggest(text: string) {
    this.syncValue = text;
  }

  focus() {
    this.input.focus();
  }
}
</script>

<style lang="scss" scoped>
.input-container {
  .form-control {
    padding: 0;
    background: var(--input-background-color);

    &::placeholder {
      color: var(--secondary-text-color);
      opacity: 0.8;
    }

    input {
      color: var(--secondary-text-color);
      background: transparent;
    }
    .form-input {
      padding: 0 8px;
    }
  }
}
.custom-listing-popover {
  ::v-deep {
    position: absolute;
    background: none;
    max-width: unset;
    width: unset;
    .arrow {
      display: none;
    }
    .popover-body {
      padding: 0;
    }
  }

  .listing-data {
    padding: 8px 0;
    //width: 350px;
    z-index: 100;
    margin-top: -10px;
    background: var(--primary);
    border-radius: 4px;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);
    color: var(--text-color);
    font-size: 14px;

    .vuescroll-body {
      max-height: 185px;

      .item {
        padding: 8px 0 8px 16px;
        font-size: 14px;
        cursor: pointer;
        &:hover {
          background: var(--secondary);
        }
      }
    }
  }
}
</style>
