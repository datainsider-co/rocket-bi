import { Button, Typography } from 'antd';

interface SourcesEmptyProps {
  /** The listing is empty because of the search, not because there are no sources. */
  isSearching: boolean;
  onAdd: () => void;
}

/** v1 `LayoutNoData` of `DataSourceScreen`, with its "Click here to add Data Source" link. */
export function SourcesEmpty({ isSearching, onAdd }: SourcesEmptyProps) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-2 rounded">
      <i className="di-icon-datasource text-5xl opacity-40" aria-hidden />
      {isSearching ? (
        <Typography.Text type="secondary">No data sources found</Typography.Text>
      ) : (
        <>
          <Typography.Text strong>No data yet</Typography.Text>
          <Typography.Text type="secondary">
            <Button type="link" className="!p-0" onClick={onAdd}>
              Click here
            </Button>{' '}
            to add Data Source
          </Typography.Text>
        </>
      )}
    </div>
  );
}
