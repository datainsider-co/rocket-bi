import { lazy, Suspense } from 'react';
import { Skeleton } from 'antd';
import type { CodeEditorProps } from './CodeEditor';

const CodeEditor = lazy(() => import('./CodeEditor').then(module => ({ default: module.CodeEditor })));

/** The code editor, with Monaco in its own chunk loaded on first use. */
export function LazyCodeEditor(props: CodeEditorProps) {
  return (
    <Suspense fallback={<Skeleton.Node active className="!w-full" style={{ width: '100%', height: props.height }} />}>
      <CodeEditor {...props} />
    </Suspense>
  );
}
