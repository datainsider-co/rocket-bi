import { useState } from 'react';
import type { TabWidget } from '@/core/dashboard/Widget';
import { filterPanelLook } from '../widgets/filter-panel/filterPanel.utils';
import { FilterPanelView } from '../widgets/filter-panel/FilterPanelView';
import { TabNavView } from '../widgets/tab/TabNavView';
import { openTabIndex, tabHeaderCssVars, type TabHeaderStyle } from '../widgets/tab/tabWidget.utils';
import { withTabStyle, type ApplyButtonStyle } from './tabEdit.utils';
import '../widgets/tab/TabWidget.css';

const NO_WIDGETS = {};
const STILL_GRID = { overlap: false, mobile: false, editable: false, onPositionsChange: () => undefined };

interface TabStylePreviewProps {
  widget: TabWidget;
  header: TabHeaderStyle;
  /** Given for a filter panel. */
  apply?: ApplyButtonStyle;
}

/**
 * The widget with the style being edited, without what it holds (v1 `TabViewer` / `FilterPanelViewer` with
 * `is-show-component` off): a tab widget's header over an empty body, or a filter panel's header and Apply.
 */
export function TabStylePreview({ widget, header, apply }: TabStylePreviewProps) {
  const [active, setActive] = useState(0);
  if (apply) {
    const look = filterPanelLook(withTabStyle(widget, header, apply));
    return (
      <div className="tab-style__panel">
        <FilterPanelView title={widget.tabItems[0]?.name ?? ''} look={look} positions={NO_WIDGETS} grid={STILL_GRID} renderWidget={() => null} onApply={() => undefined} preview />
      </div>
    );
  }
  return (
    <div className="tab-style__tab">
      <div className="tab-widget" data-position={header.position} style={tabHeaderCssVars(header)}>
        <TabNavView tabs={widget.tabItems} active={openTabIndex(active, widget.tabItems.length)} onActiveChange={setActive} />
        <div className="tab-widget__body" />
      </div>
    </div>
  );
}
