import { NavigationGuardNext, Route } from 'vue-router/types/router';

export abstract class RouterEnteringHook {
  abstract beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<any>): void;
}
