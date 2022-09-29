import { RandomUtils } from '@/utils';
import { AndCohortFilter, CohortFilter, CustomerInfo } from '@core/cdp';
import { CohortId, UserGenders } from '@core/common/domain';
import { FilterGroup } from '@/screens/cdp/components/cohort-filter/FilterGroup';

export interface CohortInfoExtraData {
  filterGroup?: FilterGroup[];
}

export class CohortBasicInfo {
  ///Undefined if create cohort
  id: CohortId | undefined;
  organizationId: number;
  name: string;
  description: string;
  // data: number;
  cohortFilter: CohortFilter;
  extraData?: CohortInfoExtraData;

  constructor(id: number | undefined, organizationId: number, name: string, description: string, filter: CohortFilter, extraData?: CohortInfoExtraData) {
    this.id = id;
    this.organizationId = organizationId;
    this.name = name;
    this.description = description;
    // this.data = data;
    this.cohortFilter = filter;
    this.extraData = extraData;
  }

  static default() {
    return new CohortBasicInfo(undefined, 0, '', '', new AndCohortFilter([]), { filterGroup: [] });
  }

  static fromObject(obj: CohortBasicInfo): CohortBasicInfo {
    return new CohortBasicInfo(obj.id, obj.organizationId, obj.name, obj.description, obj.cohortFilter, obj.extraData);
  }
}

// export class CdpCustomerInfo {
//   constructor(
//     public avatar: string,
//     public firstName: string,
//     public fullName: string,
//     public gender: number,
//     public lastName: string,
//     public username: string
//   ) {}
//
//   static fromObject(obj: CdpCustomerInfo): CdpCustomerInfo {
//     return new CdpCustomerInfo(obj.avatar, obj.firstName, obj.fullName, obj.gender, obj.lastName, obj.username);
//   }
// }

export class CohortInfo extends CohortBasicInfo {
  creatorId: string;
  ownerId: string;
  createdTime: number;
  updatedTime: number;
  creator: CustomerInfo | undefined;

  constructor(
    id: number | undefined,
    organizationId: number,
    name: string,
    description: string,
    // data: any,
    filter: CohortFilter,
    creatorId: string,
    ownerId: string,
    createdTime: number,
    updatedTime: number,
    creator: CustomerInfo | undefined,
    extraData?: CohortInfoExtraData
  ) {
    super(id, organizationId, name, description, filter, extraData);
    this.creatorId = creatorId;
    this.ownerId = ownerId;
    this.createdTime = createdTime;
    this.updatedTime = updatedTime;
    this.creator = creator;
  }

  static fromObject(obj: CohortInfo): CohortInfo {
    return new CohortInfo(
      obj.id,
      obj.organizationId,
      obj.name,
      obj.description,
      // obj.data,
      obj.cohortFilter,
      obj.creatorId,
      obj.ownerId,
      obj.createdTime,
      obj.updatedTime,
      obj.creator,
      obj.extraData
    );
  }

  static default() {
    return new CohortInfo(
      undefined,
      1,
      `Cohort ${RandomUtils.nextInt()}`,
      '',
      new AndCohortFilter([]),
      '',
      '',
      +new Date(),
      +new Date(),
      new CustomerInfo('', 'Christopher', 'Christopher Greer', '', '0907889396', 1, UserGenders.Male, `username-${RandomUtils.nextInt()}`)
    );
  }
}
