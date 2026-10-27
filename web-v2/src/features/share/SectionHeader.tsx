import { theme } from 'antd';

/** v1 `AddUserIcon` and `LinkIcon`: a 32px circle, brand blue when the section is open, grey when it is not. */
const ICON_PATHS = {
  people:
    'M16 6a4.787 4.787 0 0 1 4.781 4.781 4.777 4.777 0 0 1-1.917 3.826c.36.119.712.26 1.058.425a.703.703 0 1 1-.603 1.27 7.659 7.659 0 0 0-3.13-.743 4.848 4.848 0 0 1-.375 0c-3.57.086-6.662 2.647-7.392 6.151a.735.735 0 0 0 .15.616c.08.1.262.268.562.268h8.659a.703.703 0 1 1 0 1.406h-8.66a2.135 2.135 0 0 1-2.088-2.576 9.173 9.173 0 0 1 3.148-5.194 9.137 9.137 0 0 1 2.946-1.62 4.777 4.777 0 0 1-1.92-3.829A4.787 4.787 0 0 1 16 6zm5.66 11.32c.388 0 .703.315.703.703v1.934h1.934a.703.703 0 1 1 0 1.406h-1.934v1.934a.703.703 0 1 1-1.406 0v-1.934h-1.934a.703.703 0 1 1 0-1.406h1.934v-1.934c0-.388.315-.703.703-.703zM16 7.406a3.379 3.379 0 0 0-3.375 3.375 3.38 3.38 0 0 0 3.205 3.371l.17-.002h.086l.085.002a3.38 3.38 0 0 0 3.204-3.37A3.379 3.379 0 0 0 16 7.405z',
  link: 'M14.99 10.947v1.92h-4.043A3.135 3.135 0 0 0 7.815 16a3.135 3.135 0 0 0 3.132 3.133h4.042v1.92h-4.042A5.054 5.054 0 0 1 5.895 16a5.054 5.054 0 0 1 5.052-5.053h4.042zm6.063 0A5.054 5.054 0 0 1 26.105 16a5.054 5.054 0 0 1-5.052 5.053H17.01v-1.92h4.042A3.135 3.135 0 0 0 24.185 16a3.135 3.135 0 0 0-3.132-3.133H17.01v-1.92zm-1.01 4.042v2.022h-8.085v-2.022h8.084z'
} as const;

interface SectionHeaderProps {
  icon: keyof typeof ICON_PATHS;
  title: string;
  active: boolean;
}

/** A section's title with its round icon; grey while the section is collapsed. */
export function SectionHeader({ icon, title, active }: SectionHeaderProps) {
  const { token } = theme.useToken();
  return (
    <div className="flex items-center gap-4">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="shrink-0">
        <circle cx="16" cy="16" r="16" fill={active ? token.colorPrimary : token.colorFillSecondary} />
        <path d={ICON_PATHS[icon]} fill={active ? token.colorWhite : token.colorTextTertiary} />
      </svg>
      <span
        className="text-2xl leading-none font-medium tracking-[0.2px]"
        style={{ color: active ? token.colorText : token.colorTextSecondary }}
      >
        {title}
      </span>
    </div>
  );
}
