<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import DiButtonGroup, { ButtonInfo } from '@/shared/components/common/DiButtonGroup.vue';
import { Routers } from '@/shared';
import { ChartUtils } from '@/utils';

@Component({
  components: { DiButtonGroup }
})
export default class SystemMonitorTabs extends Vue {
  private get routerName(): Routers {
    return this.$route.name as Routers;
  }

  private navigateTo(name: Routers) {
    try {
      if (this.routerName !== name) {
        this.$router.push({ ...this.$route, name: name });
      }
    } catch (ex) {
      //
    }
  }

  protected get isMobile() {
    return ChartUtils.isMobile();
  }

  get buttonInfos(): ButtonInfo[] {
    return [
      {
        displayName: this.isMobile ? 'Query' : 'Query Usage',
        isActive: this.routerName === Routers.QueryUsage,
        onClick: () => this.navigateTo(Routers.QueryUsage)
      },
      {
        displayName: this.isMobile ? 'User' : 'User Usage',
        isActive: this.routerName === Routers.UserUsage,
        onClick: () => this.navigateTo(Routers.UserUsage)
      }
    ];
  }
}
</script>

<template>
  <div class="d-flex">
    <DiButtonGroup id="system-monitor-tabs" :buttons="buttonInfos" class="di-btn-group" />
  </div>
</template>

<style lang="scss">
#system-monitor-tabs.di-btn-group {
  height: 34px;
}
</style>
