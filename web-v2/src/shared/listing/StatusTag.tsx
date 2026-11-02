import { statusIconUrl, type StatusIcon } from './statusIcon';

/** v1 `StatusCell`: the status icon and its name, in a table cell. */
export function StatusTag({ status, icon }: { status: string; icon: StatusIcon }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <img src={statusIconUrl(icon)} alt="" width={16} height={16} />
      <span>{status}</span>
    </span>
  );
}
