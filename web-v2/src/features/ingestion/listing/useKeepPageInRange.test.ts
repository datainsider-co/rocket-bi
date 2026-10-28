import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useKeepPageInRange } from './useKeepPageInRange';
import { useListingState } from './useListingState';

function setup(initialTotal: number | undefined) {
  return renderHook(
    ({ total }: { total: number | undefined }) => {
      const controls = useListingState<'name'>({ field: 'name', order: 'ASC' });
      useKeepPageInRange(controls, total);
      return controls;
    },
    { initialProps: { total: initialTotal } }
  );
}

describe('useKeepPageInRange', () => {
  it('moves back to the last page when rows go away', () => {
    const { result, rerender } = setup(100);
    act(() => result.current.setPage(5, 20));
    expect(result.current.state.page).toBe(5);

    rerender({ total: 45 });

    expect(result.current.state.page).toBe(3);
  });

  it('stays on a page that still has rows', () => {
    const { result, rerender } = setup(100);
    act(() => result.current.setPage(2, 20));

    rerender({ total: 21 });

    expect(result.current.state.page).toBe(2);
  });

  it('does nothing until a total has loaded', () => {
    const { result } = setup(undefined);
    act(() => result.current.setPage(4, 20));

    expect(result.current.state.page).toBe(4);
  });
});
