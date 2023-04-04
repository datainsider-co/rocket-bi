import { ListParentsResponse } from '@core/common/domain/response';
import { Breadcrumbs } from '@/shared/models';
import { ListUtils } from '@/utils/ListUtils';
import { RouterUtils } from '@/utils/RouterUtils';
import router from '@/router/Router';
import { Routers } from '@/shared';

export enum BreadcrumbMode {
  Shortly = 'shortly',
  Fully = 'fully'
}

export class BreadCrumbUtils {
  static isFullyBreadcrumbs(parents: ListParentsResponse | null): boolean {
    if (parents) {
      return ListUtils.getHead(parents.parentDirectories)?.parentId === -1 || parents.parentDirectories.length < 3;
    }
    return false;
  }

  static getBreadcrumbMode(parents: ListParentsResponse | null): BreadcrumbMode {
    if (!parents) {
      return BreadcrumbMode.Fully;
    }
    switch (this.isFullyBreadcrumbs(parents)) {
      case true:
        return BreadcrumbMode.Fully;
      case false:
        return BreadcrumbMode.Shortly;
    }
  }

  static getFullyBreadcrumbs(parents: ListParentsResponse | null, screenName: string): Breadcrumbs[] {
    const parentsWithoutRoot = parents?.parentDirectories.filter(parentDirectory => parentDirectory.parentId > 0);
    return (
      parentsWithoutRoot?.map(
        parentDirectory =>
          new Breadcrumbs({
            text: parentDirectory.name,
            to: {
              name: screenName,
              params: { name: RouterUtils.buildParamPath(parentDirectory.id, parentDirectory.name) },
              query: {
                token: RouterUtils.getToken(router.currentRoute)
              }
            },
            disabled: false
          })
      ) ?? []
    );
  }

  static getShortlyBreadcrumbs(parents: ListParentsResponse | null, screenName: string): Breadcrumbs[] {
    return [this.defaultBreadcrumb()].concat(ListUtils.removeAt(this.getFullyBreadcrumbs(parents, screenName), 0));
  }

  static defaultBreadcrumb(): Breadcrumbs {
    return new Breadcrumbs({
      text: '...',
      to: { name: '' },
      disabled: true
    });
  }
}
