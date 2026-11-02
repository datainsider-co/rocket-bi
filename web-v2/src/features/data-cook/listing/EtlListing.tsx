import { ShareModal } from '@/features/share/ShareModal';
import { getDataCookSection, type DataCookSection } from '../dataCook.utils';
import { etlListingOf } from './etlListing.utils';
import { EtlListingView } from './EtlListingView';
import { ForceRunModal } from './ForceRunModal';
import { useEtlListingPage } from './useEtlListingPage';

/** Container of one ETL listing; remounted per section so search, paging and sort start over, as in v1. */
export function EtlListing({ section }: { section: DataCookSection }) {
  const { state, actions, forceRun, share } = useEtlListingPage(etlListingOf(section));

  return (
    <>
      <EtlListingView section={getDataCookSection(section)} state={state} actions={actions} />
      {forceRun.etl && (
        <ForceRunModal
          etl={forceRun.etl}
          now={forceRun.now}
          isSubmitting={forceRun.isSubmitting}
          onSubmit={forceRun.onSubmit}
          onClose={forceRun.onClose}
        />
      )}
      {share.request && <ShareModal open {...share.request} onClose={share.onClose} onShared={share.onClose} />}
    </>
  );
}
