import { Routers } from '@/shared/enums/Routers';
import { Route } from 'vue-router';
import { DIException } from '@core/common/domain/exception';
import { isNumber, isString } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';
import { DataManager } from '@core/common/services';
import router from '@/router/Router';
import { DynamicFilter } from '@core/common/domain';
import { ListUtils } from '@/utils/ListUtils';
import { RawLocation } from 'vue-router/types/router';
//@ts-ignored
import path from 'path';
import { Log } from '@core/utils';
import { IdGenerator } from '@/utils/IdGenerator';
import { AuthenticationModule } from '@/store/modules/AuthenticationStore';

export default class ParamInfo {
  name: string;
  id: string;

  idAsNumber(): number {
    return parseInt(this.id);
  }

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }

  isIdNumber(): boolean {
    const id = this.idAsNumber();
    return isNumber(id) && !isNaN(id);
  }

  toString(): string {
    return `ParamInfo:: id: ${this.id}, name: ${this.name}`;
  }

  static default() {
    return new ParamInfo('', '');
  }
}

export class RouterUtils {
  static readonly routeIgnoreCheckSession = new Set<string>([
    Routers.Login,
    Routers.Signup,
    Routers.ForgotPassword,
    Routers.PasswordRecovery,
    Routers.ResendEmail,
    Routers.DirectVerify
  ]);

  static readonly rootRoute = new Set<string>([Routers.baseRoute]);

  static isRoot(route?: string | null): boolean {
    return RouterUtils.rootRoute.has(route || '');
  }

  static isNotNeedSession(route: string): boolean {
    return RouterUtils.routeIgnoreCheckSession.has(route);
  }

  static ensureDashboardId(route: Route): void {
    const paramInfo = RouterUtils.parseToParamInfo(route.params.name ?? '');
    if (!paramInfo.isIdNumber() || paramInfo.idAsNumber() < 0) {
      throw new DIException('DashboardId invalid');
    }
  }

  static ensureDirectoryIdIsValid(route: Route): void {
    const id = this.getDirectoryId(route);
    if (isNumber(id) && !isNaN(id)) {
      if (id < 0) {
        throw new DIException('DirectoryId invalid');
      }
    } else {
      throw new DIException('DirectoryId not exists');
    }
  }

  static checkTokenIsExist(route: Route): boolean {
    const token = this.getToken(route);
    return isString(token) && StringUtils.isNotEmpty(token);
  }

  static getToken(route: Route): string {
    Log.debug('RouteUtils::getToken::', route.query.token, route.params.token);
    return route.query.token as string;
  }

  /**
   * parse 1 param to param info with pattenr [name]-[id]
   */
  static parseToParamInfo(value: string): ParamInfo {
    if (value) {
      const patternRegex = /(.*)-(.*)|^(\w+)/;
      const groups: string[] = patternRegex.exec(value) ?? [];
      const name = groups[1] ?? '';
      const id = groups[2] ?? groups[3];
      return new ParamInfo(name, id);
    } else {
      return ParamInfo.default();
    }
  }

  static getDirectoryId(route: Route): number {
    return parseInt(route.params.directoryId);
  }

  static isLogin(): boolean {
    return AuthenticationModule.isLoggedIn;
  }

  /**
   * @deprecated move to use RouterUtils.getToken(route: Route)
   */
  static isHaveToken(): boolean {
    return !!DataManager.getToken();
  }

  static async navigateToDataBuilder(route: Route, routerFilters: DynamicFilter[]) {
    const query = RouterUtils.buildDataBuilderQuery(route, routerFilters);
    return router.push({
      name: Routers.ChartBuilder,
      query: query
    });
  }

  static getFilters(route: Route): DynamicFilter[] {
    try {
      const filtersAsString: string = (route.query?.filters || '[]') as string;
      const filters: any[] = JSON.parse(filtersAsString);
      return filters.map(filter => DynamicFilter.fromObject(filter));
    } catch (ex) {
      return [];
    }
  }

  private static buildDataBuilderQuery(route: Route, routerFilters: DynamicFilter[]) {
    if (ListUtils.isNotEmpty(routerFilters)) {
      const filtersAsString = JSON.stringify(routerFilters);
      return {
        ...route.query,
        filters: filtersAsString
      };
    } else {
      delete route.query.filters;
      return route.query;
    }
  }

  static to(name: Routers, routeConfig?: RawLocation): Promise<Route> {
    return router.push({
      name: name,
      ...(routeConfig as any)
    });
  }

  static replace(name: Routers, routeConfig?: RawLocation): Promise<Route> {
    return router.push({
      name: name,
      ...(routeConfig as any)
    });
  }

  static isPathFile(path: string | undefined): path is string {
    return isString(path);
  }

  static parentPath(path: string): string {
    const arrayFolder = path.split('/');
    //remove current folder
    arrayFolder.pop();
    Log.debug('parentPath::', arrayFolder);
    const result = arrayFolder.join('/');
    if (StringUtils.isEmpty(result)) {
      return '/';
    }
    return result;
  }

  /**
   *
   * @param path1
   * @param path2
   * path1 = '/abc/bca/ad/'
   * path2 = '/abc/bca/ad'
   * return true
   */
  static isSamePath(path1: string, path2: string) {
    return path.resolve(path1) === path.resolve(path2);
  }

  static join(...paths: string[]): string {
    return paths.join('/');
  }

  static normalizePath(filePath: string) {
    return path.resolve(filePath);
  }

  static currentFile(path: string) {
    const folderNames = path.split('/');
    return folderNames[folderNames.length - 1];
  }

  static getParentDirectoryName(path: string, defaultName: string) {
    const folderNames = path.split('/');
    folderNames.pop();
    const result = folderNames[folderNames.length - 1];
    if (!result || StringUtils.isEmpty(result)) {
      return defaultName;
    } else {
      return result;
    }
  }

  static nextPath(currentPath: string, fileName: string) {
    return this.normalizePath(currentPath + '/' + fileName);
  }

  static getAbsolutePath(path: string) {
    if (RouterUtils.isWildcardPath(path)) {
      const folders = path.split('/');
      folders.pop(); // remove wildcard
      return RouterUtils.join(...folders);
    } else {
      return path;
    }
  }

  private static isWildcardPath(path: string) {
    Log.debug('WildCard::', path);
    return path.includes('*');
  }

  static isParquetFile(path: string | undefined): boolean {
    return !!path && path.endsWith('.parquet');
  }

  /**
   * build pattern name
   * [name]-[id] => thien-vi-123
   */
  static buildParamPath(id: string | number, name?: string) {
    const prefix = StringUtils.toKebabCase(StringUtils.vietnamese(name ?? ''));
    const suffix = `${id}`;
    return IdGenerator.generateKey([prefix, suffix], '-');
  }
}
