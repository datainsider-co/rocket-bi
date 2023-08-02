<template>
  <div class="fb-auth px-3">
    <h3>DataInsider.co requires authorization to connect to your Facebook Account</h3>
    <DiButton class="access-fb-btn" :is-loading="loading" primary title="AUTHORIZE" @click="authentication">
      <img v-show="!loading" alt="Facebook" height="16" width="16" src="https://static.xx.fbcdn.net/rsrc.php/v3/yq/r/_9VQFvOk7ZC.png" />
    </DiButton>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { Component } from 'vue-property-decorator';
import { AbstractAuthentication } from '@/shared/components/third-party-authentication/AbstractAuthentication';
import { PopupUtils, StringUtils } from '@/utils';
import { Log } from '@core/utils';
import { FacebookResponse, validFacebookResponse } from '@/shared/components/third-party-authentication/fb/FacebookResponse';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { ThirdPartyType } from '@/shared/components/third-party-authentication/ThirdPartyType';

@Component({ components: {} })
export default class FacebookAuth extends AbstractAuthentication {
  private loading = false;
  private readonly fbSDKUrl = 'https://connect.facebook.net/en_US/sdk.js';
  private readonly version = 'v13.0';
  @Inject
  private readonly dataSourceService!: DataSourceService;
  authType = this.$attrs.config_type as ThirdPartyType;

  private get scope(): string {
    const scope = this.$route.query.scope as string;
    return StringUtils.isNotEmpty(scope) ? scope : window.appConfig.VUE_APP_FACEBOOK_SCOPE;
  }

  async authentication(): Promise<void> {
    try {
      this.loading = true;
      await this.initFacebookSdk(this.fbSDKUrl, this.version, window.appConfig.VUE_APP_FACEBOOK_APP_ID);
      (window as any).FB.login(this.processFacebookResponse, { scope: this.scope, return_scopes: true });
    } catch (e) {
      Log.error('FacebookAuth::authorize::error:', e.message);
      PopupUtils.showError(e.message);
    } finally {
      this.loading = false;
    }
  }

  private async processFacebookResponse(response: FacebookResponse | undefined) {
    try {
      Log.debug('FbAuth::authorize::param::', this.$router.currentRoute);
      validFacebookResponse(response, this.scope);
      this.handlePostMessage(response, this.$router.currentRoute.params.config_type);
    } catch (e) {
      Log.error('FacebookAuth::authorize::error:', e.message);
      this.handleError(e);
    } finally {
      window.close();
      this.loading = false;
    }
  }

  /**
   * @description Init Facebook SDK, if not init, Facebook SDK will not work.
   * @see https://developers.facebook.com/docs/javascript/quickstart
   */
  private initFacebookSdk(sdkUrl: string, version: string, appId: string): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      if ((window as any).FB) {
        resolve();
        return;
      }
      // @ts-ignore
      window.fbAsyncInit = function() {
        try {
          // @ts-ignore
          window.FB.init({
            appId: appId,
            cookie: true, // This is important, it's not enabled by default
            version: version
          });
          resolve();
        } catch (ex) {
          reject(ex);
        }
      };

      try {
        (function(d, s, id) {
          if (d.getElementById(id)) {
            return;
          }
          const fjs: any = d.getElementsByTagName(s)[0];
          const js: any = d.createElement(s);
          js.id = id;
          js.src = sdkUrl;
          fjs.parentNode.insertBefore(js, fjs);
        })(document, 'script', 'facebook-jssdk');
      } catch (ex) {
        reject(ex);
      }
    });
    return promise;
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;

  .fb-auth {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: white;

    .access-fb-btn {
      width: fit-content;
      height: 42px;
      padding: 12px 24px;
    }
  }
}
</style>
