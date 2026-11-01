import { EditOutlined } from '@ant-design/icons';
import { Button, Table } from 'antd';
import type { RlsPolicy } from '@/core/rls/RlsPolicy';
import type { TableSchema } from '@/core/schema/SchemaService';
import { filterKindOf, operatorInputOf, operatorLabel } from './rls.utils';
import { describeFilter } from './rlsFilter.utils';

interface RlsPoliciesViewProps {
  policies: readonly RlsPolicy[];
  table: TableSchema;
  onEdit: () => void;
}

const DASH = '--';
const FILTER_LABELS = { all: 'View All', nothing: 'View Nothing', none: DASH } as const;

function conditionText(policy: RlsPolicy): string {
  const attribute = policy.userAttribute;
  if (!attribute) return DASH;
  const values = operatorInputOf(attribute.operator) === 'none' ? '' : attribute.values.join(', ');
  return [operatorLabel(attribute.operator), values].filter(Boolean).join(' ');
}

/** The RLS tab in view mode (v1 `ManageRLSPolicy` in `ViewRLS`): who each policy targets and what they see. */
export function RlsPoliciesView({ policies, table, onEdit }: RlsPoliciesViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex justify-end">
        <Button icon={<EditOutlined />} onClick={onEdit}>
          Edit RLS
        </Button>
      </div>
      <Table<RlsPolicy>
        rowKey="policyId"
        dataSource={[...policies]}
        pagination={false}
        size="middle"
        locale={{ emptyText: 'No RLS created yet' }}
        columns={[
          {
            key: 'key',
            title: 'Attribute Name',
            render: (_, policy) => policy.userAttribute?.key || (policy.userIds.length > 0 ? `${policy.userIds.length} user${policy.userIds.length === 1 ? '' : 's'}` : DASH)
          },
          { key: 'condition', title: 'Condition', render: (_, policy) => conditionText(policy) },
          {
            key: 'filter',
            title: 'Filters',
            render: (_, policy) => {
              const kind = filterKindOf(policy.conditions);
              return kind === 'custom' ? describeFilter(policy.conditions, table) : FILTER_LABELS[kind];
            }
          }
        ]}
      />
    </div>
  );
}
