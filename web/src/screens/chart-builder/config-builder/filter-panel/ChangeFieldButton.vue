<template>
  <div class="change-field-button">
    <template v-if="node.field">
      <DiButton class="display-name text-decoration-none change-field-btn text-nowrap" @click="selectField" :title="node.title" ref="button"></DiButton>
    </template>
    <template v-else>
      <DiButton
        class="display-name text-decoration-none change-field-btn text-nowrap select-field"
        @click="selectField"
        title="Select field"
        ref="button"
      ></DiButton>
    </template>
    <SelectFieldContext ref="selectFieldContext" @select-column="handleOnSelectField"></SelectFieldContext>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { FieldDetailInfo } from '@core/common/domain/model/function/FieldDetailInfo';
import SelectFieldContext from '../config-panel/SelectFieldContext.vue';
import { SlTreeNodeModel } from '@/shared/components/builder/treemenu/SlVueTree';
import { HtmlElementRenderUtils, PopupUtils } from '@/utils';
import DiButton from '@/shared/components/common/DiButton.vue';
import { isFunction } from 'lodash';

@Component({
  components: {
    SelectFieldContext
  }
})
export default class ChangeFieldButton extends Vue {
  @Prop({ required: false, type: Object })
  private readonly node!: SlTreeNodeModel<any>;

  @Prop({ required: false, type: Number })
  private readonly nodeIndex!: number;

  @Ref()
  private readonly selectFieldContext!: SelectFieldContext;

  @Ref()
  private readonly button!: DiButton;

  private onChangedFieldFn?: (field: FieldDetailInfo) => void;

  selectField(event: MouseEvent, onChangedFieldFn?: (field: FieldDetailInfo) => void) {
    this.onChangedFieldFn = onChangedFieldFn;
    PopupUtils.hideAllPopup();
    const newEvent = HtmlElementRenderUtils.fixMenuOverlapForContextMenu(event, this.button.$el);
    this.selectFieldContext.showTableAndFields(newEvent);
  }

  private handleOnSelectField(field: FieldDetailInfo) {
    if (isFunction(this.onChangedFieldFn)) {
      this.onChangedFieldFn(field);
    } else {
      this.$emit('onChangedField', field);
    }
  }

  /**
   * Click on the button
   * if onChangedField is not null, it will be called after the field is selected instead of emitting onChangedField event
   */
  public click(onChangedFieldFn?: (field: FieldDetailInfo) => void) {
    const event = new MouseEvent('click');
    this.selectField(event, onChangedFieldFn);
  }
}
</script>

<style lang="scss">
.change-field-button {
  .change-field-btn {
    background: none;
    border: none;
  }

  .display-name {
    font-weight: bold;
    letter-spacing: 0.2px;
    color: var(--text-color);
    cursor: default;
    font-size: 14px;
    margin: 0;
    padding: 0 4px;
    text-decoration: underline;
  }

  .select-field {
    font-weight: normal;
    color: var(--accent) !important;
  }
}
</style>
