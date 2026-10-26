import type { ImageWidget } from '@/core/dashboard/Widget';

/** v1 `ImageViewer.vue`: the image fills the widget. */
export function ImageWidgetView({ widget }: { widget: ImageWidget }) {
  return <img className="block size-full object-cover" src={widget.url} alt={widget.name} draggable={false} />;
}
