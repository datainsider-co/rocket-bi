<template>
  <div class="editable-form-input" :style="backgroundColorVariables">
    <label class="editable-form-input-label"> {{ column.displayName }}</label>
    <div v-if="isShowSpan" class="editable-form-input-input" @click="showEditInput">
      <span v-if="value" :style="{ maxWidth: `${maxSpanWidth}px` }"> {{ value }} </span>
      <span v-else class="empty">- - -</span>
    </div>
    <div v-else class="editable-form-input-input">
      <b-input-group>
        <b-form-input ref="input" v-model="editedValue" autocomplete="off" @keydown.enter="save" @keydown.esc="cancel" />
        <b-input-group-append>
          <img src="@/assets/icon/ic-close-16.svg" alt="Cancel" @click="cancel" />
          <img src="@/assets/icon/ic-16-save.svg" alt="Save" @click="save" />
        </b-input-group-append>
      </b-input-group>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Ref } from 'vue-property-decorator';
import { GenericColumn } from '@core/common/domain/model/column/implement/GenericColumn';
import { EditableColumn } from '@core/common/domain/model/column/implement/EditableColumn';

@Component
export default class EditableColumnFormInput extends Vue {
  @Prop({ type: Object, required: true })
  item!: EditableColumn;

  @Prop({ type: String, required: true })
  backgroundColor!: string;

  @Prop({ type: String, required: true })
  inputBackgroundColor!: string;

  @Prop({ type: Number })
  maxSpanWidth!: number;

  isShowSpan: boolean;
  editedValue: string;

  @Ref()
  private readonly input!: any;

  constructor() {
    super();
    this.isShowSpan = true;
    this.editedValue = '';
  }

  created() {
    this.editedValue = this.value;
  }

  beforeDestroy() {
    this.editedValue = '';
  }

  get column(): GenericColumn {
    return this.item.column;
  }

  get value(): any {
    return this.item.value;
  }

  get backgroundColorVariables() {
    return {
      '--editable-form-input-background-color': this.backgroundColor,
      '--editable-form-input-input-background-color': this.inputBackgroundColor
    };
  }

  showEditInput() {
    this.editedValue = this.value;
    this.isShowSpan = false;
    this.$nextTick(() => {
      this.input.focus();
    });
  }

  cancel() {
    this.editedValue = this.value;
    this.isShowSpan = true;
  }

  @Emit('editableFormInputSaved')
  save() {
    this.isShowSpan = true;
    const newItem = new EditableColumn(this.column, this.editedValue);
    return newItem;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~@/themes/scss/_button.scss';

.editable-form-input {
  display: flex;
  flex-direction: column;
  background-color: var(--editable-form-input-background-color);
  width: 100%;
  align-items: flex-start;

  .editable-form-input-label {
    @include regular-text;
    order: 0;
    opacity: 0.5;
    font-size: 12px;
    letter-spacing: 0.2px;
    margin-left: 16px;
  }

  .editable-form-input-input {
    order: 1;
    height: 42px;
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 100%;

    span {
      @include regular-text;
      font-size: 14px;
      letter-spacing: 0.2px;
      margin-left: 16px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    span:hover {
      cursor: pointer;
    }

    .empty {
      opacity: 0.5;
    }

    input {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
      background: transparent;
      height: 40px;
      padding-left: 16px;

      font-size: 14px;
      font-weight: normal;
      font-stretch: normal;
      font-style: normal;
      line-height: normal;
      letter-spacing: 0.18px;
      text-align: left;
      color: var(--secondary-text-color);
    }

    img {
      margin-right: 6px;
      cursor: pointer;
      padding: 10px;
      box-sizing: content-box;
    }
  }
}

.editable-form-input + .editable-form-input {
  margin-top: 16px;
}

::v-deep {
  label {
    margin-bottom: 8px;
  }

  .input-group-append {
    background: transparent;
    //background-color: var(--editable-form-input-input-background-color);
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
}
</style>
