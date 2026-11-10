import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import { appTheme, type ThemeMode } from './appTheme';

export type { ThemeMode };

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

/** UI state lives in plain React context: no external store library. */
export function ThemeProvider({ children, initialMode = 'light' }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const toggleMode = useCallback(() => setMode(prev => (prev === 'light' ? 'dark' : 'light')), []);
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);
  const antdTheme = useMemo(() => appTheme(mode), [mode]);

  return (
    <ThemeContext value={value}>
      {/* antd styles go into `@layer antd` so Tailwind utilities can override them (see app/global.css). */}
      <StyleProvider layer>
        <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
      </StyleProvider>
    </ThemeContext>
  );
}

export function useTheme(): ThemeState {
  const state = use(ThemeContext);
  if (!state) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return state;
}
