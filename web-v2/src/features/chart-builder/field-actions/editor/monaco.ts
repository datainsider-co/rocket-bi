import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
// The editor's core and only the features a formula needs (`editor.main` brings every language and feature).
import 'monaco-editor/editor/browser/coreCommands';
import 'monaco-editor/editor/browser/widget/codeEditor/codeEditorWidget';
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching';
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard';
import 'monaco-editor/editor/contrib/comment/browser/comment';
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu';
import 'monaco-editor/editor/contrib/cursorUndo/browser/cursorUndo';
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution';
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations';
import 'monaco-editor/editor/contrib/placeholderText/browser/placeholderText.contribution';
import 'monaco-editor/editor/contrib/snippet/browser/snippetController2';
import 'monaco-editor/editor/contrib/suggest/browser/suggestController';
import 'monaco-editor/editor/contrib/wordHighlighter/browser/wordHighlighter';
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations';
// oxlint-disable-next-line import/default -- Vite gives `?worker` imports a default export oxlint can't see.
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';

/**
 * Monaco from the app's own bundle, not a CDN: `@monaco-editor/react` loads this instance. Only imported by the code
 * editor's lazy chunk, so the builder doesn't load Monaco until a formula dialog opens.
 */
self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

export { monaco };
