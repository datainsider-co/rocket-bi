import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldDndProvider } from './FieldDndProvider';
import { FieldDropZone } from './FieldDropZone';
import type { ZoneRules } from './fieldDnd.utils';

function renderZone(zones: ZoneRules = { x: { size: 2 } }) {
  const onRemove = vi.fn<(index: number) => void>();
  const onDrop = vi.fn<(...args: unknown[]) => void>();
  render(
    <FieldDndProvider zones={zones} onDrop={onDrop} renderOverlay={() => null}>
      <FieldDropZone
        zoneId="x"
        itemKeys={['a', 'b']}
        placeholder={<span>Drag a field here</span>}
        renderItem={index => (
          <button type="button" onClick={() => onRemove(index)}>
            remove {index}
          </button>
        )}
      />
    </FieldDndProvider>
  );
  return { onRemove, onDrop };
}

describe('FieldDropZone', () => {
  it('renders items in order and the placeholder', () => {
    renderZone();
    expect(screen.getAllByText(/remove/).map(button => button.textContent)).toEqual(['remove 0', 'remove 1']);
    expect(screen.getByText('Drag a field here')).toBeInTheDocument();
  });

  it('lets buttons inside an item be clicked', async () => {
    const { onRemove } = renderZone();
    await userEvent.click(screen.getByText('remove 1'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('lets buttons inside an item be pressed with Space without starting a drag', async () => {
    const { onRemove } = renderZone();
    // The item around it is focusable too (dnd-kit gives it role="button"), so focus the inner button itself.
    screen.getByText('remove 0').focus();
    await userEvent.keyboard(' ');
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it('marks a disabled zone', () => {
    renderZone({ x: { size: 2, disabled: true } });
    expect(document.querySelector('[data-zone-id="x"]')).toHaveAttribute('aria-disabled', 'true');
  });

  it('throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<FieldDropZone zoneId="x" itemKeys={[]} renderItem={() => null} />)).toThrow(/FieldDndProvider/);
  });
});
