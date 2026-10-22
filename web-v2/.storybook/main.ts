import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  typescript: {
    // react-docgen-typescript needs the classic TS compiler API, which TS 7 no longer ships.
    reactDocgen: 'react-docgen'
  }
};

export default config;
