import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';

export type ThemeMode = 'light' | 'dark';

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

  return (
    <ThemeContext value={value}>
      <ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        {children}
      </ConfigProvider>
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
