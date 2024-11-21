import { RouterEnteringHook } from '@/shared/components/vue-hook/RouterEnteringHook';
import { NavigationGuardNext } from 'vue-router/types/router';
import { Route } from 'vue-router';
import { Component, Vue } from 'vue-property-decorator';
import { RouterUtils } from '@/utils/RouterUtils';
import { Routers } from '@/shared';
import { RouterLeavingHook } from '@/shared/components/vue-hook/RouterLeavingHook';
import { Log } from '@core/utils';

// @ts-ignore
@Component
export class AccessibleScreen extends Vue implements RouterEnteringHook, RouterLeavingHook {
  beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>): void {
    if (RouterUtils.isLogin() || RouterUtils.getToken(to)) {
      next();
    } else {
      next({ name: Routers.Login });
    }
  }

  beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>): void {
    //todo: override
    next();
  }
}
