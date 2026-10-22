import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { useTheme } from '@/app/theme/ThemeContext';
import { directoryTableTheme, directoryTableVars } from './directoryTable.theme';

/** Gives the table inside v1's look, following the app's light or dark mode. */
export function DirectoryTableTheme({ children }: { children: ReactNode }) {
  const { mode } = useTheme();

  return (
    <ConfigProvider theme={directoryTableTheme(mode)}>
      <div style={directoryTableVars(mode)}>{children}</div>
    </ConfigProvider>
  );
}
