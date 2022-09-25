export enum DataType {
  Int = 'Int',
  Long = 'Long',
  Double = 'Double',
  String = 'String',
  Date = 'Date',
  DateTime = 'DateTime',
  Boolean = 'Boolean'
}

export enum PropertyType {
  EventProperty = 'EventProperty',
  CustomerProperty = 'CustomerProperty'
}

type PropertyId = string;

export class PropertyInfo {
  propertyId: PropertyId;
  propertyType: PropertyType;
  propertyName: string;

  constructor(propertyId: PropertyId, propertyType: PropertyType, propertyName: string) {
    this.propertyId = propertyId;
    this.propertyType = propertyType;
    this.propertyName = propertyName;
  }
}

export class PropertyValue {
  propertyId: PropertyId;
  propertyType: PropertyType;
  propertyName: string;

  constructor(propertyId: PropertyId, propertyType: PropertyType, propertyName: string) {
    this.propertyId = propertyId;
    this.propertyType = propertyType;
    this.propertyName = propertyName;
  }
}
