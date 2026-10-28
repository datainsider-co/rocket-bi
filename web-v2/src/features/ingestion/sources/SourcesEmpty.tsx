import { Typography } from 'antd';

interface SourcesEmptyProps {
  /** The listing is empty because of the search, not because there are no sources. */
  isSearching: boolean;
}

/** v1 `LayoutNoData` of `DataSourceScreen`. Its "Click here to add Data Source" link comes with DI4b. */
export function SourcesEmpty({ isSearching }: SourcesEmptyProps) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-2 rounded">
      <i className="di-icon-datasource text-5xl opacity-40" aria-hidden />
      {isSearching ? (
        <Typography.Text type="secondary">No data sources found</Typography.Text>
      ) : (
        <Typography.Text strong>No data yet</Typography.Text>
      )}
    </div>
  );
}
