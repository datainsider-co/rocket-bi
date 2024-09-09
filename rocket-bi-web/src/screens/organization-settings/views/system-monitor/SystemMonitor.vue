<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { LayoutContent } from '@/shared/components/layout-wrapper';
import SSOBody from '@/screens/organization-settings/views/sso-config/component/SSOBody.vue';
import SSOHeader from '@/screens/organization-settings/views/sso-config/component/SSOHeader.vue';
import SystemMonitorHeader from '@/screens/organization-settings/views/system-monitor/components/SystemMonitorHeader.vue';
import SystemMonitorTabs from '@/screens/organization-settings/views/system-monitor/components/SystemMonitorTabs.vue';
import EventBus from '@/screens/organization-settings/views/sso-config/helper/EventBus';
import { Log } from '@core/utils';
import { clone, isArray, isString } from 'lodash';

@Component({
  components: { SystemMonitorTabs, SystemMonitorHeader, SSOHeader, SSOBody, LayoutContent }
})
export default class SystemMonitor extends Vue {
  created() {
    EventBus.$on('set-path-param', this.setRouterPathParam);
    EventBus.$on('remove-path-param', this.removeRouterPathParam);
  }

  beforeDestroy() {
    EventBus.$off('set-path-param', this.setRouterPathParam);
    EventBus.$off('remove-path-param', this.removeRouterPathParam);
  }

  private setRouterPathParam(path: Record<string, string | string[]>) {
    Log.debug('setRouterPathParam::', path);
    try {
      const cloneQuery = clone(this.$route.query);
      for (const key in path) {
        if (!path[key]) {
          delete cloneQuery[key];
        } else if (isString(path[key]) && path[key].length === 0) {
          delete cloneQuery[key];
        } else if (isArray(path[key] && path[key].length === 0)) {
          delete cloneQuery[key];
        } else {
          cloneQuery[key] = path[key];
        }
      }
      this.$router.replace({ query: { ...cloneQuery } });
    } catch (ex) {
      //
    }
  }

  private removeRouterPathParam(path: Set<string>) {
    Log.debug('setRouterPathParam::', path);
    const cloneQuery = clone(this.$route.query);
    path.forEach(value => delete cloneQuery[value]);
    try {
      this.$router.replace({ query: { ...cloneQuery } });
    } catch (ex) {
      //
    }
  }
}
</script>

<template>
  <LayoutContent>
    <SystemMonitorHeader />
    <div class="layout-content-panel d-flex flex-column p-4">
      <SystemMonitorTabs />
      <router-view />
    </div>
  </LayoutContent>
</template>
