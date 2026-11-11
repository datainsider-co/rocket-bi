import { CHART_ICON_PATH } from '../field-tree/fieldTree.utils';
import { chartHintOf, HINT_IMAGE_PATH } from './chartHint.utils';
import './Preview.css';

interface PreviewHintViewProps {
  /** The chart type being built, with its picker title and icon for the types without a hint. */
  type: { type: string; title: string; icon: string };
}

/**
 * v1 `HintPanel`: until the zones build a chart, how to build this type, over its illustration; for a type without a
 * hint, its icon and a line.
 */
export function PreviewHintView({ type }: PreviewHintViewProps) {
  const hint = chartHintOf(type.type);
  if (!hint) {
    return (
      <div className="chart-hint chart-hint--default">
        <img className="chart-hint__icon" src={CHART_ICON_PATH + type.icon} alt="" />
        <div className="chart-hint__description">Drag and drop your fields to create a {type.title} chart.</div>
      </div>
    );
  }
  return (
    <div className="chart-hint">
      <div className="chart-hint__text">
        <img src="/icons/idea.svg" alt="" width={16} height={16} />
        <div>
          <div className="chart-hint__title">How to create a {hint.name}?</div>
          <div className="chart-hint__steps">
            {hint.texts.map(text => (
              <div key={text}>{text}</div>
            ))}
          </div>
        </div>
      </div>
      {hint.image && (
        <div className="chart-hint__image">
          <img src={HINT_IMAGE_PATH + hint.image} alt="" />
        </div>
      )}
    </div>
  );
}
