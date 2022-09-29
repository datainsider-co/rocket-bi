<template>
  <div class="shopify-integration-step-1">
    <DiLoading></DiLoading>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { Routers } from '@/shared';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { Di } from '@core/common/modules';
import { RouterUtils } from '@/utils/RouterUtils';
import DiLoading from '@/shared/components/DiLoading.vue';
import { ShopifyUtils } from '@/utils';

@Component({
  components: {
    DiLoading
  }
})
export default class ShopifyIntegrationStep1 extends Vue {
  private get shopUrl(): string {
    return this.$route.query['shop'] as string;
  }

  private get scopes(): string {
    return process.env.VUE_APP_SHOPIFY_SCOPE;
  }

  created() {
    this.initData();
  }

  private async initData(): Promise<void> {
    try {
      if (ShopifyUtils.isShopValid(this.shopUrl)) {
        const clientId: string = await Di.get(DataSourceService).getShopifyClientId();
        const redirectUri = `${window.location.protocol}//${window.location.host}/shopify/redirect`;
        this.navigateToShopify(clientId, this.scopes, redirectUri);
      } else {
        await RouterUtils.to(Routers.AllData, { replace: true });
      }
    } catch (ex) {
      Log.error('ShopifyIntegrationStep1::failure', ex);
      await RouterUtils.to(Routers.AllData, { replace: true });
    }
  }

  private navigateToShopify(apiKey: string, scopes: string, redirectUri: string) {
    window.location.href = `https://${this.shopUrl}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}`;
  }
}
</script>

<style lang="scss">
.shopify-integration-step-1 {
  background: var(--secondary);
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
}
</style>
