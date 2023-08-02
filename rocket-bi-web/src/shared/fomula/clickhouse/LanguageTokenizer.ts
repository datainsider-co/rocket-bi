import monaco from 'monaco-editor';
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// Base on https://github.com/microsoft/monaco-languages/blob/main/src/sql/sql.ts
// base on https://github.com/microsoft/monaco-editor/blob/main/src/basic-languages/sql/sql.ts
export const BaseSqlLanguage: monaco.languages.IMonarchLanguage = {
  ignoreCase: true,
  brackets: [
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' }
    // { open: '`', close: '`', token: 'delimiter.prime' }
  ],
  keywords: [],
  operators: [
    // Logical
    'ALL',
    'AND',
    'ANY',
    'BETWEEN',
    'EXISTS',
    'IN',
    'LIKE',
    'NOT',
    'OR',
    'SOME',
    // Set
    'EXCEPT',
    'INTERSECT',
    'UNION',
    // Join
    'APPLY',
    'CROSS',
    'FULL',
    'INNER',
    'JOIN',
    'LEFT',
    'OUTER',
    'RIGHT',
    // Predicates
    'CONTAINS',
    'FREETEXT',
    'IS',
    'NULL',
    // Merging
    'MATCHED',
    'ON'
  ],
  databases: [],
  tables: [],
  columns: [],
  symbols: /[=><!~?:&|+\-*/^%]+/,
  tokenizer: {
    root: [
      { include: '@comments' },
      { include: '@whitespace' },
      { include: '@numbers' },
      { include: '@strings' },
      { include: '@complexIdentifiers' },
      // [/[;,.]/, 'delimiter'],
      // [/[()]/, '@brackets']
      [
        /([\d\w\-_@#$]+)/,
        {
          cases: {
            '@databases': { token: 'databases', next: '@afterDatabase' },
            '@tables': { token: 'tables', next: '@afterTable' },
            '@keywords': 'keyword',
            '@columns': 'columns',
            '@operators': 'operator',
            '@default': 'identifier'
          }
        }
      ],
      [/[<>=!%&+\-*/|~^]/, 'operator']
    ],
    whitespace: [[/\s+/, 'white']],
    afterTable: [
      [/`/, 'backtick', '@afterTable'],
      [/\./, 'source', '@afterTable'],
      [/([\d\w\-._@#$]+)/, 'columns', '@popall'],
      [/\s/, 'white', '@popall'],
      [/\n/, 'enter', '@popall']
    ],
    afterDatabase: [
      [/`/, 'backtick', '@afterDatabase'],
      [
        /([\d\w\-_@#$]+)/,
        {
          cases: {
            '@tables': { token: 'tables', next: '@afterTable' }
          }
        }
      ],
      [/\s/, 'white', '@pop']
    ],
    comments: [
      [/--+.*/, 'comment'],
      [/\/\*/, { token: 'comment.quote', next: '@comment' }]
    ],
    comment: [
      [/[^*/]+/, 'comment'],
      // Not supporting nested comments, as nested comments seem to not be standard?
      // i.e. http://stackoverflow.com/questions/728172/are-there-multiline-comment-delimiters-in-sql-that-are-vendor-agnostic
      // [/\/\*/, { token: 'comment.quote', next: '@push' }],    // nested comment not allowed :-(
      [/\*\//, { token: 'comment.quote', next: '@pop' }],
      [/./, 'comment']
    ],
    numbers: [
      [/0[xX][0-9a-fA-F]*/, 'number'],
      [/[$][+-]*\d*(\.\d*)?\b/, 'number'],
      [/((\d+(\.\d*)?)|(\.\d+))([eE][-+]?\d+)?\b/, 'number']
    ],
    strings: [[/'/, { token: 'string', next: '@string' }]],
    string: [
      [/[^']+/, 'string'],
      [/''/, 'string'],
      [/'/, { token: 'string', next: '@pop' }]
    ],
    complexIdentifiers: [
      [/\[/, { token: 'identifier.quote', next: '@bracketedIdentifier' }],
      [/"/, { token: 'identifier.quote', next: '@quotedIdentifier' }]
      // [/`/, { token: 'start', next: '@primedIdentifier' }]
    ],
    bracketedIdentifier: [
      [/[^\]]+/, 'identifier'],
      [/]]/, 'identifier'],
      [/]/, { token: 'identifier.quote', next: '@pop' }]
    ],
    quotedIdentifier: [
      [/[^"]+/, 'identifier'],
      [/""/, 'identifier'],
      [/"/, { token: 'identifier.quote', next: '@pop' }]
    ]
  }
} as monaco.languages.IMonarchLanguage;
