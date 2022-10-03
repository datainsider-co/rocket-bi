/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:34 PM
 */

import { Geocode } from '@core/common/domain/model';

export class GeoArea {
  name: string;
  displayName: string;
  codePrefix: Geocode;
  zoneLvl: number;
  mapUrl: string;

  constructor(name: string, displayName: string, codePrefix: string, zoneLvl: number, mapUrl: string) {
    this.name = name;
    this.displayName = displayName;
    this.codePrefix = codePrefix;
    this.zoneLvl = zoneLvl;
    this.mapUrl = mapUrl;
  }

  static fromObject(obj: GeoArea): GeoArea {
    return new GeoArea(obj.name, obj.displayName, obj.codePrefix, obj.zoneLvl, obj.mapUrl);
  }
}
