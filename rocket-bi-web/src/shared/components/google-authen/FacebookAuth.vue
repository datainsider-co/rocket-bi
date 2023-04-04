<template>
  <DiButton class="access-gg-btn" primary title="Access to Facebook Account" @click="authentication">
    <i v-if="loading" class="fa fa-spin fa-spinner"></i>
    <img v-else alt="" height="16" width="16" src="https://static.xx.fbcdn.net/rsrc.php/v3/yq/r/_9VQFvOk7ZC.png" />
  </DiButton>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { AuthView } from '@/shared/components/google-authen/AuthView';
import { PopupUtils, StringUtils } from '@/utils';
import { Log } from '@core/utils';
import { FacebookResponse, validFacebookResponse } from '@/shared/components/facebook-authen/FacebookResponse';
import { Inject } from 'typescript-ioc';
import { DataSourceService } from '@core/common/services/DataSourceService';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';

@Component({ components: {} })
export default class FacebookAuth extends AuthView {
  private loading = false;
  @Inject
  private readonly dataSourceService!: DataSourceService;
  authType = this.$attrs.config_type as ThirdPartyAuthenticationType;

  private get scope(): string {
    const scope = this.$route.query.scope as string;
    return StringUtils.isNotEmpty(scope) ? scope : window.appConfig.VUE_APP_FACEBOOK_SCOPE;
  }

  async authentication(): Promise<void> {
    this.loading = true;
    (window as any).FB.login(this.processFacebookResponse, { scope: this.scope, return_scopes: true });
    this.loading = false;
    // try {
    // } catch (e) {
    //   Log.error('FacebookAuth::authorize::error:', e.message);
    //   window.opener.postMessage({ error: e.message }, '*');
    //   PopupUtils.showError(e.message);
    // } finally {
    //   window.close();
    //   this.loading = false;
    // }
  }

  private async processFacebookResponse(response: FacebookResponse | undefined) {
    try {
      Log.debug('FbAuth::authorize::param::', this.$router.currentRoute);
      validFacebookResponse(response, this.scope);
      const tokenResponse = await this.dataSourceService.getFacebookExchangeToken(response!.authResponse!.accessToken);
      this.handlePostMessage(tokenResponse, this.$router.currentRoute.params.config_type);
    } catch (e) {
      Log.error('FacebookAuth::authorize::error:', e.message);
      this.handleError(e);
    } finally {
      window.close();
      this.loading = false;
    }
  }
}
</script>

<style lang="scss" scoped></style>
