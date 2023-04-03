<template>
  <DiButton id="tiktok-btn" class="access-tik-tok-btn" primary title="Access to Tiktok Account" @click="authentication">
    <i v-if="loading" class="fa fa-spin fa-spinner"></i>
    <img v-else src="@/assets/icon/ic_tiktok.svg" height="22" width="22" />
  </DiButton>
</template>
<script lang="ts">
import { Component } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import DiButton from '@/shared/components/common/DiButton.vue';
import { StringUtils } from '@/utils/StringUtils';
import { DIException } from '@core/common/domain';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';
import { AuthView } from '@/shared/components/google-authen/AuthView';

@Component({
  components: { DiButton }
})
export default class TiktokAuth extends AuthView {
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
      this.handlePostMessage({ authCode: this.authCode }, ThirdPartyAuthenticationType.TikTok, redirectLink);
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

  // private getAuthCode(response: Window): string {
  //   Log.debug('handlePostMessage::', response);
  //   Log.debug('redirectRouteQuery::', this.$route.query);
  //   const redirectUrl = this.$route.query.redirectUrl;
  //   if (isString(redirectUrl) && StringUtils.isNotEmpty(redirectUrl)) {
  //     return (redirectUrl as string).replaceAll(`${this.config.redirectUrl}`, '');
  //   }
  //   return '';
  // }
}
</script>

<style lang="scss">
#tiktok-btn {
  background-color: #0d0d16 !important;
}

.access-tik-tok-btn {
  width: fit-content;
}
</style>
