import { Spin } from 'antd';

/** Shown while the first page's chunk loads; later navigations keep the current page until the next one is ready. */
export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spin size="large" />
    </div>
  );
}
