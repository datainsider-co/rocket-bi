import { Geocode } from '../DefinedType';

export class Geolocation {
  code: Geocode;
  name: string;
  normalizedName: string;

  constructor(code: Geocode, name: string, normalizedName: string) {
    this.code = code;
    this.name = name;
    this.normalizedName = normalizedName;
  }

  static fromObject(obj: Geolocation): Geolocation {
    return new Geolocation(obj.code, obj.name, obj.normalizedName);
  }
}
