import { App } from 'antd';

/** `navigator.clipboard` needs a secure context; plain http falls back to a hidden text area, as v1's library did. */
async function writeText(text: string): Promise<void> {
  if (globalThis.navigator?.clipboard) return globalThis.navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  if (!copied) throw new Error('Copy failed');
}

/** Copies to the clipboard and says whether it worked (v1 `CopyButton`'s Copied / Failed tooltip). */
export function useCopyText(write: (text: string) => Promise<void> = writeText) {
  const { message } = App.useApp();
  return async (text: string) => {
    try {
      await write(text);
      void message.success('Copied');
    } catch {
      void message.error('Failed to copy');
    }
  };
}
