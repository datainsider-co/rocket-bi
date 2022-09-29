/*
 * @author: tvc12 - Thien Vi
 * @created: 4/6/22, 11:26 AM
 */

import { RangeValue } from '@core/cdp';
import { CohortFilter } from '@core/cdp/domain/cohort/CohortFilter';

export class ListCustomerRequest {
  from: number;
  size: number;
  cohortFilter?: CohortFilter | null;

  constructor(from: number, size: number, cohortFilter?: CohortFilter | null) {
    this.from = from;
    this.size = size;
    this.cohortFilter = cohortFilter;
  }
}

export class UpdateCustomerRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  ownerId: string;

  constructor(id: string, firstName: string, lastName: string, email: string, phoneNumber: string, ownerId: string) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.ownerId = ownerId;
  }
}

export class ListActivitiesRequest {
  id: string;
  eventNames: string[];
  dateRange: RangeValue<number>;
  size: number;
  from: number;

  constructor(id: string, eventNames: string[], dateRange: RangeValue<number>, size: number, from: number) {
    this.id = id;
    this.eventNames = eventNames;
    this.dateRange = dateRange;
    this.size = size;
    this.from = from;
  }
}
