<template>
  <div class="google-auth-2 px-3">
    <h3>RocketBI requires authorization to connect to your {{ productTitle }}</h3>
    <DiButton class="access-gg-btn" :is-loading="loading" primary title="AUTHORIZE" @click="authentication"> </DiButton>
    <div style="font-weight: 400;margin-top: 8px;text-align: justify;">
      ***<a href="https://rocket.bi" target="_blank">RocketBI</a> use and transfer to any other app of information received from Google APIs will adhere to
      <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank"
        >Google API Services User Data Policy</a
      >, including the Limited Use requirements.
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { AbstractAuthentication } from '@/shared/components/third-party-authentication/AbstractAuthentication';
import { ThirdPartyType } from '@/shared/components/third-party-authentication/ThirdPartyType';
import { GoogleUtils, PopupUtils, StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';

@Component({ components: {} })
export default class GoogleAuth2 extends AbstractAuthentication {
  private loading = false;

  private get productTitle(): string {
    switch (this.authType) {
      case ThirdPartyType.GoogleAnalytic:
        return 'Google Analytics';
      case ThirdPartyType.GoogleSheet:
        return 'Google Sheet';
      case ThirdPartyType.GA4:
        return 'Google Analytics';
      case ThirdPartyType.GoogleAds:
        return 'Google Ads';
      default:
        return '';
    }
  }

  private get scope(): string {
    return this.$route.query.scope as string;
  }

  private get clientId(): string {
    const clientId = this.$route.query.clientId as string;
    if (StringUtils.isNotEmpty(clientId)) {
      return clientId;
      //todo: fixme delete if deploy new version for google ads
    } else {
      return window.appConfig.GOOGLE_CLIENT_ID;
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
      this.handlePostMessage(gaAuthResponse, this.authType);
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

<style lang="scss">
#app {
  height: 100vh;

  .google-auth-2 {
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
