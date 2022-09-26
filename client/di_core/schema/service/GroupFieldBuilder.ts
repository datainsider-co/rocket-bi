/*
 * @author: tvc12 - Thien Vi
 * @created: 3/30/21, 11:46 AM
 */

import { GroupedField } from '@/shared';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';
import { FieldFilter } from '@core/schema/service/FieldFilter';
import { DefaultMethodFieldSorting, MethodFieldSorting } from '@core/schema/service/MethodFieldSorting';

export class GroupFieldBuilder {
  private readonly filters: FieldFilter[] = [];
  private fields: FieldDetailInfo[] = [];
  private keyword?: string;
  private methodSorting: MethodFieldSorting = new DefaultMethodFieldSorting();

  constructor(fields: FieldDetailInfo[]) {
    this.fields = fields;
  }

  addFilter(filter: FieldFilter): GroupFieldBuilder {
    this.filters.push(filter);
    return this;
  }

  withFields(fields: FieldDetailInfo[]): GroupFieldBuilder {
    this.fields = fields;
    return this;
  }

  withTextSearch(keyword: string): GroupFieldBuilder {
    this.keyword = keyword;
    return this;
  }

  withMethodSorting(method: MethodFieldSorting): GroupFieldBuilder {
    this.methodSorting = method;
    return this;
  }

  build(): GroupedField[] {
    const groups: GroupedField[] = [];
    const groupsAsMap: Map<string, FieldDetailInfo[]> = this.genGroupFields();
    this.fields.forEach((field: FieldDetailInfo) => {
      for (let index = 0; index < this.filters.length; ++index) {
        const filter = this.filters[index];
        if (filter.isPass(field, this.keyword)) {
          const group: FieldDetailInfo[] | undefined = groupsAsMap.get(filter.getName());
          if (group) {
            group.push(field);
          }
          break;
        }
      }
    });

    groupsAsMap.forEach((groupDetails, title) => {
      groups.push({
        groupTitle: title,
        children: this.methodSorting.sort(groupDetails)
      });
    });

    return groups;
  }

  private genGroupFields(): Map<string, FieldDetailInfo[]> {
    const nameAndFields: [string, FieldDetailInfo[]][] = this.filters.map(filter => {
      return [filter.getName(), []];
    });
    return new Map<string, FieldDetailInfo[]>(nameAndFields);
  }
}
