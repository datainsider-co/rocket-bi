import { useState } from 'react';
import { Image, Input } from 'antd';
import { CustomDialog } from '../dialogs/CustomDialog';

interface ImageUrlModalViewProps {
  title: string;
  initial: string;
  onSubmit: (url: string) => Promise<void>;
  onCancel: () => void;
}

const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

/**
 * An image by its URL, with a preview. v1 `ImageBrowserModal` also searched a stock image service and uploaded files;
 * the open source server has no upload endpoint (`/upload` and `/media/upload` answer 404). In the look of v1's small
 * dialogs (`DiCustomModal`).
 */
export function ImageUrlModalView({ title, initial, onSubmit, onCancel }: ImageUrlModalViewProps) {
  const [url, setUrl] = useState(initial);
  const [saving, setSaving] = useState(false);
  const valid = isHttpUrl(url);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit(url.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomDialog title={title} okText="Save" okDisabled={!valid} saving={saving} onOk={() => void submit()} onCancel={onCancel}>
      <label htmlFor="image-url" className="custom-dialog__label">
        Image URL
      </label>
      <Input id="image-url" placeholder="https://..." value={url} onChange={event => setUrl(event.target.value)} onPressEnter={() => void submit()} />
      {valid && <Image className="mt-3" src={url.trim()} alt="Preview" height={160} preview={false} />}
    </CustomDialog>
  );
}
