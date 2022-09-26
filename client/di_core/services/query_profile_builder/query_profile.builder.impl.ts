import {
  Avg,
  Field,
  FieldRelatedFunction,
  FilterWidget,
  GetArrayElement,
  InlineSqlView,
  Max,
  Min,
  OrderBy,
  Select,
  SelectDistinct,
  TableColumn,
  TableQueryChartSetting
} from '@core/domain/Model';
import { FilterRequest, QueryRequest, SortDirection } from '@core/domain/Request';
import { QueryProfileBuilder } from './query_profile.builder';
import { FieldDetailInfo } from '@core/domain/Model/Function/FieldDetailInfo';

export class QueryProfileBuilderImpl extends QueryProfileBuilder {
  private static buildFunctionByCreatorFn(profileField: FieldDetailInfo, creatorFn: (field: Field) => FieldRelatedFunction): FieldRelatedFunction {
    const fn = creatorFn(profileField.field);
    if (profileField.isNested) {
      if (fn.scalarFunction) {
        fn.scalarFunction.withScalarFunction(new GetArrayElement());
      } else {
        fn.setScalarFunction(new GetArrayElement());
      }
    }
    return fn;
  }

  private static buildMinMaxAvgFunction(profileField: FieldDetailInfo): FieldRelatedFunction[] {
    const minFunction = QueryProfileBuilderImpl.buildFunctionByCreatorFn(profileField, field => new Min(field));
    const maxFunction = QueryProfileBuilderImpl.buildFunctionByCreatorFn(profileField, field => new Max(field));
    const avgFunction = QueryProfileBuilderImpl.buildFunctionByCreatorFn(profileField, field => new Avg(field));
    return [minFunction, maxFunction, avgFunction];
  }

  private static buildMinMaxAvgColumns(fieldRelatedFunctions: FieldRelatedFunction[]): TableColumn[] {
    return fieldRelatedFunctions.map((fn, index) => {
      return new TableColumn(index.toString(), fn, false, false, true);
    });
  }

  buildTableQuerySetting(profileFields: FieldDetailInfo[]): TableQueryChartSetting {
    const columns = this.buildTableColumns(profileFields);
    const querySetting = new TableQueryChartSetting(columns);
    querySetting.sqlViews = profileFields.map(field => field.sqlView).filter((sqlView): sqlView is InlineSqlView => !!sqlView);
    return querySetting;
  }

  buildQueryForStringData(profileFields: FieldDetailInfo[]): TableQueryChartSetting {
    const columns = this.buildTableColumnsForStringData(profileFields);
    const sorts = columns.map(column => new OrderBy(column.function, SortDirection.Asc));
    const sqlViews = profileFields.map(field => field.sqlView).filter((sqlView): sqlView is InlineSqlView => !!sqlView);
    const useBoost = false;
    const refreshBoost = false;
    return new TableQueryChartSetting(columns, [], sorts, void 0, [], sqlViews);
  }

  buildFunctions(profileFields: FieldDetailInfo[]): FieldRelatedFunction[] {
    return profileFields.map(this.buildFunction);
  }

  buildFunction(profileField: FieldDetailInfo): FieldRelatedFunction {
    return QueryProfileBuilderImpl.buildFunctionByCreatorFn(profileField, field => new Select(field));
  }

  buildFilterRequest(filter: FilterWidget): FilterRequest | undefined {
    return filter.toFilterRequest();
  }

  buildFilterRequests(filters: FilterWidget[]): FilterRequest[] {
    return filters.map(this.buildFilterRequest).filter((maybeFilter): maybeFilter is FilterRequest => maybeFilter instanceof FilterRequest);
  }

  buildQueryMinMaxAvgRequest(profileField: FieldDetailInfo, dashboardId?: number): QueryRequest {
    const functions: FieldRelatedFunction[] = QueryProfileBuilderImpl.buildMinMaxAvgFunction(profileField);
    const columns = QueryProfileBuilderImpl.buildMinMaxAvgColumns(functions);
    const tableQuery = new TableQueryChartSetting(columns);
    if (profileField.sqlView) {
      tableQuery.sqlViews = [profileField.sqlView];
    }
    return QueryRequest.fromQuery(tableQuery, -1, -1, dashboardId);
  }

  private buildTableColumns(profileFields: FieldDetailInfo[]): TableColumn[] {
    return profileFields.map((profileField: FieldDetailInfo) => {
      const func = this.buildFunction(profileField);
      return new TableColumn(profileField.displayName, func, false, false, true);
    });
  }

  private buildTableColumnsForStringData(profileFields: FieldDetailInfo[]): TableColumn[] {
    return profileFields.map(profileField => {
      const func = QueryProfileBuilderImpl.buildFunctionByCreatorFn(profileField, field => new SelectDistinct(profileField.field));
      return new TableColumn(profileField.displayName, func, false, false, true);
    });
  }
}
