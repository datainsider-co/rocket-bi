import { useQuery } from '@tanstack/react-query';
import { Button, Spin, Typography } from 'antd';
import { useDi } from '@/app/di/DiContext';
import { RlsPolicyService } from '@/core/rls/RlsPolicyService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { toErrorMessage } from '@/shared/http/errorMessage';
import { rlsPoliciesQueryOptions } from '../../warehouseQueries';
import { RlsEditor } from './RlsEditor';
import { RlsPoliciesView } from './RlsPoliciesView';

interface RlsTabProps {
  table: TableSchema;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

/** The RLS tab (v1 `ManageRLSPolicy`): the table's policies (`policies/list`), edited all at once. */
export function RlsTab({ table, editing, onEditingChange }: RlsTabProps) {
  const query = useQuery(rlsPoliciesQueryOptions(useDi(RlsPolicyService), table));
  if (query.isPending) return <Spin className="mt-8 block" />;
  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Typography.Text type="danger">{toErrorMessage(query.error)}</Typography.Text>
        <Button onClick={() => void query.refetch()}>Retry</Button>
      </div>
    );
  }
  return editing ? (
    <RlsEditor table={table} policies={query.data} onDone={() => onEditingChange(false)} />
  ) : (
    <RlsPoliciesView policies={query.data} table={table} onEdit={() => onEditingChange(true)} />
  );
}
