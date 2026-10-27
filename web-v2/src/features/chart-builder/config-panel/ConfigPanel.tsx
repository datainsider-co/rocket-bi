import { ConfigPanelView } from './ConfigPanelView';
import { ConditionEditor } from './filter/ConditionEditor';
import { useConfigPanel } from './useConfigPanel';

/** The builder's config panel; place it inside `BuilderProvider` and `BuilderDndProvider`. */
export function ConfigPanel() {
  const { filter, ...panel } = useConfigPanel();
  return (
    <ConfigPanelView
      {...panel}
      filter={{
        chipsOf: filter.chipsOf,
        onRemove: filter.onRemove,
        onAddField: filter.onAddField,
        onSwapField: filter.onSwapField,
        renderEditor: (condition, close) => (
          <ConditionEditor
            condition={condition}
            onApply={next => {
              filter.onApply(next);
              close();
            }}
            onRemove={() => {
              close();
              filter.onRemove(condition);
            }}
            onCancel={close}
          />
        )
      }}
    />
  );
}
