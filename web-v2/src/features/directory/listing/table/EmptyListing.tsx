import { Typography } from 'antd';

/** v1 `MyDataEmpty`. */
export function EmptyListing() {
  return (
    <div className="flex flex-col items-center py-10">
      <img src="/directory/empty_data.svg" alt="" width={200} height={140} className="mb-4" />
      <Typography.Text type="secondary" className="text-center">
        Your dashboard listing is empty
        <br />
        Click New to create a folder or dashboard
      </Typography.Text>
    </div>
  );
}
