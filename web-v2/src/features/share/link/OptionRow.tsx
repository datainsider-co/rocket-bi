import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface OptionRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
}

/** v1 `.share-anyone-action`: an icon, a title over a hint, and the control at the right. */
export function OptionRow({ icon, title, description, control }: OptionRowProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="pt-0.5 text-xl leading-none text-[#959595]">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Typography.Text strong className="text-base tracking-[0.27px]">
          {title}
        </Typography.Text>
        <Typography.Text type="secondary" className="text-sm tracking-[0.2px]">
          {description}
        </Typography.Text>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
