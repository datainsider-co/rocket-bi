import { RightOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useParams } from 'react-router';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DataCookSection, getDataCookSection } from '../dataCook.utils';

const MY_ETL = getDataCookSection(DataCookSection.MyEtl);

/** v1's name for a new ETL. */
const NEW_ETL_NAME = 'Untitled ETL';

/**
 * `/data-warehouse/data-cook/my-etl/create` and `my-etl/:name` (v1 `ManageEtlJob.vue`): "My ETL › <name>", as in v1.
 * Loading, creating and editing the ETL come with DC6; until then an existing ETL shows no name.
 */
export function EtlEditorPage() {
  const { name } = useParams();

  return (
    <PageHeader
      icon={MY_ETL.icon}
      title={MY_ETL.title}
      trail={
        name === undefined && (
          <Typography.Text type="secondary" className="flex items-center gap-3 text-lg">
            <RightOutlined className="text-xs" />
            {NEW_ETL_NAME}
          </Typography.Text>
        )
      }
    />
  );
}
