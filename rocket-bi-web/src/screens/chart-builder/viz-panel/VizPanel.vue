<template>
  <div class="d-inline-block visualization-area">
    <div class="d-flex flex-row header align-items-center justify-content-between">
      <div class="title unselectable">Visualization</div>
      <div class="d-flex flex-row" v-if="showSetting">
        <DiIconTextButton :id="genBtnId('setting')" class="ml-1" title="Settings" @click="handleOpenSetting">
          <i class="di-icon-settings-wrench"></i>
        </DiIconTextButton>
      </div>
    </div>
    <div class="d-flex flex-column body">
      <PreviewPanel ref="previewPanel" class="visualization" @clickMatchingButton="onMatchingButtonClicked" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator';
import PreviewPanel from '@/screens/chart-builder/viz-panel/PreviewPanel.vue';
import { Inject } from 'typescript-ioc';
import { VizSettingResolver } from '@/shared/resolver';
import { ChartInfo, WidgetId } from '@core/common/domain';
import { _ChartStore } from '@/screens/dashboard-detail/stores';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import { Log } from '@core/utils';

@Component({
  components: {
    PreviewPanel,
    DiIconTextButton
  }
})
export default class VizPanel extends Vue {
  @Ref()
  private readonly previewPanel!: PreviewPanel;

  @Prop({ required: false, default: true })
  private readonly showSetting!: boolean;

  @Inject
  private readonly settingResolver!: VizSettingResolver;

  private currentChartId: WidgetId | null = null;

  private get enableSetting(): boolean {
    return !!this.currentChartId;
  }

  renderChart(chartInfo: ChartInfo | null) {
    Log.debug('VizPanel::renderChart::chartInfo', chartInfo);
    this.currentChartId = chartInfo?.id || null;
    this.previewPanel.renderChart(chartInfo);
  }

  @Emit('clickSettingButton')
  private handleOpenSetting(event: MouseEvent) {
    return event;
  }
  private onMatchingButtonClicked() {
    this.$emit('clickMatchingButton');
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.visualization-area {
  padding: 16px;

  .header {
    height: 21px;
    cursor: unset;

    .title {
      @include medium-text();
      font-weight: var(--builder-font-weight);
    }

    .action-selection {
      margin-top: 0;
      min-width: 150px;

      ::v-deep {
        > .relative {
          button {
            background-color: transparent;
          }
        }
      }
    }
  }

  .body {
    height: calc(100% - 40px);
    //background: var(--dashboard-gradient-background-color);
    //background: linear-gradient(131deg, var(--min-background-color, #3b425c) 2%, var(--max-background-color, #212638) 90%);

    .visualization {
      height: calc(100% - 0px);
    }

    .setting {
      height: calc(40% + 16px);
    }

    .visualization + .setting {
      margin-top: 16px;
    }
  }

  .header + .body {
    margin-top: 16px;
  }

  .apply-button {
    ::v-deep {
      width: 100%;
    }
  }
}
</style>
