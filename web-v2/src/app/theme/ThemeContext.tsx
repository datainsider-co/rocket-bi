import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme } from 'antd';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/** v1 brand: `--accent-2` and the Roboto font from `web/src/themes`. */
const BRAND_TOKEN = {
  colorPrimary: '#0066ff',
  fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
};

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
      {/* antd styles go into `@layer antd` so Tailwind utilities can override them (see app/global.css). */}
      <StyleProvider layer>
        <ConfigProvider
          theme={{ token: BRAND_TOKEN, algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}
        >
          {children}
        </ConfigProvider>
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
