/**
 * The name the server stores for a table or column (`ClickHouseUtils.normalizeString`): Vietnamese letters without
 * marks, every run of other characters as one `_`. Other accented letters lose their mark here but become `_` on the
 * server, whose answer is the name to use.
 */
export function toIdentifier(name: string): string {
  return name
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_');
}
