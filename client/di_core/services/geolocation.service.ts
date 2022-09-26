import { Inject } from 'typescript-ioc';

import { GeolocationRepository } from '../repositories';
import { Geolocation } from '@core/domain/Model/Geolocation/Geolocation';
import { GeoArea } from '@core/domain/Model/Geolocation/GeoArea';

export abstract class GeolocationService {
  abstract listAreas(): Promise<GeoArea[]>;

  abstract list(geoArea: GeoArea): Promise<Geolocation[]>;
}

export class GeolocationServiceImpl extends GeolocationService {
  constructor(@Inject private repo: GeolocationRepository) {
    super();
  }

  listAreas(): Promise<GeoArea[]> {
    return this.repo.listAreas();
  }

  list(geoArea: GeoArea): Promise<Geolocation[]> {
    return this.repo.list(geoArea);
  }
}
