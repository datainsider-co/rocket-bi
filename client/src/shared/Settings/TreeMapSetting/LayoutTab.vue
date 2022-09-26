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
import { PlotOptions } from '@core/domain';
import { SelectOption } from '@/shared';
import PanelHeader from '@/screens/ChartBuilder/SettingModal/PanelHeader.vue';

@Component({ components: { PanelHeader } })
export default class LayoutTab extends Vue {
  @Prop({ required: false, type: Object })
  setting!: PlotOptions;

  private get layoutOptions(): SelectOption[] {
    return [
      {
        displayName: 'Slice And Dice',
        id: 'sliceAndDice'
      },
      {
        displayName: 'Stripes',
        id: 'stripes'
      },
      {
        displayName: 'Squarified',
        id: 'squarified'
      },
      {
        displayName: 'Strip',
        id: 'strip'
      }
    ];
  }

  private get layout(): string {
    return this.setting?.treemap?.layoutAlgorithm ?? 'sliceAndDice';
  }

  private handleLayoutChanged(newValue: string) {
    return this.$emit('onChanged', 'plotOptions.treemap.layoutAlgorithm', newValue);
  }
}
</script>

<style lang="scss" src="../Common/tab.style.scss"></style>
