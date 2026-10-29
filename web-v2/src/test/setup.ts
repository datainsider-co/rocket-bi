import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

afterEach(() => cleanup());

// Pages rendered through the real routes load their lazy chunks on first use, which can take over the default 1 s of
// `findBy` / `waitFor` while the whole suite runs in parallel.
configure({ asyncUtilTimeout: 3000 });

// jsdom has no matchMedia; antd's responsive utilities need it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList;
}

// jsdom has no ResizeObserver; antd's overflow menus (Dropdown, Menu) need it.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
