<template>
  <DIPopover
    :isShow="true"
    :targetId="targetId"
    custom-class="drilldown-popover"
    is-show-header
    is-show-title
    placement="bottom-left"
    triggers="blur"
    @update:isShow="handleHidePopover"
  >
    <template #custom-popover>
      <DrilldownSetting :displayType="displayType" :metaData="metaData" @hide="handleHidePopover"></DrilldownSetting>
    </template>
  </DIPopover>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import DIPopover from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DIPopover.vue';
import { ChartInfo } from '@core/common/domain/model';
import DrilldownSetting, { DisplayTypes } from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/drilldown/DrilldownSetting.vue';

@Component({
  components: {
    DIPopover,
    DrilldownSetting
  }
})
export default class DrilldownSettingPopover extends Vue {
  @Prop({ required: true, type: String })
  private targetId!: string;

  @Prop({ required: true })
  private readonly metaData!: ChartInfo;

  @Emit('hide')
  private handleHidePopover(currentEvent?: Event) {
    return currentEvent ?? event;
  }

  private readonly displayType = DisplayTypes.Popover;
}
</script>
