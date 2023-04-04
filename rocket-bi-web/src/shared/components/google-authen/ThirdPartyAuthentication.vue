<template>
  <div class="d-flex align-items-center h-100 w-100 justify-content-center">
    <component v-if="toComponent" :is="toComponent" />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { ThirdPartyAuthenticationType } from '@/shared/components/google-authen/enum/ThirdPartyAuthenticationType';

const GoogleAuth2 = () => import('@/shared/components/google-authen/GoogleAuthen2.vue');
const FacebookAuth = () => import('@/shared/components/google-authen/FacebookAuth.vue');
const TiktokAuth = () => import('@/shared/components/google-authen/TiktokAuth.vue');

@Component({
  components: { DiButton }
})
export default class ThirdPartyAuthentication extends Vue {
  private static readonly components: Map<ThirdPartyAuthenticationType, Function> = new Map<ThirdPartyAuthenticationType, Function>([
    [ThirdPartyAuthenticationType.GoogleSheet, GoogleAuth2],
    [ThirdPartyAuthenticationType.GA4, GoogleAuth2],
    [ThirdPartyAuthenticationType.GoogleAds, GoogleAuth2],
    [ThirdPartyAuthenticationType.GoogleAnalytic, GoogleAuth2],
    [ThirdPartyAuthenticationType.Facebook, FacebookAuth],
    [ThirdPartyAuthenticationType.TikTok, TiktokAuth]
  ]);

  authType = this.$attrs.config_type as ThirdPartyAuthenticationType;

  private get toComponent(): Function | undefined {
    return ThirdPartyAuthentication.components.get(this.authType) ?? GoogleAuth2;
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

  .access-gg-btn {
    width: fit-content;
  }
}
</style>
