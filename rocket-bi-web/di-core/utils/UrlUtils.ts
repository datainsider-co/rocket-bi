import { ResourceType } from '@/utils/PermissionUtils';
import { RouterUtils } from '@/utils/RouterUtils';
import { Log } from '@core/utils/Log';
import FileSaver from 'file-saver';

export abstract class UrlUtils {
  static getFullUrl(path: string): string {
    const staticHost = window.appConfig.VUE_APP_STATIC_FILE_URL;
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
      case ResourceType.query:
        return `${window.location.origin}/data-warehouse/query-editor?token=${token}&adhoc=${id}`;
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
        title="RocketBI Dashboard"
        frameborder="0"
       ></iframe>`;
  }

  static getDownloadURL(path: string) {
    const staticHost = window.appConfig.VUE_APP_LAKE_API_URL;
    return `${staticHost}/file/download?path=${path}`;
  }

  static getStaticImageUrl(path: string): string {
    const domain = window.appConfig.VUE_APP_STATIC_DOMAIN || window.location.origin;
    const mediaPath = window.appConfig.VUE_APP_STATIC_MEDIA_PATH || '';
    // ensure path does not start with '/'
    const endPath = path.startsWith('/') ? path.substring(1) : path;
    return `${domain}/${mediaPath}/${endPath}`;
  }

  static getFileName(url: string): string {
    return url.substring(url.lastIndexOf('/') + 1);
  }
}
