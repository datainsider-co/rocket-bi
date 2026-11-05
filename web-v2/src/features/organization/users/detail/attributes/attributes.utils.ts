import { z } from 'zod';

/** v1 `AddNewFieldModal`: name and value, both required. Keys are data, kept exactly as typed. */
export const attributeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required!'),
  value: z.string().trim().min(1, 'Value is required!')
});

export type AttributeForm = z.infer<typeof attributeSchema>;

export interface AttributeRow {
  readonly key: string;
  readonly value: string;
}

/** Sorted by name, so the list doesn't jump when one is edited. */
export function toAttributeRows(properties: Readonly<Record<string, string>>): AttributeRow[] {
  return Object.entries(properties)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** A new name must not be taken; editing keeps its own name. */
export function attributeNameError(name: string, properties: Readonly<Record<string, string>>, editing?: string): string | undefined {
  return name !== editing && Object.hasOwn(properties, name) ? 'This attribute already exists' : undefined;
}

export interface AttributeUpdate {
  readonly properties: Record<string, string>;
  readonly deletedKeys: string[];
}

/** The server merges `properties` in, so only the changed one is sent; a rename also deletes the old name. */
export function saveAttribute(form: AttributeForm, editing?: string): AttributeUpdate {
  return {
    properties: { [form.name]: form.value },
    deletedKeys: editing !== undefined && editing !== form.name ? [editing] : []
  };
}

export function deleteAttribute(key: string): AttributeUpdate {
  return { properties: {}, deletedKeys: [key] };
}
