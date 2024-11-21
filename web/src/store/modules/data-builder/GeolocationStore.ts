import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';
import { Geolocation } from '@core/common/domain/model/geolocation/Geolocation';
import { Inject } from 'typescript-ioc';
import { GeolocationService } from '@core/common/services';
import { MapResponse } from '@core/common/domain/response';
import { ChartInfo, MapQuerySetting, QueryRelatedWidget, QuerySettingClassName, WidgetId } from '@core/common/domain/model';
import { JsonUtils, Log } from '@core/utils';
import { GeoArea } from '@core/common/domain/model/geolocation/GeoArea';
import { HighchartUtils } from '@/utils';

@Module({ store: store, name: Stores.GeolocationStore, dynamic: true, namespaced: true })
class GeolocationStore extends VuexModule {
  areaAsMap: Map<string, GeoArea> = new Map<string, GeoArea>();
  areaAndCodePrefixAsMap: Map<string, GeoArea> = new Map<string, GeoArea>();
  geolocationAsMap: Map<string, Geolocation[]> = new Map<string, Geolocation[]>();
  areaSelected: string | null = null;
  locationMatchedAsMap: Map<string, string> = new Map<string, string>();
  //Lưu đường dẫn của Map và MapObject sau khi được get lên để cache tránh nặng phần xử lí do phải get nhiều lần
  pathToMapDataAsMap: Map<string, any> = new Map<string, any>();

  @Inject
  private readonly geoService!: GeolocationService;

  @Action({ commit: 'saveArea' })
  async init(): Promise<GeoArea[]> {
    const areas: GeoArea[] = await this.geoService.listAreas();
    const areaSelected = areas.find(area => area.zoneLvl === 1) ?? areas[0];
    this.saveCurrentArea(areaSelected.mapUrl);
    await this.loadListGeolocation(areaSelected);
    return areas;
  }

  @Mutation
  saveArea(areas: GeoArea[]): void {
    this.areaAsMap = new Map(areas.map(area => [area.mapUrl, area]));
    this.areaAndCodePrefixAsMap = new Map(areas.map(area => [area.codePrefix, area]));
  }

  @Mutation
  saveCurrentArea(area: string): void {
    this.areaSelected = area;
  }

  @Action
  async loadListGeolocationWithCode(payload: { code: string }): Promise<Geolocation[]> {
    const { code } = payload;
    const area = this.areaAsMap.get(code);
    const hasGeolocation = this.geolocationAsMap.has(code ?? '');
    if (area && !hasGeolocation) {
      return this.loadListGeolocation(area);
    } else if (area && hasGeolocation) {
      return Promise.resolve(this.geolocationAsMap.get(code!)!);
    } else {
      return Promise.resolve([]);
    }
  }

  @Action
  async loadListGeolocation(area: GeoArea): Promise<Geolocation[]> {
    const list = await this.geoService.list(area);
    this.saveGeolocation({ code: area.mapUrl, locations: list });
    return list;
  }

  @Action
  async loadGeolocationFromWidget(widget: ChartInfo): Promise<void> {
    if (MapQuerySetting.isMapQuery(widget.setting)) {
      const hasGeoArea: boolean = widget.setting.geoArea != undefined;
      if (hasGeoArea) {
        const normalizeObject = JsonUtils.fromPureJson((widget.setting as MapQuerySetting).normalizedNameMap);
        this.setNormalizedName(new Map(Object.entries(normalizeObject)));
        this.saveCurrentArea((widget.setting as MapQuerySetting).geoArea!.mapUrl);
        await this.loadListGeolocationWithCode({ code: (widget.setting as MapQuerySetting).geoArea!.mapUrl });
      }
    }
  }

  @Action
  async processGeolocationFromWidgets(widgets: QueryRelatedWidget[]) {
    widgets.forEach(widget => {
      this.loadMapDataFromWidget(widget);
    });
  }

  @Mutation
  async loadMapDataFromWidget(widget: QueryRelatedWidget) {
    if (MapQuerySetting.isMapQuery(widget.setting)) {
      Log.debug('loadMapDataFromWidget', widget.setting);
      const path: string | undefined = widget.setting.geoArea?.mapUrl;
      if (path && !this.pathToMapDataAsMap.has(path)) {
        const mapData = await HighchartUtils.initMapData(path);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        GeolocationModule.saveMapData({ mapUrl: path, mapData: mapData });
      }
    }
  }

  @Mutation
  saveGeolocation(payload: { code: string; locations: Geolocation[] }): void {
    const { code, locations } = payload;
    this.geolocationAsMap.set(code, locations);
  }

  @Mutation
  setNormalizedName(normalizeMap: Map<string, string>): void {
    this.locationMatchedAsMap = new Map(normalizeMap);
  }

  @Mutation
  updateLocationMatching(payload: { key: string; value: string }): void {
    const { key, value } = payload;
    this.locationMatchedAsMap.set(key, value);
  }

  @Mutation
  initNormalizeName(data: MapResponse): void {
    this.locationMatchedAsMap = new Map(data.unknownData.map(unknownData => [unknownData.name, unknownData.code]));
  }

  @Mutation
  private saveMapData(payload: { mapUrl: string; mapData: any }) {
    this.pathToMapDataAsMap.set(payload.mapUrl, payload.mapData);
  }

  @Mutation
  reset(): void {
    this.geolocationAsMap.clear();
    this.areaSelected = null;
    this.areaAsMap.clear();
    this.areaAndCodePrefixAsMap.clear();
    this.locationMatchedAsMap.clear();
    this.pathToMapDataAsMap.clear();
  }

  get getMapData(): (mapUrl: string, orElse?: any) => any | undefined {
    return mapUrl => {
      return this.pathToMapDataAsMap.has(mapUrl) ? this.pathToMapDataAsMap.get(mapUrl) : void 0;
    };
  }

  get getGeoArea(): (displayName: string) => GeoArea | undefined {
    return name => {
      return this.areaAndCodePrefixAsMap.get(name);
    };
  }
}

export const GeolocationModule: GeolocationStore = getModule(GeolocationStore);
