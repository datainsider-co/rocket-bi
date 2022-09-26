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
  @InjectValue(DIKeys.BiClient)
  private httpClient!: BaseClient;

  listAreas(): Promise<GeoArea[]> {
    return this.httpClient.get<GeoArea[]>(`/geolocation/areas`);
  }

  list(geoArea: GeoArea): Promise<Geolocation[]> {
    return this.httpClient.post<Geolocation[]>(`/geolocation/list`, geoArea);
  }
}
