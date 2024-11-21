<template>
  <div class="d-flex align-items-center h-100 w-100 justify-content-center">
    <component v-if="toComponent" :is="toComponent" :authType="authType" />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import DiButton from '@/shared/components/common/DiButton.vue';
import { ThirdPartyType } from '@/shared/components/third-party-authentication/ThirdPartyType';

const GoogleAuth2 = () => import('@/shared/components/third-party-authentication/google/GoogleAuth2.vue');
const FacebookAuth = () => import('@/shared/components/third-party-authentication/fb/FacebookAuth.vue');
const TiktokAuth = () => import('@/shared/components/third-party-authentication/tiktok/TiktokAuth.vue');

@Component({
  components: { DiButton }
})
export default class ThirdPartyAuthentication extends Vue {
  private static readonly components: Map<ThirdPartyType, Function> = new Map<ThirdPartyType, Function>([
    [ThirdPartyType.GoogleSheet, GoogleAuth2],
    [ThirdPartyType.GA4, GoogleAuth2],
    [ThirdPartyType.GoogleAds, GoogleAuth2],
    [ThirdPartyType.GoogleAnalytic, GoogleAuth2],
    [ThirdPartyType.GoogleSearchConsole, GoogleAuth2],
    [ThirdPartyType.Facebook, FacebookAuth],
    [ThirdPartyType.TikTok, TiktokAuth]
  ]);

  private get authType(): ThirdPartyType {
    return this.$attrs.config_type as ThirdPartyType;
  }

  private get toComponent(): Function | undefined {
    return ThirdPartyAuthentication.components.get(this.authType) ?? GoogleAuth2;
  }
}
</script>
