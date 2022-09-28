<template>
  <header class="format-by-setting-bar">
    <DropdownSetting :id="`${id}-format-by`" :options="formatByOptions" :value="formatType" label="Format By" @onChanged="emitSelectFormatBy" />
    <DropdownSetting :id="`${id}-apply-to`" :options="applyToOptions" :value="applyTo" label="Apply to" @onChanged="emitSelectApplyTo" />
    <div></div>
  </header>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { FormattingOptions } from '@/shared/Settings/Common/ConditionalFormatting/FormattingOptions';

@Component
export default class FormatBySettingBar extends Vue {
  private readonly applyToOptions = FormattingOptions.ApplyToOptions;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  @Prop({ required: false, type: String, default: 'color' })
  private readonly displayType!: 'icon' | 'color';

  @Prop({ required: true, type: String })
  private readonly formatType!: string;

  @Prop({ required: true, type: String })
  private readonly applyTo!: string;

  private get formatByOptions() {
    switch (this.displayType) {
      case 'icon':
        return FormattingOptions.IconFormatByOptions;
      default:
        return FormattingOptions.FormatByOptions;
    }
  }

  @Emit('onSelectFormatBy')
  private emitSelectFormatBy(value: string) {
    return value;
  }

  @Emit('onSelectApplyTo')
  private emitSelectApplyTo(value: string) {
    return value;
  }
}
</script>

<style lang="scss">
header.format-by-setting-bar {
  display: flex;
  flex-direction: row;

  > div + div {
    margin-left: 12px;
  }

  > div {
    flex: 1;
  }
}
</style>
