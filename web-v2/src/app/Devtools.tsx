import { lazy, Suspense } from 'react';

const QueryDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');
      return { default: () => <ReactQueryDevtools buttonPosition="bottom-left" /> };
    })
  : () => null;

/** Dev-only tools, left out of production bundles. */
export function Devtools() {
  return (
    <Suspense>
      <QueryDevtools />
    </Suspense>
  );
}
