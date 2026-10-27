import type { ReactNode } from 'react';
import { theme } from 'antd';

interface ShareCardProps {
  /** Accessible name of the card. */
  label: string;
  /** A collapsed card is one button that opens it. */
  onExpand?: () => void;
  /** Shown at the right of a collapsed card, outside its button (v1's Copy link). */
  aside?: ReactNode;
  children: ReactNode;
}

const CARD_CLASS = 'box-border flex w-full flex-col rounded border-0 p-6 text-left shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]';

/** One of the dialog's two white cards (v1 `.share-section`). */
export function ShareCard({ label, onExpand, aside, children }: ShareCardProps) {
  const { token } = theme.useToken();
  const style = { background: token.colorBgElevated, color: token.colorText, fontFamily: 'inherit', fontSize: token.fontSize };
  if (onExpand) {
    return (
      <div className="relative">
        <button type="button" aria-label={label} className={`${CARD_CLASS} cursor-pointer gap-3`} style={style} onClick={onExpand}>
          {children}
        </button>
        {aside && <div className="absolute top-1/2 right-6 -translate-y-1/2">{aside}</div>}
      </div>
    );
  }
  return (
    <section aria-label={label} className={`${CARD_CLASS} gap-6`} style={style}>
      {children}
    </section>
  );
}
