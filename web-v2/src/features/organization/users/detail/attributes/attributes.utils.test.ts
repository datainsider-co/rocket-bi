import { describe, expect, it } from 'vitest';
import { attributeNameError, attributeSchema, deleteAttribute, saveAttribute, toAttributeRows } from './attributes.utils';

describe('attributeSchema', () => {
  it('requires both fields and trims them', () => {
    expect(attributeSchema.safeParse({ name: ' ', value: 'x' }).success).toBe(false);
    expect(attributeSchema.safeParse({ name: 'x', value: '' }).success).toBe(false);
    expect(attributeSchema.parse({ name: ' My Field ', value: ' a ' })).toEqual({ name: 'My Field', value: 'a' });
  });
});

describe('toAttributeRows', () => {
  it('sorts by name and keeps keys as they are', () => {
    expect(toAttributeRows({ 'ssl.mode': 'b', 'My Field': 'a' })).toEqual([
      { key: 'My Field', value: 'a' },
      { key: 'ssl.mode', value: 'b' }
    ]);
  });

  it('is empty for no properties', () => {
    expect(toAttributeRows({})).toEqual([]);
  });
});

describe('attributeNameError', () => {
  const properties = { region: 'VN' };

  it('refuses a taken name for a new attribute', () => {
    expect(attributeNameError('region', properties)).toBe('This attribute already exists');
  });

  it('lets an attribute keep its own name', () => {
    expect(attributeNameError('region', properties, 'region')).toBeUndefined();
  });

  it('refuses renaming onto another attribute', () => {
    expect(attributeNameError('region', { ...properties, city: 'HN' }, 'city')).toBe('This attribute already exists');
  });

  it('does not treat object prototype keys as taken', () => {
    expect(attributeNameError('toString', properties)).toBeUndefined();
  });
});

describe('saveAttribute and deleteAttribute', () => {
  it('sends only the new value', () => {
    expect(saveAttribute({ name: 'region', value: 'VN' })).toEqual({ properties: { region: 'VN' }, deletedKeys: [] });
  });

  it('deletes the old name when renamed', () => {
    expect(saveAttribute({ name: 'country', value: 'VN' }, 'region')).toEqual({
      properties: { country: 'VN' },
      deletedKeys: ['region']
    });
  });

  it('keeps the name when only the value changed', () => {
    expect(saveAttribute({ name: 'region', value: 'US' }, 'region').deletedKeys).toEqual([]);
  });

  it('deletes by key', () => {
    expect(deleteAttribute('ssl.mode')).toEqual({ properties: {}, deletedKeys: ['ssl.mode'] });
  });
});
