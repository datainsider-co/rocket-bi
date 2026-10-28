import { Tooltip } from 'antd';
import { formatHistoryMessage } from './jobHistory.utils';

/** A run's error on one line, cut with an ellipsis; the whole message is in the tooltip. `--` when there is none. */
export function HistoryMessageCell({ message }: { message: string }) {
  const text = formatHistoryMessage(message);
  if (text === '--') return <span>{text}</span>;
  return (
    <Tooltip title={<span className="whitespace-pre-wrap break-words">{text}</span>} placement="topLeft">
      <span className="block truncate">{text}</span>
    </Tooltip>
  );
}
