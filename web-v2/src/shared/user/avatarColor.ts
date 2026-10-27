/** v1 `HtmlElementRenderUtils.backgrounds`: the fallback avatar's color, picked by the name's first letter. */
const AVATAR_COLORS = [
  '#1abc9c',
  '#2ecc71',
  '#3498db',
  '#72BD64',
  '#68B4B4',
  '#16a085',
  '#27ae60',
  '#2980b9',
  '#72BD64',
  '#FF6FA9',
  '#f1c40f',
  '#e67e22',
  '#e74c3c',
  '#9BC1ED',
  '#f39c12',
  '#d35400',
  '#c0392b',
  '#FF8EFF',
  '#45C7C6'
] as const;

export function avatarColor(name: string): string {
  const code = name.toUpperCase().charCodeAt(0);
  return AVATAR_COLORS[(Number.isNaN(code) ? 0 : code) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}
