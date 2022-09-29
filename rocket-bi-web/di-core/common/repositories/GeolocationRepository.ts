import { InjectValue } from 'typescript-ioc';

import { Geolocation } from '@core/common/domain/model/geolocation/Geolocation';
import { DIKeys } from '@core/common/modules/Di';
import { BaseClient } from '@core/common/services/HttpClient';
import { GeoArea } from '@core/common/domain/model/geolocation/GeoArea';

export abstract class GeolocationRepository {
  abstract listAreas(): Promise<GeoArea[]>;

  abstract list(geoArea: GeoArea): Promise<Geolocation[]>;
}

export class HttpGeolocationRepository extends GeolocationRepository {
  @InjectValue(DIKeys.BiClient)
  private httpClient!: BaseClient;

  listAreas(): Promise<GeoArea[]> {
    return this.httpClient.get<GeoArea[]>(`/geolocation/areas`);
  }

  list(geoArea: GeoArea): Promise<Geolocation[]> {
    return this.httpClient.post<Geolocation[]>(`/geolocation/list`, geoArea);
  }
}
