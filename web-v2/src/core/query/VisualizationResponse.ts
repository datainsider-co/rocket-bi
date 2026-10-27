import { asArray, asBoolean, asNumber, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';

/**
 * Responses of `POST chart/query` (v1 `VisualizationResponse`), discriminated by `class_name`. Plain values; record
 * keys are data and stay as the server sent them.
 */

export interface SeriesItem {
  readonly name: string;
  /** One value per x axis category; `null` where a category has no value. */
  readonly data: readonly (number | null)[];
  /** 1 for the dual axis. */
  readonly yAxis?: number;
  readonly stack?: string;
}

/** Column, bar, line, area, KPI (`series_one_response`). */
export interface SeriesOneResponse {
  readonly kind: 'series_one';
  readonly series: readonly SeriesItem[];
  readonly xAxis: readonly string[];
  readonly yAxis: readonly string[];
  /** A number chart's compared value (`compare_responses.RawValues`), when it asked for a comparison. */
  readonly compareValue?: number;
}

/** Pie and other name/value charts (`series_two_response`): each point is `[name, value]`. */
export interface SeriesTwoResponse {
  readonly kind: 'series_two';
  readonly series: readonly { readonly name: string; readonly data: readonly (readonly [string, number])[] }[];
  readonly total: number;
}

/** Rows as arrays (`viz_table_response`), used by filters. */
export interface TableResponse {
  readonly kind: 'table';
  readonly headers: readonly string[];
  readonly records: readonly (readonly unknown[])[];
  readonly total: number;
}

export interface TableHeader {
  /** Key of the header's cell in each record. */
  readonly key: string;
  readonly label: string;
  readonly isGroupBy: boolean;
  readonly isTextLeft: boolean;
  readonly formatterKey: string;
  /** Grouped headers (pivot, breakdown); leaves have none. */
  readonly children: readonly TableHeader[];
}

/** Rows as objects keyed by header key (`json_table_response`): tables. */
export interface JsonTableResponse {
  readonly kind: 'json_table';
  readonly headers: readonly TableHeader[];
  readonly records: readonly JsonObject[];
  readonly total: number;
}

export interface UnsupportedResponse {
  readonly kind: 'unsupported';
  readonly className: string;
}

export type VisualizationResponse = SeriesOneResponse | SeriesTwoResponse | TableResponse | JsonTableResponse | UnsupportedResponse;

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function seriesItemFromJson(value: unknown): SeriesItem {
  const json = asRecord(value);
  return {
    name: asString(json['name']),
    data: asArray(json['data']).map(toNullableNumber),
    ...(typeof json['y_axis'] === 'number' && { yAxis: json['y_axis'] }),
    ...(typeof json['stack'] === 'string' && { stack: json['stack'] })
  };
}

function tableHeaderFromJson(value: unknown): TableHeader {
  const json = asRecord(value);
  return {
    key: String(json['key'] ?? ''),
    label: asString(json['label']),
    isGroupBy: asBoolean(json['is_group_by']),
    isTextLeft: asBoolean(json['is_text_left']),
    formatterKey: asString(json['formatter_key']),
    children: asArray(json['children']).map(tableHeaderFromJson)
  };
}

/** The first value of the raw compared response; the server keys it by the PascalCase mode. */
function compareValueOf(value: unknown): { compareValue?: number } {
  const series = asArray(asRecord(asRecord(value)['RawValues'])['series'])[0];
  const compared = toNullableNumber(asArray(asRecord(series)['data'])[0]);
  return compared === null ? {} : { compareValue: compared };
}

function stringList(value: unknown): string[] {
  return asArray(value).map(item => String(item));
}

export function visualizationResponseFromJson(value: unknown): VisualizationResponse {
  const json = asRecord(value);
  const className = asString(json['class_name']);
  switch (className) {
    case 'series_one_response':
      return {
        kind: 'series_one',
        series: asArray(json['series']).map(seriesItemFromJson),
        xAxis: stringList(json['x_axis']),
        yAxis: stringList(json['y_axis']),
        ...compareValueOf(json['compare_responses'])
      };
    case 'series_two_response':
      return {
        kind: 'series_two',
        series: asArray(json['series']).map(item => {
          const series = asRecord(item);
          return {
            name: asString(series['name']),
            data: asArray(series['data']).map(point => {
              const [name, y] = asArray(point);
              return [String(name ?? ''), asNumber(y)] as const;
            })
          };
        }),
        total: asNumber(json['total'])
      };
    case 'viz_table_response':
      return {
        kind: 'table',
        headers: stringList(json['headers']),
        records: asArray(json['records']).map(asArray),
        total: asNumber(json['total'], asArray(json['records']).length)
      };
    case 'json_table_response':
      return {
        kind: 'json_table',
        headers: asArray(json['headers']).map(tableHeaderFromJson),
        records: asArray(json['records']).filter(isRecord),
        total: asNumber(json['total'], asArray(json['records']).length)
      };
    default:
      return { kind: 'unsupported', className };
  }
}
