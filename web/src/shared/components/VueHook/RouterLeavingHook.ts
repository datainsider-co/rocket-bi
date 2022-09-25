import { NavigationGuardNext, Route } from 'vue-router/types/router';

export abstract class RouterLeavingHook {
  abstract beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext<any>): void;
}
