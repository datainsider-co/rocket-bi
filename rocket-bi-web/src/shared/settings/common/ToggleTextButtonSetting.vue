<template>
  <div :class="{ 'disabled-setting': disable }" class="toggle-text-button">
    <ToggleSetting :id="toggleId" :label="toggleLabel" :value="value" @onChanged="emitToggleValueChanged" />
    <div class="d-flex align-items-center text-truncate">
      <h6 class="toggle-text-button--advance" :title="buttonLabel" v-show="value" @click="emitClickedButton">{{ buttonLabel }}</h6>
      <span v-if="showHint" class="di-icon-help ml-2" v-b-tooltip.auto="hint"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import ToggleSetting from '@/shared/settings/common/ToggleSetting.vue';
import { StringUtils } from '@/utils';

@Component({
  components: {
    ToggleSetting
  }
})
export default class ToggleTextButtonSetting extends Vue {
  @Prop({ required: false, type: String, default: '' })
  private readonly toggleId!: string;

  @Prop({ required: true, type: String })
  private readonly toggleLabel!: string;

  @Prop({
    required: false,
    type: String,
    default: 'Advanced controls'
  })
  private readonly buttonLabel!: string;

  @Prop({ required: false, type: String, default: '' })
  private readonly buttonId!: string;

  @Prop({ required: true, type: Boolean })
  private value!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ type: String, default: '' })
  private readonly hint!: string;

  @Emit('onChanged')
  private emitToggleValueChanged(value: boolean): boolean {
    return value;
  }

  @Emit('onClickedButton')
  private emitClickedButton(event: MouseEvent): MouseEvent {
    return event;
  }
  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }
}
</script>

<style lang="scss">
.toggle-text-button {
  align-items: center;
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;

  > div {
    .label.text-break {
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    margin-right: 8px;
  }

  &--advance {
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--accent);
    margin: 0;
  }
}
</style>
