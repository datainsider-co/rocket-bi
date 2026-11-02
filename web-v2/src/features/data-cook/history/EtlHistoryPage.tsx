import { DataCookSection, getDataCookSection } from '../dataCook.utils';
import { EtlHistoryView } from './EtlHistoryView';
import { useEtlHistory } from './useEtlHistory';

const SECTION = getDataCookSection(DataCookSection.History);

/** `/data-warehouse/data-cook/history` (v1 `EtlHistory.vue`). */
export function EtlHistoryPage() {
  return <EtlHistoryView section={SECTION} state={useEtlHistory()} />;
}
