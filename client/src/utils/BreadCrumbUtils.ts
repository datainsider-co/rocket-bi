import { ListParentsResponse } from '@core/domain/Response';
import { Breadcrumbs } from '@/shared/models';
import { ListUtils } from '@/utils/list.utils';
import { RouterUtils } from '@/utils/RouterUtils';
import router from '@/router/router';

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

  static getFullyBreadcrumbs(parents: ListParentsResponse | null): Breadcrumbs[] {
    const parentsWithoutRoot = parents?.parentDirectories.filter(parentDirectory => parentDirectory.parentId > 0);
    return (
      parentsWithoutRoot?.map(
        parentDirectory =>
          new Breadcrumbs({
            text: parentDirectory.name,
            to: {
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

  static getShortlyBreadcrumbs(parents: ListParentsResponse | null): Breadcrumbs[] {
    return [this.defaultBreadcrumb()].concat(ListUtils.removeAt(this.getFullyBreadcrumbs(parents), 0));
  }

  static defaultBreadcrumb(): Breadcrumbs {
    return new Breadcrumbs({
      text: '...',
      to: { name: '' },
      disabled: true
    });
  }
}
