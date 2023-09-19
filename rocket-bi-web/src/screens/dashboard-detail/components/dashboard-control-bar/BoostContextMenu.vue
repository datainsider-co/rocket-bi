<template>
  <ContextMenu ref="contextMenu" :close-on-click="true" id="boost-menu">
    <div class="boost-menu-container">
      <div id="header">Information Boost Mode</div>
      <div id="content">
        Next run time boost:
        <div id="next-run-time">{{ nextRunTime }}</div>
      </div>
      <DiButton id="refresh-btn" title="Refresh" @click="handleRefresh">
        <i class="di-icon-refresh" />
      </DiButton>
    </div>
  </ContextMenu>
</template>

<script lang="ts">
import ContextMenu from '@/shared/components/ContextMenu.vue';
import { DateTimeUtils, TimeoutUtils } from '@/utils';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { BoostInfo } from '@core/common/domain';
import { Component, Ref, Vue } from 'vue-property-decorator';

@Component({ components: { ContextMenu } })
export default class BoostContextMenu extends Vue {
  private info: BoostInfo | null = null;
  private callback: (() => void) | null = null;

  @Ref()
  private readonly contextMenu?: ContextMenu;

  show(event: MouseEvent, info: BoostInfo | null | undefined, onRefresh?: () => void) {
    this.hide();
    this.info = info || BoostInfo.default();
    this.callback = onRefresh || null;
    this.$nextTick(async () => {
      await TimeoutUtils.sleep(100); //stuck ui
      const positionEvent = HtmlElementRenderUtils.fixMenuOverlap(event, 'btn-performance-boost');
      this.contextMenu?.show(positionEvent, []);
    });
  }

  private get nextRunTime(): string {
    return DateTimeUtils.formatAsDDMMYYYYHms(this.info?.nextRunTime ?? 0, false);
  }

  private handleRefresh() {
    if (this.callback) {
      this.callback();
    }
    this.hide();
  }

  hide() {
    this.contextMenu?.hide();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
#boost-menu {
  .boost-menu-container {
    padding: 12px;
    min-width: 240px;

    #header {
      @include bold-text-14();
    }

    #content {
      margin: 8px 0 16px 0;
      color: var(--text-color);
      #next-run-time {
        color: var(--accent);
      }
    }

    #refresh-btn {
      background-color: var(--accent) !important;
      justify-content: center;
      .title {
        width: unset;
        color: var(--accent-text-color);
      }
      i {
        color: var(--accent-text-color);
      }
    }
  }
}
</style>
