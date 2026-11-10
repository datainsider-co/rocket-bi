import { describe, expect, it, vi } from 'vitest';
import { menuAction } from './menuAction.utils';

describe('menuAction', () => {
  it('runs the item with the key', () => {
    const onClick = vi.fn<() => void>();
    menuAction([{ key: 'a', label: 'A' }, { key: 'b', label: 'B', onClick }], 'b')?.();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is undefined for a missing, disabled or inert item', () => {
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B', onClick: vi.fn<() => void>(), disabled: true }, null];
    expect(menuAction(items, 'a')).toBeUndefined();
    expect(menuAction(items, 'b')).toBeUndefined();
    expect(menuAction(items, 'c')).toBeUndefined();
  });
});
