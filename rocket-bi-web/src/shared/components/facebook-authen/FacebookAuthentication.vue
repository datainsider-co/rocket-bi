<template>
  <div class="d-flex align-items-center h-100 w-100 justify-content-center">
    <DiButton class="access-fb-btn" primary title="Access to Facebook Account" @click="onLogin">
      <i v-if="loading" class="fa fa-spin fa-spinner"></i>
      <img v-else src="@/assets/icon/ic_google.svg" />
    </DiButton>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log } from '@core/utils';

@Component({ components: { DiButton } })
export default class FacebookAuthentication extends Vue {
  private loading = false;

  async initFacebookClient() {
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId: '1371850590286877',
        cookie: true, // This is important, it's not enabled by default
        version: 'v13.0'
      });
      // jQuery(document).trigger('FBSDKLoaded');
    };
  }

  async loginFacebook(callback: (response: any) => void) {
    (window as any).FB.login(callback, { scope: window.appConfig.VUE_APP_FACEBOOK_SCOPE });
  }

  private async onLogin() {
    this.loading = true;
    await this.initFacebookClient();
    await this.loginFacebook(this.handleFacebookLogin);
    this.loading = false;
  }

  private handleFacebookLogin(response: any) {
    Log.debug('handleFacebookLogin::', response);
    const targetOrigin = this.$route.query.redirect;
    window.opener.postMessage(
      {
        authResponse: response
      },
      targetOrigin
    );
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;

  .access-fb-btn {
    width: fit-content;
  }
}
</style>
