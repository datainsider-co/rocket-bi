import type { ReactNode } from 'react';

/** Served from `public/auth/` as is. */
const ILLUSTRATION_URL = '/auth/login-illustration.svg';
const LOGO_URL = '/auth/logo.svg';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * v1 `login-v2` layout: the illustration covers the left 55% with the logo on top of it, the form sits centred on
 * white to the right. Below 900px only the form is shown.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen bg-white text-ink">
      <aside className="absolute inset-y-0 left-0 hidden w-[55%] overflow-hidden min-[900px]:block">
        <img src={ILLUSTRATION_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute top-[10vh] left-[5vw] flex items-center gap-4">
          <img src={LOGO_URL} alt="" className="h-[42px]" />
          <span className="text-[36px] leading-[42px] font-semibold text-white">RocketBI</span>
        </div>
      </aside>
      {/* Like v1, the white panel is `55% - 48px` wide from the right, so it overlaps the illustration a little. */}
      <main className="relative ml-auto flex w-full items-center justify-center bg-white px-6 py-10 min-[900px]:w-[calc(55%-48px)]">
        <div className="w-full max-w-[372px]">{children}</div>
      </main>
    </div>
  );
}
