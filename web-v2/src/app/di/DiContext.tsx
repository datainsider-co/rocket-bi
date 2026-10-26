import { createContext, use, type ReactNode } from 'react';
import type { DiResolver, Token } from '@/core/di/Container';

const DiContext = createContext<DiResolver | null>(null);

interface DiProviderProps {
  container: DiResolver;
  children: ReactNode;
}

export function DiProvider({ container, children }: DiProviderProps) {
  return <DiContext value={container}>{children}</DiContext>;
}

export function useDi<T>(token: Token<T>): T {
  const container = use(DiContext);
  if (!container) {
    throw new Error('useDi must be used inside <DiProvider>');
  }
  return container.get(token);
}
