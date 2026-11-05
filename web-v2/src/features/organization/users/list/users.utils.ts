import type { UserSearch } from '@/core/admin/UserAdminService';
import { SortOrder, type Sort } from '@/core/listing/Listing';
import type { ListingState } from '@/shared/listing/listing.utils';

/** The server doesn't sort users; the shared listing state needs a sort, which is never sent. */
export type UserSortField = 'none';
export const NO_USER_SORT: Sort<UserSortField> = { field: 'none', order: SortOrder.Asc };

/** `admin/users/search/v2` takes paging and a keyword only. */
export function toUserSearch({ page, pageSize, keyword }: ListingState<UserSortField>): UserSearch {
  return { from: (page - 1) * pageSize, size: pageSize, keyword: keyword.trim() || undefined };
}

/** The `#` column, counting on from the previous pages like v1. */
export function rowNumber({ page, pageSize }: ListingState<UserSortField>, index: number): number {
  return (page - 1) * pageSize + index + 1;
}

export type UsersBody = 'table' | 'error' | 'empty';

/** v1 showed "Users not found" for an empty page, searched or not. */
export function usersBody(hasError: boolean, total: number | undefined): UsersBody {
  if (hasError) return 'error';
  return total === 0 ? 'empty' : 'table';
}
