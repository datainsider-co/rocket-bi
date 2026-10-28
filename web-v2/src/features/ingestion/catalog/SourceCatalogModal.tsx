import { Modal, Typography } from 'antd';
import { SourceCard } from './SourceCard';
import { SOURCE_CATALOG, type AvailableSourceEntry } from './sourceCatalog';

interface SourceCatalogModalProps {
  open: boolean;
  /** Called with the picked type; the caller closes the catalog and opens that type's form. */
  onSelect: (entry: AvailableSourceEntry) => void;
  onClose: () => void;
}

/** v1 `DataSourceTypeSelection`: every source type as a card; only the ones v2 supports can be picked. */
export function SourceCatalogModal({ open, onSelect, onClose }: SourceCatalogModalProps) {
  return (
    <Modal open={open} centered width={800} title="Add Data Source" footer={null} onCancel={onClose}>
      <Typography.Paragraph type="secondary">Select Data Source Type</Typography.Paragraph>
      <ul className="m-0 flex max-h-[60vh] list-none flex-wrap justify-center gap-6 overflow-y-auto p-2">
        {SOURCE_CATALOG.map(entry => (
          <li key={entry.key}>
            <SourceCard entry={entry} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}
