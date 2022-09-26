import { CsvData, Page } from '@core/domain/Response/Page';
import { AbstractTableResponse } from '@core/domain/Response/Query/AbstractTableResponse';

/**
 * @author andy
 */
export abstract class QueryResponseConverter<R> {
  abstract convert(queryResponse: AbstractTableResponse): R;

  collectAsRecords<I>(queryResponse: AbstractTableResponse, collector: (dataMap: Map<string, any>) => I): I[] {
    const fieldToIndexMap = this.getIndexIdMap(queryResponse);
    return queryResponse.records.map(node => collector(this.getAsMap(node, fieldToIndexMap)));
  }

  getIndexIdMap(queryResponse: AbstractTableResponse): Map<string, number> {
    const entries: [string, number][] = queryResponse.headers.map(header => [header.label, header.key]);
    return new Map<string, number>(entries);
  }

  getAsMap(row: any[], fieldToIndexMap: Map<string, number>): Map<string, any> {
    const result = new Map<string, any>();
    fieldToIndexMap.forEach((index, fieldName) => {
      const value = row[index];

      result.set(fieldName, value);
    });
    return result;
  }
}

export abstract class AbstractTableQueryResponseConverter<I, R> extends QueryResponseConverter<R> {
  convert(queryResponse: AbstractTableResponse): R {
    const records = this.collectAsRecords(queryResponse, this.parseSingleRecord);
    return this.aggregateResult(queryResponse, records);
  }

  protected abstract parseSingleRecord(dataMap: Map<string, any>): I;

  protected abstract aggregateResult(queryResponse: AbstractTableResponse, records: I[]): R;
}

export class DefaultTableQueryResponseConverter extends AbstractTableQueryResponseConverter<Map<string, any>, Page<Map<string, any>>> {
  protected parseSingleRecord(dataMap: Map<string, any>): Map<string, any> {
    return dataMap;
  }

  protected aggregateResult(queryResponse: AbstractTableResponse, records: Map<string, any>[]): Page<Map<string, any>> {
    return new Page<Map<string, any>>(queryResponse.total, records);
  }
}

export class CsvDataQueryResponseConverter extends AbstractTableQueryResponseConverter<Map<string, any>, CsvData> {
  protected parseSingleRecord(dataMap: Map<string, any>): Map<string, any> {
    return dataMap;
  }

  protected aggregateResult(queryResponse: AbstractTableResponse, records: Map<string, any>[]): CsvData {
    const headers = queryResponse.headers.map(column => column.label);
    const csvRecords = records.map(profileDataMap => {
      return headers.map(field => profileDataMap.get(field));
    });

    return new CsvData(headers, queryResponse.total, csvRecords);
  }
}
