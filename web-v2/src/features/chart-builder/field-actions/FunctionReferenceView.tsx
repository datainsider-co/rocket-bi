import { Empty, Select, Typography } from 'antd';
import type { FunctionReference } from './useFunctionReference';

/**
 * The data source's functions beside a formula (v1 `CalculatedFieldModal` right columns): a group to pick, its
 * functions, and the description and example of the selected one.
 */
export function FunctionReferenceView({ groups, group, onGroup, functions, selected, onSelect }: FunctionReference) {
  return (
    <div className="grid min-h-0 grid-cols-2 gap-4">
      <div className="flex min-h-0 flex-col gap-2">
        <Select aria-label="Function group" showSearch value={group} options={groups.map(value => ({ value, label: value }))} onChange={onGroup} />
        <ul className="m-0 min-h-0 flex-1 list-none overflow-auto rounded bg-black/[0.03] p-1" aria-label="Functions">
          {functions.map(info => (
            <li key={info.name}>
              <button
                type="button"
                aria-current={info.name === selected?.name}
                className="w-full cursor-pointer truncate rounded border-0 bg-transparent px-2 py-1 text-left text-inherit hover:bg-black/5 aria-[current=true]:bg-[var(--color-brand)]/10 aria-[current=true]:text-[var(--color-brand)]"
                onClick={() => onSelect(info)}
              >
                {info.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-h-0 overflow-auto" aria-live="polite">
        {selected ? (
          <>
            <Typography.Title level={5} className="!mt-1 break-words">
              {selected.title ?? selected.name}
            </Typography.Title>
            <Typography.Paragraph className="whitespace-pre-line">{selected.description || <i>No information available</i>}</Typography.Paragraph>
            {selected.example && (
              <>
                <Typography.Text strong>Example:</Typography.Text>
                <pre className="mt-1 rounded bg-black/[0.04] p-2 text-xs whitespace-pre-wrap">{selected.example}</pre>
              </>
            )}
          </>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No functions" />
        )}
      </div>
    </div>
  );
}
