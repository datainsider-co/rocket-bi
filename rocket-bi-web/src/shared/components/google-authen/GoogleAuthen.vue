<template>
  <div class="google-authen">
    <h3>DataInsider requires authorization to connect to your {{ productTitle }}</h3>
    <DiButton class="access-gg-btn" :is-loading="loading" primary title="AUTHORIZE" @click="authorize"> </DiButton>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { GoogleUtils } from '@/utils/GoogleUtils';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';
import DiButton from '@/shared/components/common/DiButton.vue';
import { StringUtils } from '@/utils/StringUtils';
import { DIException } from '@core/common/domain';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';

/**
 * @deprecated use GoogleAuthen2 instead
 */
@Component({
  components: { DiButton }
})
export default class GoogleAuthentication extends Vue {
  private googleConfig = require('@/screens/data-ingestion/constants/google-config.json');
  private loading = false;

  googleAuthenticationType = this.$attrs.config_type as ThirdPartyAuthenticationType;

  private get productTitle(): string {
    switch (this.googleAuthenticationType) {
      case ThirdPartyAuthenticationType.GoogleAnalytic:
        return 'Google Analytics';
      case ThirdPartyAuthenticationType.GoogleSheet:
        return 'Google Sheet';
      case ThirdPartyAuthenticationType.GA4:
        return 'Google Analytics';
      case ThirdPartyAuthenticationType.GoogleAds:
        return 'Google Ads';
      default:
        return '';
    }
  }

  private get scope(): string {
    const scope = this.$route.query.scope as string;
    if (StringUtils.isNotEmpty(scope)) {
      return scope;
      //todo: fixme delete if deploy new version for google ads
    } else {
      switch (this.googleAuthenticationType) {
        case ThirdPartyAuthenticationType.GoogleAnalytic:
          return this.googleConfig.gaScope;
        case ThirdPartyAuthenticationType.GoogleSheet:
          return this.googleConfig.sheetScope;
        default:
          return '';
      }
    }
  }

  private get clientId(): string {
    const clientId = this.$route.query.clientId as string;
    if (StringUtils.isNotEmpty(clientId)) {
      return clientId;
      //todo: fixme delete if deploy new version for google ads
    } else {
      return this.googleConfig.clientId;
    }
  }

  private ensureGoogleConfig() {
    if (StringUtils.isEmpty(this.clientId) || StringUtils.isEmpty(this.scope) || StringUtils.isEmpty(this.googleAuthenticationType)) {
      throw new DIException('invalid google config');
    }
  }

  private async authorize() {
    try {
      Log.debug('GoogleAuthen::authorize::param::', this.scope, this.clientId);
      this.loading = true;
      this.ensureGoogleConfig();
      const gaAuthResponse = await GoogleUtils.loginGoogle(this.clientId!, this.scope!);
      this.handlePostMessage(gaAuthResponse);
      this.loading = false;
    } catch (e) {
      Log.error('GoogleAuthen::authorize::error:', e.message);
      window.opener.postMessage({ error: e.message }, '*');
      PopupUtils.showError(e.message);
    } finally {
      window.close();
      this.loading = false;
    }
  }

  private handlePostMessage(data: gapi.auth2.AuthorizeResponse) {
    Log.debug('handlePostMessage::', data);
    Log.debug('redirectRouteQuery::', this.$route.query);
    const targetOrigin = this.$route.query.redirect;
    if (data.access_token) {
      window.opener.postMessage(
        {
          authResponse: data,
          responseType: this.googleAuthenticationType
        },
        targetOrigin
      );
    }
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;

  .google-authen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: white;

    .access-gg-btn {
      width: fit-content;
      height: 42px;
      padding: 12px 24px;
    }
  }
}
</style>
