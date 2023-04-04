<template>
  <div class="google-authen">
    <h3>DataInsider requires authorization to connect to your {{ productTitle }}</h3>
    <DiButton class="access-gg-btn" :is-loading="loading" primary title="AUTHORIZE" @click="authentication"> </DiButton>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { AuthView } from '@/shared/components/google-authen/AuthView';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';
import { GoogleUtils, PopupUtils, StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';

@Component({ components: {} })
export default class GoogleAuthen2 extends AuthView {
  private googleConfig = require('@/screens/data-ingestion/constants/google-config.json');
  private loading = false;

  authType = this.$attrs.config_type as ThirdPartyAuthenticationType;

  private get productTitle(): string {
    switch (this.authType) {
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
      switch (this.authType) {
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
    if (StringUtils.isEmpty(this.clientId) || StringUtils.isEmpty(this.scope) || StringUtils.isEmpty(this.authType)) {
      throw new DIException('invalid google config');
    }
  }

  async authentication(): Promise<void> {
    try {
      Log.debug('GoogleAuthen::authorize::param::', this.authType, this.scope, this.clientId);
      this.loading = true;
      this.ensureGoogleConfig();
      const gaAuthResponse: gapi.auth2.AuthorizeResponse = await GoogleUtils.loginGoogle(this.clientId!, this.scope!);
      this.handlePostMessage(gaAuthResponse, this.$router.currentRoute.params.config_type);
      this.loading = false;
    } catch (e) {
      this.handleError(e);
    } finally {
      window.close();
      this.loading = false;
    }
  }
}
</script>
