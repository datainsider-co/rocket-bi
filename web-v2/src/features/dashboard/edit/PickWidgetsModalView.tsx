import { useState } from 'react';
import { Input } from 'antd';
import type { WidgetId } from '@/core/dashboard/Position';
import { HeaderDialog } from '../dialogs/HeaderDialog';
import { matchingOptions, toggled, type PickOption } from './pickWidgets.utils';
import './editDialogs.css';

interface PickWidgetsModalViewProps {
  title: string;
  subtitle: string;
  actionName: string;
  emptyText: string;
  options: readonly PickOption[];
  onSubmit: (ids: WidgetId[]) => Promise<void>;
  onCancel: () => void;
}

/** v1 `MultiChoiceItem`: a 16px box, filled with a check when chosen. */
function CheckMark({ checked }: { checked: boolean }) {
  return (
    <svg className="pick-widgets__check" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      {checked ? (
        <>
          <rect width="16" height="16" rx="1.875" fill="var(--background-active, #57f)" />
          <path fill="#fff" d="M13.466 4.729 12.534 3.896 6.754 10.351 3.399 7.162 2.538 8.068 6.826 12.144z" />
        </>
      ) : (
        <rect x="0.625" y="0.625" width="14.75" height="14.75" rx="1.25" fill="none" stroke="var(--background-de-active, #9799ac)" strokeWidth="1.25" />
      )}
    </svg>
  );
}

/** v1 `AddChartModal`: search the widgets by name and tick the ones to move into a tab, or out of it. */
export function PickWidgetsModalView({ title, subtitle, actionName, emptyText, options, onSubmit, onCancel }: PickWidgetsModalViewProps) {
  const [picked, setPicked] = useState<readonly WidgetId[]>([]);
  const [keyword, setKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const shown = matchingOptions(options, keyword);
  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit([...picked]);
    } finally {
      setSaving(false);
    }
  };
  return (
    <HeaderDialog title={title} subtitle={subtitle} actionName={actionName} width={444} disabled={picked.length === 0} saving={saving} onSubmit={() => void submit()} onCancel={onCancel}>
      <div className="pick-widgets">
        <Input
          className="pick-widgets__search"
          aria-label="Search"
          placeholder="Search..."
          allowClear
          prefix={<img src="/icons/ic_search.svg" width={16} height={16} alt="" />}
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
        />
        {shown.length === 0 ? (
          <div className="pick-widgets__empty">{emptyText}</div>
        ) : (
          <div className="pick-widgets__list">
            {shown.map(option => {
              const checked = picked.includes(option.id);
              return (
                <button key={option.id} type="button" aria-pressed={checked} className="pick-widgets__item" onClick={() => setPicked(toggled(picked, option.id))}>
                  {option.icon ? <img className="pick-widgets__icon" src={option.icon} alt="" /> : <span className="pick-widgets__icon" />}
                  <span className="pick-widgets__name">{option.label}</span>
                  <CheckMark checked={checked} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </HeaderDialog>
  );
}
