<template>
  <div class="vue-tags-input-container" :id="id" ref="tagInputContainer">
    <VueTagsInput
      v-model="inputValue"
      ref="tagInput"
      :add-only-from-autocomplete="addOnlyFromAutocomplete"
      :tags="tags"
      :placeholder="placeholder"
      :validation="validations"
      :autocomplete-items="filteredSuggestTags"
      :avoid-adding-duplicates="avoidDuplicate"
      :allow-edit-tags="allowEitTags"
      :add-on-key="addOnKey"
      :is-duplicate="isDuplicate"
      @tags-changed="handleTagsChanged"
    />
    <BPopover
      :show.sync="isShowSuggestion"
      placement="bottom"
      :id="'popover-' + id"
      :target="inputId"
      container="body"
      boundary="window"
      custom-class="vue-tags-input-suggestion"
      ref="suggestion"
      triggers="blur click"
    >
      <div v-if="isShowSuggestionPopover" class="listing-data" :style="{ width: `${popoverWidth}px` }">
        <vuescroll v-if="isHaveSuggestionItems" :ops="verticalScrollConfig">
          <div class="vuescroll-body">
            <div class="item" v-for="(tag, index) in filteredSuggestTags" :key="'suggest-item-' + index" @click="handleAddTag(tag)">{{ tag.text }}</div>
          </div>
        </vuescroll>
        <div v-else class="no-data">No found results</div>
      </div>
    </BPopover>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { StringUtils } from '@/utils/string.utils';
//@ts-ignore0
import VueTagsInput from '@johmun/vue-tags-input';
import { Log } from '@core/utils';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { BPopover } from 'bootstrap-vue';
import { VerticalScrollConfigs } from '@/shared';
import { ListUtils } from '@/utils';

@Component({
  components: { ContextMenu, VueTagsInput }
})
export default class TagsInput extends Vue {
  private readonly verticalScrollConfig = VerticalScrollConfigs;

  private isShowSuggestion = false;
  private inputValue = '';
  popoverWidth = 0;

  @Ref()
  private suggestion!: BPopover;

  @Ref()
  private tagInput!: VueTagsInput;

  @Ref()
  private tagInputContainer!: HTMLElement;

  @Prop({ default: 'tag-input-id', type: String })
  private readonly id!: string;

  private inputId = `${this.id}-vue-tags-input`;

  @Prop({ default: 'Add tag', type: String })
  private readonly placeholder!: string;

  @Prop({ default: () => [] })
  private readonly defaultTags!: any[];

  @Prop({ default: () => [] })
  private readonly suggestTags!: any[];

  @Prop({ default: '', required: false })
  private readonly labelProp!: string;

  @Prop({ default: false, type: Boolean })
  private readonly addOnlyFromAutocomplete!: boolean;

  @Prop({ default: () => [], type: Array })
  private readonly validations!: any[];

  @Prop({ default: true, type: Boolean })
  private readonly avoidDuplicate!: boolean;

  @Prop({ default: false, type: Boolean })
  private readonly allowEitTags!: boolean;

  @Prop({ default: () => [13], type: Array, required: false })
  private readonly addOnKey!: string[];

  @Prop({ type: Function, required: false })
  private readonly isDuplicate!: Function;

  private get tags() {
    Log.debug('Tags::', this.defaultTags);
    return this.defaultTags.map((data: any) => {
      const value = this.labelProp ? data[this.labelProp] : data;
      return {
        ...data,
        text: value
      };
    });
  }

  private getInputElement() {
    return this.tagInput.$el.querySelector('input.ti-new-tag-input');
  }

  mounted() {
    this.$nextTick(() => {
      const input = this.getInputElement();
      input.setAttribute('id', this.inputId);
      input.addEventListener('click', this.handleShowSuggestion);
    });
  }

  handleShowSuggestion(e: Event) {
    const input = this.getInputElement();
    this.popoverWidth = this.tagInputContainer.clientWidth;
    if (document.activeElement === input) {
      this.showSuggestion();
    }
  }

  beforeDestroy() {
    const input = this.getInputElement();
    input.removeEventListener('click', this.handleShowSuggestion);
  }

  private get isShowSuggestionPopover() {
    return ListUtils.isNotEmpty(this.suggestTags);
  }

  private get filteredSuggestTags() {
    const convertData = this.suggestTags.map(data => {
      return {
        ...data,
        text: data[this.labelProp]
      };
    });
    return convertData.filter((item: any) => !this.defaultTags.includes(item.text) && StringUtils.isIncludes(this.inputValue, item.text));
  }

  private get isHaveSuggestionItems() {
    return ListUtils.isNotEmpty(this.filteredSuggestTags);
  }

  private showSuggestion() {
    if (this.isHaveSuggestionItems && !this.isShowSuggestion) {
      this.$root.$emit('bv::show::popover', `popover-${this.id}`);
    }
  }

  private handleAddTag(tag: any) {
    Log.debug('DiTagsInput::Changed::', this.tags.concat([tag]));
    this.inputValue = '';
    this.$root.$emit('bv::hide::popover', `popover-${this.id}`);
    this.$emit('tagsChanged', this.tags.concat([tag]));
  }

  private handleTagsChanged(newTags: any[]) {
    this.inputValue = '';
    Log.debug('DiTagsInput::Changed::', newTags);
    this.$emit('tagsChanged', newTags);
  }

  @Watch('inputValue')
  onChangeInputValue() {
    this.popoverWidth = this.tagInputContainer.clientWidth;
    this.showSuggestion();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/_button.scss';

.vue-tags-input-container {
  .popover-reference {
    display: none;
  }
}

.vue-tags-input {
  background: var(--input-background-color) !important;
  border-radius: 4px;

  .ti-input {
    max-height: 100px;
    overflow: auto;
  }

  .ti-input,
  .ti-new-tag-input,
  .ti-autocomplete {
    border: 0 !important;
    border-radius: 4px;
  }

  .ti-autocomplete {
    display: none;
    max-height: 180px;
    background-color: var(--primary);
    overflow: auto;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);

    ul {
      background: var(--secondary);

      li {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;

        width: 100%;
      }
    }
  }

  .ti-new-tag-input.ti-valid {
    padding: 0 5px !important;
    background-color: #00000000;
  }

  .ti-new-tag-input-wrapper {
    ::placeholder {
      /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: var(--text-color);
      opacity: 0.3; /* Firefox */
    }

    :-ms-input-placeholder {
      /* Internet Explorer 10-11 */
      color: var(--text-color);
      opacity: 0.3; /* Firefox */
    }

    ::-ms-input-placeholder {
      /* Microsoft Edge */
      color: var(--text-color);
      opacity: 0.3; /* Firefox */
    }
  }

  .ti-duplicate {
    padding: 0 5px !important;
    background-color: #00000000;
  }

  .ti-item {
    > div {
      padding: 8px;
      height: 34px;
      display: flex;
      align-items: center;
    }

    &:hover {
      color: var(--secondary-text-color);
      background-color: var(--active-color);
    }
  }

  .ti-selected-item {
    background-color: var(--active-color);
    color: var(--secondary-text-color);
  }

  .ti-tag {
    background-color: var(--accent) !important;

    &.ti-invalid {
      background-color: var(--danger) !important;

      .ti-icon-close {
        @extend .btn-icon-border;
        color: var(--primary) !important;

        &:active,
        &:focus,
        &:hover {
          color: var(--secondary-text-color) !important;
        }
      }
    }

    &.ti-valid .ti-icon-close {
      @extend .btn-icon-border;
      color: var(--primary) !important;

      &:active,
      &:focus,
      &:hover {
        color: var(--secondary-text-color) !important;
      }
    }
  }
}

.vue-tags-input-suggestion {
  position: absolute;
  background: none;
  max-width: unset;
  width: unset;
  border: 0;

  .arrow {
    display: none;
  }
  .popover-body {
    padding: 0;
    margin-top: 15px;
  }

  .listing-data {
    padding: 8px 0;
    z-index: 100;
    margin-top: -10px;
    background: var(--secondary);
    border-radius: 4px;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.16), 0 4px 4px 0 rgba(0, 0, 0, 0.16);

    .vuescroll-body {
      max-height: 250px;
      //height: 250px;
      .item {
        width: 100%;
        padding: 8px 12px;
        font-size: 12px;
        color: var(--text-color);
        cursor: pointer;
        &:hover {
          background: var(--active-color);
        }
      }
    }
    .no-data {
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text-color);
    }
  }
}
</style>
