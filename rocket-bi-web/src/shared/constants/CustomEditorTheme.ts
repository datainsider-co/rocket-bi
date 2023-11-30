// See more [here](https://microsoft.github.io/monaco-editor/playground.html#customizing-the-appearence-exposed-colors)

export const FormulaThemeLight = {
  base: 'vs',
  inherit: true,
  rules: [
    { background: '#ffffff' },
    { token: 'field', foreground: '#2927ff' },
    { token: 'keyword', foreground: '#e57418' },
    { token: 'strings', foreground: '#e2574e' },
    { token: 'string', foreground: '#e2574e' },
    { token: 'number', foreground: '#e2574e' },
    { token: 'numbers', foreground: '#e2574e' },
    { token: 'columns', foreground: '#2927ff' }
  ],
  colors: {
    // 'editor.foreground': '#FFFFFF99',
    // 'editor.background': '#1a2633',
    'editor.lineHighlightBackground': '#00000000',
    'editor.lineHighlightBorder': '#00000000'
    // 'editorCursor.foreground': '#8B0000',
    // 'editor.lineHighlightBackground': '#0000FF20',
    // 'editorLineNumber.foreground': '#008800',
    // 'editor.selectionBackground': '#88000030',
    // 'editor.inactiveSelectionBackground': '#88000015'
  }
};

export const QueryThemeLight = {
  base: 'vs',
  inherit: true,
  rules: [
    // { background: '#ffffff' },
    {
      token: 'keyword',
      foreground: '#2927ff'
    },
    { token: 'databases', foreground: '#53A053' },
    { token: 'tables', foreground: '#447bef' },
    { token: 'columns', foreground: '#976715' },
    { token: 'strings', foreground: '#e2574e' },
    { token: 'string', foreground: '#e2574e' },
    { token: 'number', foreground: '#e2574e' },
    { token: 'numbers', foreground: '#e2574e' }
  ],
  colors: {
    // 'editor.foreground': '#FFFFFF99',
    // 'editor.background': '#f2f2f7',
    'editor.lineHighlightBackground': '#00000000',
    'editor.lineHighlightBorder': '#00000000'
    // 'editorCursor.foreground': '#8B0000',
    // 'editor.lineHighlightBackground': '#0000FF20',
    // 'editorLineNumber.foreground': '#008800',
    // 'editor.selectionBackground': '#F4F4F43B'
    // 'editor.inactiveSelectionBackground': '#88000015'
  }
};

export const EtlQueryThemeLight = {
  base: 'vs',
  inherit: true,
  rules: [
    // { background: '#ffffff' },
    { token: 'field', foreground: '#2927ff' },

    // { token: 'databases', foreground: '#ff3366' },
    {
      token: 'keyword',
      foreground: '#2927ff'
    },
    { token: 'databases', foreground: '#53A053' },
    { token: 'tables', foreground: '#447bef' },
    { token: 'columns', foreground: '#976715' },
    { token: 'strings', foreground: '#e2574e' },
    { token: 'string', foreground: '#e2574e' },
    { token: 'number', foreground: '#e2574e' },
    { token: 'numbers', foreground: '#e2574e' }
  ],
  colors: {
    // 'editor.foreground': '#FFFFFF99',
    // 'editor.background': '#f2f2f7',
    'editor.lineHighlightBackground': '#00000000',
    'editor.lineHighlightBorder': '#00000000'
    // 'editorCursor.foreground': '#8B0000',
    // 'editor.lineHighlightBackground': '#0000FF20',
    // 'editorLineNumber.foreground': '#008800',
    // 'editor.selectionBackground': '#F4F4F43B'
    // 'editor.inactiveSelectionBackground': '#88000015'
  }
};

export const SparkQueryThemeLight = {
  base: 'vs',
  inherit: true,
  rules: [
    // { background: '#ffffff' },
    { token: 'tables', foreground: '#447bef' },
    { token: 'columns', foreground: '#976715' }
  ],
  colors: {
    // 'editor.foreground': '#FFFFFF99',
    // 'editor.background': '#f2f2f7',
    'editor.lineHighlightBackground': '#00000000',
    'editor.lineHighlightBorder': '#00000000'
    // 'editorCursor.foreground': '#8B0000',
    // 'editor.lineHighlightBackground': '#0000FF20',
    // 'editorLineNumber.foreground': '#008800',
    // 'editor.selectionBackground': '#F4F4F43B'
    // 'editor.inactiveSelectionBackground': '#88000015'
  }
};
