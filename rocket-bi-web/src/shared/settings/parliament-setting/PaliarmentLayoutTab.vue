<template>
  <PanelHeader ref="panel" header="Layout" target-id="style-tab">
    <div class="style-tab">
      <DropdownSetting
        id="font-family"
        :options="layoutOptions"
        :value="layout"
        class="mb-3 group-config"
        label="Select style"
        size="full"
        @onChanged="handleLayoutChanged"
      />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PlotOptions } from '@core/common/domain';
import { SelectOption } from '@/shared';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class ParliamentLayoutTab extends Vue {
  @Prop({ required: false, type: Object })
  setting!: PlotOptions;

  private get layoutOptions(): SelectOption[] {
    return [
      {
        displayName: 'Parliament',
        id: 'parliament'
      },
      {
        displayName: 'Rectangle',
        id: 'rectangle'
      },
      {
        displayName: 'Circle',
        id: 'circle'
      }
    ];
  }

  private get layout(): string {
    return this.setting?.displayType ?? 'parliament';
  }

  private handleLayoutChanged(newValue: string) {
    return this.$emit('onChanged', 'displayType', newValue);
  }
}
</script>

<style lang="scss" src="../common/TabStyle.scss"></style>
