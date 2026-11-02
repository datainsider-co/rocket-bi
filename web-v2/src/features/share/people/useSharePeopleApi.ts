import { useMemo } from 'react';
import { useDi } from '@/app/di/DiContext';
import { EtlShareService } from '@/core/data-cook/EtlShareService';
import { DatabaseShareService } from '@/core/schema/DatabaseShareService';
import { ShareService } from '@/core/share/ShareService';
import { sharePeopleApi, type SharePeopleApi } from './sharePeopleApi';

/** The people endpoints for any resource the dialog shares. */
export function useSharePeopleApi(): SharePeopleApi {
  const share = useDi(ShareService);
  const databases = useDi(DatabaseShareService);
  const etls = useDi(EtlShareService);
  return useMemo(() => sharePeopleApi(share, databases, etls), [share, databases, etls]);
}
