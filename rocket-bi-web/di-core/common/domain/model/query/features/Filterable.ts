import { TableColumn } from '@core/common/domain/model';
import { isFunction } from 'lodash';

export abstract class Filterable {
  abstract getFilter(): TableColumn;

  static isFilterable(query: any & Filterable): query is Filterable {
    return query && isFunction(query.getFilter);
  }
}
