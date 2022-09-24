import { InjectValue } from 'typescript-ioc';

import { Geolocation } from '@core/domain/Model/Geolocation/Geolocation';
import { DIKeys } from '@core/modules/di';
import { BaseClient } from '@core/services/base.service';
import { GeoArea } from '@core/domain/Model/Geolocation/GeoArea';

export abstract class GeolocationRepository {
  abstract listAreas(): Promise<GeoArea[]>;

  abstract list(geoArea: GeoArea): Promise<Geolocation[]>;
}

export class HttpGeolocationRepository extends GeolocationRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;
  private apiPath = '/geolocation';

  listAreas(): Promise<GeoArea[]> {
    return this.httpClient.get<GeoArea[]>(`${this.apiPath}/areas`);
  }

  list(geoArea: GeoArea): Promise<Geolocation[]> {
    return this.httpClient.post<Geolocation[]>(`${this.apiPath}/list`, geoArea);
  }
}
