import { UserProfile } from '@core/common/domain';

// export class QueryExecutionLog {
//   query: string;
//   owner: UserProfile;
//   cost: number;
//   createdAt: number;
//
//   constructor(query: string, owner: UserProfile, cost: number, createdAt: number) {
//     this.query = query;
//     this.owner = owner;
//     this.cost = cost;
//     this.createdAt = createdAt;
//   }
//
//   static fromObject(obj: any): QueryExecutionLog {
//     return new QueryExecutionLog(obj.query, UserProfile.fromObject(obj.owner), obj.cost, obj.createdAt);
//   }
// }

export interface QueryExecutionLog {
  query: string;
  owner: {
    username: string;
    fullName: string;
  };
  cost: number;
  createdAt: number;
}
