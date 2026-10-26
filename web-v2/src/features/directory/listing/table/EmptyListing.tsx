import { Typography } from 'antd';

/** v1 `MyDataEmpty`: fills the space of the table it replaces, on the panel color, with the hint centered. */
export function EmptyListing() {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center rounded bg-[color:var(--directory-panel-bg,transparent)]">
      <img src="/directory/empty_data.svg" alt="" width={200} height={140} className="mb-4" />
      <Typography.Text type="secondary" className="text-center">
        Your dashboard listing is empty
        <br />
        Click New to create a folder or dashboard
      </Typography.Text>
    </div>
  );
}
