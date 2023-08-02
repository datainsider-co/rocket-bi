<template>
  <div class="tiktok-auth px-3">
    <h3>DataInsider.co requires authorization to connect to your tiktok ads account</h3>
    <DiButton id="tiktok-btn" class="access-tik-tok-btn" primary title="Access to Tiktok Account" @click="authentication">
      <i v-if="loading" class="fa fa-spin fa-spinner"></i>
      <img alt="tiktok-logo" v-else src="@/assets/icon/ic_tiktok.svg" height="22" width="22" />
    </DiButton>
  </div>
</template>
<script lang="ts">
import { Component } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import DiButton from '@/shared/components/common/DiButton.vue';
import { StringUtils } from '@/utils/StringUtils';
import { DIException } from '@core/common/domain';
import { ThirdPartyType } from '@/shared/components/third-party-authentication/ThirdPartyType';
import { AbstractAuthentication } from '@/shared/components/third-party-authentication/AbstractAuthentication';

@Component({
  components: { DiButton }
})
export default class TiktokAuth extends AbstractAuthentication {
  private config = require('@/screens/data-ingestion/constants/tiktok-config.json');
  private static readonly originLinkKey = 'originLink';
  private loading = false;

  private get appId(): string {
    return window.appConfig.VUE_APP_TIKTOK_ID;
  }

  private ensureConfig() {
    if (StringUtils.isEmpty(window.appConfig.VUE_APP_TIKTOK_ID)) {
      throw new DIException('App id is required!');
    }
    if (StringUtils.isEmpty(window.appConfig.VUE_APP_TIKTOK_REDIRECT_URL)) {
      throw new DIException('Config is empty!');
    }
  }

  private state(): string {
    return Math.random()
      .toString(36)
      .substring(2);
  }

  private buildTiktokAuthenUrl(): string {
    let url = this.config.authenUrl;

    url += `?app_id=${window.appConfig.VUE_APP_TIKTOK_ID}`;
    // url += `&scope=user.info.basic,video.list`;
    // url += '&response_type=code';
    url += `&redirect_uri=${window.appConfig.VUE_APP_TIKTOK_REDIRECT_URL}`;
    url += '&state=' + this.state();
    return url;
  }

  async authentication() {
    try {
      this.loading = true;
      this.ensureConfig();
      sessionStorage.setItem(TiktokAuth.originLinkKey, `${this.$route.query.redirect}`);
      await this.openWindow(this.buildTiktokAuthenUrl());
      this.loading = false;
    } catch (e) {
      window.opener.postMessage({ error: e.message }, '*');
      PopupUtils.showError(e.message);
    } finally {
      // window.close();
      this.loading = false;
    }
  }

  private openWindow(url: string): Window | null {
    const width = 500;
    const height = 550;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;
    return window.open(url, '_self', `toolbar=yes,scrollbars=yes,resizable=yes,top=${top},left=${left},width=${width},height=${height}`);
  }

  private get authCode(): string {
    return (this.$router.currentRoute?.query?.auth_code as string | null) ?? '';
  }

  async mounted() {
    if (StringUtils.isNotEmpty(this.authCode)) {
      await this.onAuthChanged();
    }
  }

  private async onAuthChanged() {
    try {
      this.loading = true;
      const redirectLink = sessionStorage.getItem(TiktokAuth.originLinkKey) as string;
      this.handlePostMessage({ authCode: this.authCode }, ThirdPartyType.TikTok, redirectLink);
      if (!window.dumpLog) {
        sessionStorage.removeItem(TiktokAuth.originLinkKey);
      }
    } catch (ex) {
      Log.error(ex);
      PopupUtils.showError(ex.message);
      this.handleError(ex);
    } finally {
      this.loading = false;
      if (!window.dumpLog) {
        window.close();
      }
    }
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;

  .tiktok-auth {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: white;

    #tiktok-btn {
      background-color: #0d0d16 !important;
    }

    .access-tik-tok-btn {
      width: fit-content;
    }
  }
}
</style>
