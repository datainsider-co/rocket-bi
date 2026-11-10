import { useState } from 'react';
import type { ImageWidget } from '@/core/dashboard/Widget';
import { EmptyData } from '@/shared/status/EmptyData';
import { ErrorState } from '@/shared/status/ErrorState';
import { Loading } from '@/shared/status/Loading';

type Status = 'loading' | 'loaded' | 'error';

/**
 * v1 `ImageViewer.vue`: the image covers the whole card, over its padding; the spinner until it loads, v1's error
 * without retry when it fails, the empty icon without a URL.
 */
export function ImageWidgetView({ widget }: { widget: ImageWidget }) {
  // Keyed by URL, so a replaced image starts loading again.
  const [state, setState] = useState<{ url: string; status: Status }>({ url: widget.url, status: 'loading' });
  const status = state.url === widget.url ? state.status : 'loading';
  const settle = (next: Status) => setState({ url: widget.url, status: next });

  if (!widget.url) return <EmptyData>{null}</EmptyData>;
  if (status === 'error') return <ErrorState />;
  return (
    <div className="image-widget">
      {status === 'loading' && (
        <div className="absolute inset-0">
          <Loading />
        </div>
      )}
      <img src={widget.url} alt={widget.name} draggable={false} onLoad={() => settle('loaded')} onError={() => settle('error')} />
    </div>
  );
}
