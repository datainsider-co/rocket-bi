<template>
  <div></div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { NavigationGuardNext } from 'vue-router/types/router';
import { AuthenticationModule } from '@/store/modules/authentication.store';
import { Routers } from '@/shared';

@Component
export default class DirectVerify extends Vue {
  async beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>) {
    const rawToken = to.query.token;
    if (typeof rawToken === 'string') {
      const token = decodeURIComponent(rawToken);
      const success = await AuthenticationModule.directVerify(token);
      if (success) {
        next({ name: Routers.AllData });
      } else {
        next({ name: Routers.ResendEmail });
      }
    }
  }
}
</script>
<style></style>
