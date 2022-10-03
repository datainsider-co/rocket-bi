/*
 * @author: tvc12 - Thien Vi
 * @created: 4/6/22, 11:31 AM
 */

import { RandomUtils } from '@/utils';

export class CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob?: number | null;
  gender?: number | null;
  properties?: any | null;

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`;
  }

  constructor(
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    dob?: number | null,
    gender?: number | null,
    properties?: any | null
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.dob = dob;
    this.gender = gender;
    this.properties = properties;
  }

  static fromObject(obj: any): CustomerInfo {
    return new CustomerInfo(obj.id, obj.firstName, obj.lastName, obj.email, obj.phoneNumber, obj.dob, obj.gender, obj.properties);
  }

  static default(): CustomerInfo {
    return new CustomerInfo(RandomUtils.nextString(), '', '', 'tvc12@email.com', '09078899');
  }
}

export class CustomerEvent {
  timestamp: number;
  customerId: string;
  sessionId: string;
  screenName: string;
  eventName: string;
  duration: number;

  constructor(timestamp: number, customerId: string, sessionId: string, screenName: string, eventName: string, duration: number) {
    this.timestamp = timestamp;
    this.customerId = customerId;
    this.sessionId = sessionId;
    this.screenName = screenName;
    this.eventName = eventName;
    this.duration = duration;
  }

  static fromObject(obj: any) {
    return new CustomerEvent(obj.timestamp, obj.customerId, obj.sessionId, obj.screenName, obj.eventName, obj.duration);
  }
}
