import { Config } from 'vuescroll';

export const DefaultScrollConfig: Config = Object.freeze({
  vuescroll: {
    mode: 'native'
  },
  bar: {
    background: 'var(--scrollbar-background)',
    size: '6px',
    minSize: 0.25
  },
  rail: {
    size: '8px'
  }
});

export const VerticalScrollConfigs: Config = Object.freeze({
  ...DefaultScrollConfig,
  scrollPanel: {
    scrollingX: false
  }
});

export const HorizontalScrollConfig: Config = Object.freeze({
  ...DefaultScrollConfig,
  scrollPanel: {
    scrollingX: true,
    scrollingY: false
  }
});

export const DisableScrollConfig: Config = Object.freeze({
  ...DefaultScrollConfig,
  scrollPanel: {
    scrollingX: false,
    scrollingY: false
  }
});
