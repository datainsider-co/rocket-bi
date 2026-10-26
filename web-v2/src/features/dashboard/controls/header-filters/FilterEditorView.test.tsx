import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterCondition, type InternalFilter } from '@/core/query/internalFilter';
import { FilterEditorView } from './FilterEditorView';

const units: InternalFilter = {
  id: -1,
  name: 'Units',
  field: { class_name: 'table_field', db_name: 'db', tbl_name: 'sales', field_name: 'units', field_type: 'int32' },
  condition: FilterCondition.Equal,
  values: ['5'],
  enabled: true,
  nested: false
};

function renderEditor(filter = units) {
  const handlers = { onApply: vi.fn<(filter: InternalFilter) => void>(), onRemove: vi.fn<() => void>(), onCancel: vi.fn<() => void>() };
  render(<FilterEditorView filter={filter} {...handlers} />);
  return handlers;
}

describe('FilterEditorView', () => {
  it('applies the edited value', async () => {
    const { onApply } = renderEditor();
    const input = screen.getByRole('textbox', { name: 'Value' });
    await userEvent.clear(input);
    await userEvent.type(input, ' 42 ');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith({ ...units, values: ['42'] });
  });

  it('switches to a condition without values', async () => {
    const region = { ...units, name: 'Region', field: { ...units.field, field_type: 'string' }, condition: FilterCondition.Equal, values: ['Asia'] };
    const { onApply } = renderEditor(region);
    await userEvent.click(screen.getByRole('combobox', { name: 'Condition' }));
    await userEvent.click(await screen.findByTitle('is empty'));
    expect(screen.queryByRole('textbox', { name: 'Value' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith({ ...region, condition: FilterCondition.IsEmpty, values: [] });
  });

  it('removes and cancels', async () => {
    const { onRemove, onCancel, onApply } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onRemove).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('says when the field cannot be filtered', () => {
    renderEditor({ ...units, field: { ...units.field, field_type: 'bool' } });
    expect(screen.getByText("This field can't be filtered here.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});
