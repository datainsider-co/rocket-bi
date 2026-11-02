import type { RefObject } from 'react';
import { Button, Result, Spin } from 'antd';
import { PasswordGateView } from '@/features/dashboard/access/PasswordGateView';
import type { CodeEditorHandle } from '@/shared/code-editor/CodeEditor';
import { QueryEditorSession } from './QueryEditorSession';
import type { EditorSourceStatus } from './useEditorSource';

interface ContentProps {
  status: EditorSourceStatus;
  sessionKey: string;
  editorRef: RefObject<CodeEditorHandle | null>;
  onLeave: () => void;
}

/** The editor once its source is there; loading, the error or the analysis's password before that. */
export function QueryEditorContent({ status, sessionKey, editorRef, onLeave }: ContentProps) {
  switch (status.status) {
    case 'loading':
      return <Spin className="m-auto" />;
    case 'error':
      return (
        <Result
          status="warning"
          title={status.error}
          extra={status.retry ? <Button onClick={status.retry}>Retry</Button> : <Button onClick={onLeave}>Back to My Data</Button>}
        />
      );
    case 'locked':
      return <PasswordGateView onUnlock={status.onUnlock} onCancel={onLeave} />;
    case 'ready':
      return <QueryEditorSession key={sessionKey} start={status.start} editorRef={editorRef} />;
  }
}
