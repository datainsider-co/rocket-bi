import { asArray, asNumber, asRecord, withoutUndefined, type JsonObject } from '@/core/json/json';

export const SortOrder = {
  Asc: 'ASC',
  Desc: 'DESC'
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

/** `field` is a backend column name (snake_case), not a JSON key: the server puts it in `ORDER BY` as is. */
export interface Sort<Field extends string = string> {
  readonly field: Field;
  readonly order: SortOrder;
}

/** A page request, the body of the backend's `ListingRequest` (`from`, `size`, `keyword`, `sorts`). */
export interface ListingRequest<Field extends string = string> {
  readonly from: number;
  readonly size: number;
  readonly keyword?: string | undefined;
  readonly sorts?: readonly Sort<Field>[] | undefined;
}

/** A page of results: `data` and the `total` matching the request. */
export interface ListingPage<T> {
  readonly total: number;
  readonly data: readonly T[];
}

export function listingRequestToJson({ from, size, keyword, sorts }: ListingRequest): JsonObject {
  return withoutUndefined({
    from,
    size,
    keyword: keyword || undefined,
    sorts: sorts?.map(({ field, order }) => ({ field, order }))
  });
}

export function listingPageFromJson<T>(value: unknown, parseItem: (json: unknown) => T): ListingPage<T> {
  const json = asRecord(value);
  return { total: asNumber(json['total']), data: asArray(json['data']).map(parseItem) };
}
