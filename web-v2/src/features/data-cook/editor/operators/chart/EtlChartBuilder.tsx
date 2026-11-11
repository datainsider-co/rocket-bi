import { ConfigPanel } from '@/features/chart-builder/config-panel/ConfigPanel';
import { FieldChoicesContext } from '@/features/chart-builder/config-panel/FieldChoicesContext';
import { BuilderDndProvider } from '@/features/chart-builder/dnd/BuilderDndProvider';
import { FieldTreeView } from '@/features/chart-builder/field-tree/FieldTreeView';
import { ChartBuilderModalView } from '@/features/chart-builder/modal/ChartBuilderModalView';
import { BuilderScope } from '@/features/chart-builder/theme/BuilderScope';
import { BuilderResultView } from './BuilderResultView';
import { useEtlChartBuilder, type EtlChartBuilderInput } from './useEtlChartBuilder';

/** The builder of a Transform or Pivot; place it inside `BuilderProvider`. */
export function EtlChartBuilder({ title, ...input }: EtlChartBuilderInput & { title: string }) {
  const { tree, nodes, result, actions } = useEtlChartBuilder(input);
  return (
    <BuilderScope>
      <FieldChoicesContext value={nodes}>
        <BuilderDndProvider>
          <ChartBuilderModalView
            title={title}
            actions={actions}
            slots={{ tree: <FieldTreeView {...tree} />, panel: <ConfigPanel />, preview: <BuilderResultView result={result} /> }}
          />
        </BuilderDndProvider>
      </FieldChoicesContext>
    </BuilderScope>
  );
}
