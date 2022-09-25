import { RouterEnteringHook } from '@/shared/components/VueHook/RouterEnteringHook';
import { NavigationGuardNext } from 'vue-router/types/router';
import { Route } from 'vue-router';
import { Component, Vue } from 'vue-property-decorator';
import { RouterUtils } from '@/utils/RouterUtils';
import { Routers } from '@/shared';
import { RouterLeavingHook } from '@/shared/components/VueHook/RouterLeavingHook';

// @ts-ignore
@Component
export class LoggedInScreen extends Vue implements RouterEnteringHook, RouterLeavingHook {
  beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>): void {
    if (RouterUtils.isLogin()) {
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
