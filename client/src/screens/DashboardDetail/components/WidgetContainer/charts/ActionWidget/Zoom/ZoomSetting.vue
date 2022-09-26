<template>
  <div class="zoom-setting">
    <template v-for="(item, index) in menuZoomOptions">
      <DiButton
        :id="genBtnId(`action-${item.text}`, index)"
        :key="genBtnId(`action-${item.text}`, index)"
        :is-disable="item.disabled"
        :title="item.text"
        @click.stop="item.click"
      >
      </DiButton>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { ChartInfo } from '@core/domain';
import { ContextMenuItem, ZoomLevelNode } from '@/shared';
import { getZoomNode, ZoomModule } from '@/store/modules/zoom.store';
import { Log } from '@core/utils';

@Component
export default class ZoomSetting extends Vue {
  @Prop({ required: true })
  private readonly metaData!: ChartInfo;

  private get menuZoomOptions(): ContextMenuItem[] {
    const currentLvl = ZoomModule.zoomDataAsMap.get(+this.metaData.id)?.currentHorizontalLevel ?? '';
    const zoomNode = getZoomNode(currentLvl);
    // .filter(node => node.level !== currentLvl);
    Log.debug('menuZoomOptions', zoomNode);
    return zoomNode.map(node => {
      return {
        text: node.displayName,
        click: () => this.emitZoom(node)
      };
    });
  }

  @Emit('onZoom')
  private emitZoom(node: ZoomLevelNode) {
    return node.level;
  }
}
</script>

<style lang="scss">
.zoom-setting {
  .di-button + .di-button {
    margin-top: 4px;
  }

  .di-button .title {
    font-size: 14px;
    text-align: left;
    font-weight: 400;
    color: var(--secondary-text-color);
  }

  .di-button:hover .title {
    color: var(--text-color);
  }
}
</style>
