import type { Preview } from '@storybook/react-vite';
import '../src/app/global.css';
import { App as AntApp } from 'antd';
import { ThemeProvider } from '../src/app/theme/ThemeContext';

const preview: Preview = {
  decorators: [
    Story => (
      <ThemeProvider>
        <AntApp>
          <Story />
        </AntApp>
      </ThemeProvider>
    )
  ],
  parameters: {
    controls: { expanded: true }
  }
};

export default preview;
