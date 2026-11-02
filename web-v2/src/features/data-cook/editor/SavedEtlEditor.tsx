import { useQuery } from '@tanstack/react-query';
import { Button, Result, Spin } from 'antd';
import { Link } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import type { EtlId } from '@/core/data-cook/EtlJob';
import { EtlService } from '@/core/data-cook/EtlService';
import { isApiError } from '@/shared/http/ApiError';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { DataCookSection, getDataCookSection } from '../dataCook.utils';
import { etlQueryOptions } from '../dataCookQueries';
import { EtlEditor } from './EtlEditor';
import { EtlEditorHeader } from './EtlEditorHeader';

interface SavedEtlEditorProps {
  id: EtlId;
  onCreated: (id: EtlId) => void;
}

/** An ETL with its operators (`GET data_cook/{id}`), or why it can't be opened. A trashed ETL is a 404 (DC0). */
export function SavedEtlEditor({ id, onCreated }: SavedEtlEditorProps) {
  const { data, error, refetch, isFetching } = useQuery(etlQueryOptions(useDi(EtlService), id));
  if (data) return <EtlEditor initial={data} onCreated={onCreated} />;

  return (
    <>
      <EtlEditorHeader />
      {isApiError(error) && error.status === 404 ? (
        <Result
          status="404"
          title="ETL not found"
          subTitle="It was deleted, or moved to the trash."
          extra={
            <Link to={getDataCookSection(DataCookSection.MyEtl).path}>
              <Button type="primary">Back to My ETL</Button>
            </Link>
          }
        />
      ) : error ? (
        <Result
          status="error"
          title="Could not load the ETL"
          subTitle={toErrorMessage(error)}
          extra={
            <Button type="primary" loading={isFetching} onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <Spin className="mt-12 block" />
      )}
    </>
  );
}
