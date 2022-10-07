import { ResourceType } from '@/utils/PermissionUtils';
import { RouterUtils } from '@/utils/RouterUtils';

export abstract class UrlUtils {
  static getFullUrl(path: string): string {
    const staticHost = window.appConfig.VUE_APP_STATIC_API_URL;
    return staticHost + path;
  }

  static getFullMediaUrl(path: string): string {
    const staticHost = window.appConfig.VUE_APP_LAKE_API_URL;
    return `${staticHost}/file/view/media?path=${path}`;
  }

  static createLinkShare(type: ResourceType, id: string, token: string, name?: string) {
    const paramPath = RouterUtils.buildParamPath(id, name);
    switch (type) {
      case ResourceType.directory:
        return `${window.location.origin}/shared/${paramPath}?token=${token}`;
      default:
        return `${window.location.origin}/${type}/${paramPath}?token=${token}`;
    }
  }

  static createDashboardEmbedCode(dashboardId: string, token: string) {
    const source = `${window.location.origin}/embedded/dashboard/${dashboardId}?token=${token}`;
    return `<iframe
        id="datainsider-dashboard-iframe"
        width="1280"
        height="720"
        src="${source}"
        title="Data Insider Dashboard"
        frameborder="0"
       ></iframe>`;
  }

  static getDownloadURL(path: string) {
    const staticHost = window.appConfig.VUE_APP_LAKE_API_URL;
    return `${staticHost}/file/download?path=${path}`;
  }
}
