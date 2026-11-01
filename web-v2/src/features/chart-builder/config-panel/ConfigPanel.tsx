import { useBuilder } from '../state/BuilderContext';
import { ConfigPanelView } from './ConfigPanelView';
import { ConditionEditor } from './filter/ConditionEditor';
import { useConfigPanel } from './useConfigPanel';

/** The builder's config panel; place it inside `BuilderProvider` and `BuilderDndProvider`. */
export function ConfigPanel() {
  const { filter, ...panel } = useConfigPanel();
  const { controls, sqlQueryOf, dashboardId } = useBuilder();
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
            context={{ controls, sqlQueryOf, dashboardId }}
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
