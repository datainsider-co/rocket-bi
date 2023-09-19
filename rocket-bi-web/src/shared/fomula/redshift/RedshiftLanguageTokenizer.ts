import monaco from 'monaco-editor';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const RedshiftLanguageConfig: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '--',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ]
};

export const RedshiftLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  // tokenPostfix: '.sql',
  ignoreCase: true,

  brackets: [
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' }
  ],
  keywords: [],
  databases: [],
  tables: [],
  columns: [],
  operators: ['AND', 'BETWEEN', 'IN', 'LIKE', 'NOT', 'OR', 'IS', 'NULL', 'INTERSECT', 'UNION', 'INNER', 'JOIN', 'LEFT', 'OUTER', 'RIGHT'],
  builtinVariables: [
    // NOT SUPPORTED
  ],
  pseudoColumns: [
    // NOT SUPPORTED
  ],
  tokenizer: {
    root: [
      { include: '@comments' },
      { include: '@whitespace' },
      { include: '@pseudoColumns' },
      { include: '@numbers' },
      { include: '@strings' },
      { include: '@complexIdentifiers' },
      { include: '@scopes' },
      // [/[;,.]/, 'delimiter'],
      // [/[()]/, '@brackets'],
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
      // [
      //   /[\w@#$]+/,
      //   {
      //     cases: {
      //       '@operators': 'operator',
      //       '@builtinVariables': 'predefined',
      //       '@builtinFunctions': 'predefined',
      //       '@keywords': 'keyword',
      //       '@default': 'identifier'
      //     }
      //   }
      // ],
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
      [/#+.*/, 'comment'],
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
    pseudoColumns: [
      [
        /[$][A-Za-z_][\w@#$]*/,
        {
          cases: {
            '@pseudoColumns': 'predefined',
            '@default': 'identifier'
          }
        }
      ]
    ],
    numbers: [
      [/0[xX][0-9a-fA-F]*/, 'number'],
      [/[$][+-]*\d*(\.\d*)?/, 'number'],
      [/((\d+(\.\d*)?)|(\.\d+))([eE][-+]?\d+)?/, 'number']
    ],
    strings: [
      [/'/, { token: 'string', next: '@string' }],
      [/"/, { token: 'string.double', next: '@stringDouble' }]
    ],
    string: [
      [/[^']+/, 'string'],
      [/''/, 'string'],
      [/'/, { token: 'string', next: '@pop' }]
    ],
    stringDouble: [
      [/[^"]+/, 'string.double'],
      [/""/, 'string.double'],
      [/"/, { token: 'string.double', next: '@pop' }]
    ],
    complexIdentifiers: [[/`/, { token: 'identifier.quote', next: '@quotedIdentifier' }]],
    quotedIdentifier: [
      [/[^`]+/, 'identifier'],
      [/``/, 'identifier'],
      [/`/, { token: 'identifier.quote', next: '@pop' }]
    ],
    scopes: [
      // NOT SUPPORTED
    ]
  }
} as monaco.languages.IMonarchLanguage;
