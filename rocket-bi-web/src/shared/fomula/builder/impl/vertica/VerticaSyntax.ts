export const getVerticaSyntax = () => ({
  languageConfiguration: {
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
  },
  monarchLanguage: {
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
  },
  name: 'vertica',
  supportedFunction: {
    Aggregate: [
      {
        name: 'AVG',
        description: 'Calculates the average value of a numeric column.',
        example: 'SELECT AVG(column_name) FROM table_name;'
      },
      {
        name: 'BIT_AND',
        description: 'Calculates the bitwise AND for a bit column.',
        example: 'SELECT BIT_AND(column_name) FROM table_name;'
      },
      {
        name: 'BIT_OR',
        description: 'Calculates the bitwise OR for a bit column.',
        example: 'SELECT BIT_OR(column_name) FROM table_name;'
      },
      {
        name: 'BIT_XOR',
        description: 'Calculates the bitwise XOR for a bit column.',
        example: 'SELECT BIT_XOR(column_name) FROM table_name;'
      },
      {
        name: 'COUNT',
        description: 'Counts the number of rows in a group or the number of non-NULL values in a column.',
        example: 'SELECT COUNT(*) FROM table_name;'
      },
      {
        name: 'COUNT_BIG',
        description: 'Counts the number of rows in a group or the number of non-NULL values in a column as a BIGINT.',
        example: 'SELECT COUNT_BIG(*) FROM table_name;'
      },
      {
        name: 'COVAR_POP',
        description: 'Calculates the population covariance for two columns.',
        example: 'SELECT COVAR_POP(column1, column2) FROM table_name;'
      },
      {
        name: 'COVAR_SAMP',
        description: 'Calculates the sample covariance for two columns.',
        example: 'SELECT COVAR_SAMP(column1, column2) FROM table_name;'
      },
      {
        name: 'CORR',
        description: 'Calculates the correlation coefficient for two columns.',
        example: 'SELECT CORR(column1, column2) FROM table_name;'
      },
      {
        name: 'MAX',
        description: 'Returns the maximum value in a column.',
        example: 'SELECT MAX(column_name) FROM table_name;'
      },
      {
        name: 'MEDIAN',
        description: 'Calculates the median value of a numeric column.',
        example: 'SELECT MEDIAN(column_name) FROM table_name;'
      },
      {
        name: 'MIN',
        description: 'Returns the minimum value in a column.',
        example: 'SELECT MIN(column_name) FROM table_name;'
      },
      {
        name: 'PERCENTILE_CONT',
        description: 'Calculates the percentile value for a numeric column.',
        example: 'SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'PERCENTILE_DISC',
        description: 'Finds the exact value of the percentile for a numeric column.',
        example: 'SELECT PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'STDDEV',
        description: 'Calculates the standard deviation of a numeric column.',
        example: 'SELECT STDDEV(column_name) FROM table_name;'
      },
      {
        name: 'STDDEV_POP',
        description: 'Calculates the population standard deviation of a numeric column.',
        example: 'SELECT STDDEV_POP(column_name) FROM table_name;'
      },
      {
        name: 'STDDEV_SAMP',
        description: 'Calculates the sample standard deviation of a numeric column.',
        example: 'SELECT STDDEV_SAMP(column_name) FROM table_name;'
      },
      {
        name: 'SUM',
        description: 'Calculates the sum of a numeric column.',
        example: 'SELECT SUM(column_name) FROM table_name;'
      },
      {
        name: 'VAR_POP',
        description: 'Calculates the population variance of a numeric column.',
        example: 'SELECT VAR_POP(column_name) FROM table_name;'
      },
      {
        name: 'VAR_SAMP',
        description: 'Calculates the sample variance of a numeric column.',
        example: 'SELECT VAR_SAMP(column_name) FROM table_name;'
      },
      {
        name: 'VARIANCE',
        description: 'Calculates the variance of a numeric column.',
        example: 'SELECT VARIANCE(column_name) FROM table_name;'
      },
      {
        name: 'BOOL_AND',
        description: 'Checks if all values in a boolean column are TRUE.',
        example: 'SELECT BOOL_AND(column_name) FROM table_name;'
      },
      {
        name: 'BOOL_OR',
        description: 'Checks if at least one value is TRUE in a boolean column.',
        example: 'SELECT BOOL_OR(column_name) FROM table_name;'
      },
      {
        name: 'FIRST_VALUE',
        description: 'Returns the first value in a group of data.',
        example: 'SELECT FIRST_VALUE(column_name) FROM table_name;'
      },
      {
        name: 'LAST_VALUE',
        description: 'Returns the last value in a group of data.',
        example: 'SELECT LAST_VALUE(column_name) FROM table_name;'
      },
      {
        name: 'STRING_AGG',
        description: 'Combines values in a column into a string based on a condition.',
        example: "SELECT STRING_AGG(column_name, ',') FROM table_name;"
      },
      {
        name: 'ARRAY_AGG',
        description: 'Combines values in a column into an array.',
        example: 'SELECT ARRAY_AGG(column_name) FROM table_name;'
      },
      {
        name: 'GROUP_CONCAT',
        description: 'Combines values in a column into a text string.',
        example: "SELECT GROUP_CONCAT(column_name, ',') FROM table_name;"
      },
      {
        name: 'APPROXIMATE_COUNT_DISTINCT',
        description: 'Estimates the number of distinct values in a column.',
        example: 'SELECT APPROXIMATE_COUNT_DISTINCT(column_name) FROM table_name;'
      },
      {
        name: 'KURTOSIS',
        description: 'Calculates the kurtosis for a numeric column.',
        example: 'SELECT KURTOSIS(column_name) FROM table_name;'
      },
      {
        name: 'NTH_VALUE',
        description: 'Returns the value at the nth position in a group of data.',
        example: 'SELECT NTH_VALUE(column_name, n) FROM table_name;'
      },
      {
        name: 'PERCENTILE_CONT_WITHIN_GROUP',
        description: 'Calculates the percentile within a group of data.',
        example: 'SELECT PERCENTILE_CONT_WITHIN_GROUP(0.5) OVER (PARTITION BY group_column ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'PERCENTILE_DISC_WITHIN_GROUP',
        description: 'Finds the exact value of the percentile within a group of data.',
        example: 'SELECT PERCENTILE_DISC_WITHIN_GROUP(0.5) OVER (PARTITION BY group_column ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'POPULATE_OCCURRENCES',
        description: 'Fills values from an array into a table.',
        example: 'SELECT POPULATE_OCCURRENCES(table_name, array_column) FROM table_name;'
      },
      {
        name: 'RANK',
        description: 'Assigns a rank to each row in a group of data.',
        example: 'SELECT RANK() OVER (PARTITION BY group_column ORDER BY sort_column) FROM table_name;'
      },
      {
        name: 'ROW_NUMBER',
        description: 'Assigns a unique number to each row in the query result.',
        example: 'SELECT ROW_NUMBER() OVER (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'SKEW',
        description: 'Calculates the skewness for a numeric column.',
        example: 'SELECT SKEW(column_name) FROM table_name;'
      },
      {
        name: 'STRING_AGG_WITHIN_GROUP',
        description: 'Combines values in a column into a text string within a group of data.',
        example: "SELECT STRING_AGG_WITHIN_GROUP(column_name, ',') OVER (PARTITION BY group_column) FROM table_name;"
      },
      {
        name: 'VARIANCE_POP_WITHIN_GROUP',
        description: 'Calculates the population variance within a group of data.',
        example: 'SELECT VARIANCE_POP_WITHIN_GROUP(column_name) OVER (PARTITION BY group_column) FROM table_name;'
      },
      {
        name: 'VARIANCE_SAMP_WITHIN_GROUP',
        description: 'Calculates the sample variance within a group of data.',
        example: 'SELECT VARIANCE_SAMP_WITHIN_GROUP(column_name) OVER (PARTITION BY group_column) FROM table_name;'
      },
      {
        name: 'VARIANCE_WITHIN_GROUP',
        description: 'Calculates the variance within a group of data.',
        example: 'SELECT VARIANCE_WITHIN_GROUP(column_name) OVER (PARTITION BY group_column) FROM table_name;'
      },
      {
        name: 'XOR_AGG',
        description: 'Calculates the XOR of bit values in a group of data.',
        example: 'SELECT XOR_AGG(bit_column) FROM table_name;'
      },
      {
        name: 'XPERCENTILE_CONT',
        description: 'Calculates the percentile for bit data.',
        example: 'SELECT XPERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bit_column) FROM table_name;'
      }
    ],
    Analytic: [
      {
        name: 'AVG',
        description: 'Calculates the average value of an expression over a window.',
        example: 'SELECT AVG(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'BIT_AND',
        description: 'Calculates the bitwise AND of an expression over a window.',
        example: 'SELECT BIT_AND(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'BIT_OR',
        description: 'Calculates the bitwise OR of an expression over a window.',
        example: 'SELECT BIT_OR(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'BIT_XOR',
        description: 'Calculates the bitwise XOR of an expression over a window.',
        example: 'SELECT BIT_XOR(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'COUNT',
        description: 'Counts the number of rows in a window.',
        example: 'SELECT COUNT(*) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'COVAR_POP',
        description: 'Calculates the population covariance of two expressions over a window.',
        example:
          'SELECT COVAR_POP(expression1, expression2) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'COVAR_SAMP',
        description: 'Calculates the sample covariance of two expressions over a window.',
        example:
          'SELECT COVAR_SAMP(expression1, expression2) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'CORR',
        description: 'Calculates the correlation coefficient of two expressions over a window.',
        example: 'SELECT CORR(expression1, expression2) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'CUME_DIST',
        description: 'Calculates the cumulative distribution of an expression over a window.',
        example: 'SELECT CUME_DIST() OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'DENSE_RANK',
        description: 'Assigns a unique rank to each distinct row in a window, leaving no gaps.',
        example: 'SELECT DENSE_RANK() OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'FIRST_VALUE',
        description: 'Returns the first value in a window.',
        example: 'SELECT FIRST_VALUE(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'LAG',
        description: 'Accesses data from a previous row in a window.',
        example: 'SELECT LAG(column_name, offset, default_value) OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'LAST_VALUE',
        description: 'Returns the last value in a window.',
        example: 'SELECT LAST_VALUE(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'LEAD',
        description: 'Accesses data from a following row in a window.',
        example: 'SELECT LEAD(column_name, offset, default_value) OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'MAX',
        description: 'Returns the maximum value of an expression over a window.',
        example: 'SELECT MAX(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'MEDIAN',
        description: 'Calculates the median value of an expression over a window.',
        example: 'SELECT MEDIAN(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'MIN',
        description: 'Returns the minimum value of an expression over a window.',
        example: 'SELECT MIN(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'NTH_VALUE',
        description: 'Returns the value at the nth position in a window.',
        example: 'SELECT NTH_VALUE(column_name, n) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'NTILE',
        description: 'Divides the result set into equally-sized buckets.',
        example: 'SELECT NTILE(n) OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'PERCENT_RANK',
        description: 'Calculates the percentage rank of a row in a window.',
        example: 'SELECT PERCENT_RANK() OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'PERCENTILE_CONT',
        description: 'Calculates the percentile value of an expression over a window.',
        example: 'SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY expression) OVER (PARTITION BY partition_column) FROM table_name;'
      },
      {
        name: 'PERCENTILE_DISC',
        description: 'Finds the exact value of the percentile for an expression over a window.',
        example: 'SELECT PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY expression) OVER (PARTITION BY partition_column) FROM table_name;'
      },
      {
        name: 'RANK',
        description: 'Assigns a unique rank to each row in a window.',
        example: 'SELECT RANK() OVER (PARTITION BY partition_column ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'RATIO_TO_REPORT',
        description: 'Calculates the ratio of an expression to the sum of the expression over a window.',
        example: 'SELECT RATIO_TO_REPORT(expression) OVER (PARTITION BY partition_column) FROM table_name;'
      },
      {
        name: 'ROW_NUMBER',
        description: 'Assigns a unique number to each row in the query result.',
        example: 'SELECT ROW_NUMBER() OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'STDDEV',
        description: 'Calculates the population standard deviation of an expression over a window.',
        example: 'SELECT STDDEV(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'STDDEV_POP',
        description: 'Calculates the population standard deviation of an expression over a window.',
        example: 'SELECT STDDEV_POP(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'STDDEV_SAMP',
        description: 'Calculates the sample standard deviation of an expression over a window.',
        example: 'SELECT STDDEV_SAMP(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'SUM',
        description: 'Calculates the sum of an expression over a window.',
        example: 'SELECT SUM(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'VAR_POP',
        description: 'Calculates the population variance of an expression over a window.',
        example: 'SELECT VAR_POP(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'VAR_SAMP',
        description: 'Calculates the sample variance of an expression over a window.',
        example: 'SELECT VAR_SAMP(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'VARIANCE',
        description: 'Calculates the variance of an expression over a window.',
        example: 'SELECT VARIANCE(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'STRING_AGG',
        description: 'Combines values in an expression into a string based on a condition over a window.',
        example: "SELECT STRING_AGG(expression, ',') OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;"
      },
      {
        name: 'ARRAY_AGG',
        description: 'Combines values in an expression into an array over a window.',
        example: 'SELECT ARRAY_AGG(expression) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'GROUP_CONCAT',
        description: 'Combines values in an expression into a text string over a window.',
        example: "SELECT GROUP_CONCAT(expression, ',') OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;"
      },
      {
        name: 'LEAD',
        description: 'Accesses data from a following row in a window.',
        example:
          'SELECT LEAD(column_name, offset, default_value) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'PERCENTILE_CONT_WITHIN_GROUP',
        description: 'Calculates the percentile value within a group of data over a window.',
        example:
          'SELECT PERCENTILE_CONT_WITHIN_GROUP(0.5) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'PERCENTILE_DISC_WITHIN_GROUP',
        description: 'Finds the exact value of the percentile within a group of data over a window.',
        example:
          'SELECT PERCENTILE_DISC_WITHIN_GROUP(0.5) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'POPULATE_OCCURRENCES',
        description: 'Fills values from an array into a table.',
        example:
          'SELECT POPULATE_OCCURRENCES(table_name, array_column) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'RANK',
        description: 'Assigns a unique rank to each row in a group of data over a window.',
        example: 'SELECT RANK() OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'ROW_NUMBER',
        description: 'Assigns a unique number to each row in the query result over a window.',
        example: 'SELECT ROW_NUMBER() OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'SKEW',
        description: 'Calculates the skewness of an expression over a window.',
        example: 'SELECT SKEW(column_name) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'STRING_AGG_WITHIN_GROUP',
        description: 'Combines values in an expression into a text string within a group of data over a window.',
        example:
          "SELECT STRING_AGG_WITHIN_GROUP(expression, ',') OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;"
      },
      {
        name: 'VARIANCE_POP_WITHIN_GROUP',
        description: 'Calculates the population variance within a group of data over a window.',
        example:
          'SELECT VARIANCE_POP_WITHIN_GROUP(expression) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'VARIANCE_SAMP_WITHIN_GROUP',
        description: 'Calculates the sample variance within a group of data over a window.',
        example:
          'SELECT VARIANCE_SAMP_WITHIN_GROUP(expression) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'VARIANCE_WITHIN_GROUP',
        description: 'Calculates the variance within a group of data over a window.',
        example:
          'SELECT VARIANCE_WITHIN_GROUP(expression) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'XOR_AGG',
        description: 'Calculates the XOR of bit values in a group of data over a window.',
        example: 'SELECT XOR_AGG(bit_column) OVER (PARTITION BY partition_column ORDER BY order_column ROWS BETWEEN start AND end) FROM table_name;'
      },
      {
        name: 'XPERCENTILE_CONT',
        description: 'Calculates the percentile for bit data over a window.',
        example:
          'SELECT XPERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY expression) OVER (PARTITION BY partition_column ROWS BETWEEN start AND end) FROM table_name;'
      }
    ],
    Aws: [
      {
        name: 'AWS_GET_CONFIG',
        description: 'Retrieves the current AWS configuration.',
        example: 'SELECT AWS_GET_CONFIG();'
      },
      {
        name: 'AWS_SET_CONFIG',
        description: 'Sets AWS configuration options for the current session.',
        example: "SELECT AWS_SET_CONFIG('region', 'us-west-2');"
      },
      {
        name: 'S3EXPORT',
        description: 'Exports data from a table to an S3 bucket.',
        example: "SELECT S3EXPORT('my_table', 's3://my_bucket/data.csv', 'delimiter=','');"
      },
      {
        name: 'S3EXPORT_PARTITION',
        description: 'Exports data from a table partition to an S3 bucket.',
        example: "SELECT S3EXPORT_PARTITION('my_table', 'my_partition_column=my_partition_value', 's3://my_bucket/data.csv', 'delimiter=','');"
      }
    ],
    Catalog: [
      {
        name: 'DROP_LICENSE',
        title: 'DROP_LICENSE(license_key)',
        description: 'Removes a license from the current database.',
        example: "DROP_LICENSE('my_license_key');"
      },
      {
        name: 'DUMP_CATALOG',
        title: 'DUMP_CATALOG(catalog_path)',
        description: 'Dumps the entire database catalog to a specified path.',
        example: "DUMP_CATALOG('/backup/catalog_backup');"
      },
      {
        name: 'EXPORT_CATALOG',
        title: 'EXPORT_CATALOG(catalog_path)',
        description: 'Exports the entire database catalog to a specified path.',
        example: "EXPORT_CATALOG('/backup/catalog_export');"
      },
      {
        name: 'EXPORT_OBJECTS',
        title: 'EXPORT_OBJECTS(object_list, path)',
        description: 'Exports a list of database objects to a specified path.',
        example: "EXPORT_OBJECTS('public.my_table, schema1.my_view', '/backup/objects_export');"
      },
      {
        name: 'EXPORT_TABLES',
        title: 'EXPORT_TABLES(table_list, path)',
        description: 'Exports a list of tables to a specified path.',
        example: "EXPORT_TABLES('public.my_table, schema1.my_other_table', '/backup/tables_export');"
      },
      {
        name: 'INSTALL_LICENSE',
        title: 'INSTALL_LICENSE(license_file_path)',
        description: 'Installs a license into the current database.',
        example: "INSTALL_LICENSE('/licenses/my_license.dat');"
      },
      {
        name: 'MARK_DESIGN_KSAFE',
        title: 'MARK_DESIGN_KSAFE(ksafe_value)',
        description: 'Sets the K-Safety value for the current database design.',
        example: 'MARK_DESIGN_KSAFE(1);'
      },
      {
        name: 'RELOAD_ADMINTOOLS_CONF',
        title: 'RELOAD_ADMINTOOLS_CONF()',
        description: 'Reloads the AdminTools configuration from the disk.',
        example: 'RELOAD_ADMINTOOLS_CONF();'
      }
    ],
    Client: [
      {
        name: 'DESCRIBE_LOAD_BALANCE_DECISION',
        title: 'DESCRIBE_LOAD_BALANCE_DECISION(statement_id)',
        description: 'Describes the load balancing decision for a specific statement execution.',
        example: 'DESCRIBE_LOAD_BALANCE_DECISION(12345);'
      },
      {
        name: 'GET_CLIENT_LABEL',
        title: 'GET_CLIENT_LABEL()',
        description: 'Returns the client label assigned to the current session.',
        example: "GET_CLIENT_LABEL(); -- Result: 'my_app_client'"
      },
      {
        name: 'RESET_LOAD_BALANCE_POLICY',
        title: 'RESET_LOAD_BALANCE_POLICY()',
        description: 'Resets the load balancing policy to the default setting.',
        example: 'RESET_LOAD_BALANCE_POLICY();'
      },
      {
        name: 'SET_CLIENT_LABEL',
        title: 'SET_CLIENT_LABEL(label)',
        description: 'Sets a client label for the current session.',
        example: "SET_CLIENT_LABEL('my_app_client');"
      },
      {
        name: 'SET_LOAD_BALANCE_POLICY',
        title: 'SET_LOAD_BALANCE_POLICY(policy)',
        description: 'Sets the load balancing policy for the current session.',
        example: "SET_LOAD_BALANCE_POLICY('my_custom_policy');"
      }
    ],
    Cloud: [
      {
        name: 'AZURE_TOKEN_CACHE_CLEAR',
        title: 'AZURE_TOKEN_CACHE_CLEAR()',
        description:
          'Clears the cached access token for Azure. Call this function after changing the configuration of Azure managed identities.\n\nAn Azure object store can support and manage multiple identities. If multiple identities are in use, Vertica looks for an Azure tag with a key of VerticaManagedIdentityClientId, the value of which must be the client_id attribute of the managed identity to be used. If the Azure configuration changes, use this function to clear the cache.',
        example: ''
      }
    ],
    Cluster: [
      {
        name: 'REALIGN_CONTROL_NODES',
        title: 'REALIGN_CONTROL_NODES()',
        description:
          'Causes Vertica to re-evaluate which nodes in the cluster or subcluster are control nodes and which nodes are assigned to them as dependents when large cluster is enabled. Call this function after altering fault groups in an Enterprise Mode database, or changing the number of control nodes in either database mode. After calling this function, query the V_CATALOG.CLUSTER_LAYOUT system table to see the proposed new layout for nodes in the cluster. You must also take additional steps before the new control node assignments take effect. See Changing the Number of Control Nodes and Realigning for details.',
        example: 'SELECT REALIGN_CONTROL_NODES();'
      },
      {
        name: 'REBALANCE_CLUSTER',
        title: 'REBALANCE_CLUSTER()',
        description:
          'Rebalances the database cluster synchronously as a session foreground task. REBALANCE_CLUSTER returns only after the rebalance operation is complete. If the current session ends, the operation immediately aborts. To rebalance the cluster as a background task, call START_REBALANCE_CLUSTER.\n\nOn large cluster arrangements, you typically call REBALANCE_CLUSTER in a flow (see Changing the Number of Control Nodes and Realigning). After you change the number and distribution of control nodes (spread hosts), run REBALANCE_CLUSTER to achieve fault tolerance.',
        example: 'SELECT REBALANCE_CLUSTER();'
      },
      {
        name: 'RELOAD_SPREAD',
        title: 'RELOAD_SPREAD(true)',
        description:
          "Updates cluster changes to the catalog's Spread configuration file. These changes include:\n\nNew or realigned control nodes\nNew Spread hosts or fault group\nNew or dropped cluster nodes\nThis function is often used in a multi-step process for large and elastic cluster arrangements. Calling it might require you to restart the database. You must then rebalance the cluster to realize fault tolerance. ",
        example: 'SELECT reload_spread(true);'
      },
      {
        name: 'SET_CONTROL_SET_SIZE',
        title: 'SET_CONTROL_SET_SIZE( control_nodes )',
        description:
          'Sets the number of control nodes that participate in the spread service when large cluster is enabled. If the database is running in Enterprise Mode, this function sets the number of control nodes for the entire database cluster. If the database is running in Eon Mode, this function sets the number of control nodes in the subcluster you specify.',
        example: 'SELECT set_control_set_size(5);'
      },
      {
        name: 'SET_CONTROL_SET_SIZE',
        title: 'SET_CONTROL_SET_SIZE( control_nodes )',
        description:
          'Sets the number of control nodes that participate in the spread service when large cluster is enabled. If the database is running in Enterprise Mode, this function sets the number of control nodes for the entire database cluster. If the database is running in Eon Mode, this function sets the number of control nodes in the subcluster you specify.',
        example: 'SELECT set_control_set_size(5);'
      },
      {
        name: 'CANCEL_REBALANCE_CLUSTER',
        title: 'CANCEL_REBALANCE_CLUSTER()',
        description: 'Cancels an ongoing cluster rebalance operation.',
        example: 'CANCEL_REBALANCE_CLUSTER();'
      },
      {
        name: 'DISABLE_LOCAL_SEGMENTS',
        title: 'DISABLE_LOCAL_SEGMENTS()',
        description: 'Disables local segment storage to prepare for removing nodes from the cluster.',
        example: 'DISABLE_LOCAL_SEGMENTS();'
      },
      {
        name: 'ENABLE_ELASTIC_CLUSTER',
        title: 'ENABLE_ELASTIC_CLUSTER()',
        description: 'Enables elastic clustering on the current database.',
        example: 'ENABLE_ELASTIC_CLUSTER();'
      },
      {
        name: 'ENABLE_LOCAL_SEGMENTS',
        title: 'ENABLE_LOCAL_SEGMENTS()',
        description: 'Enables local segment storage after adding nodes to the cluster.',
        example: 'ENABLE_LOCAL_SEGMENTS();'
      },
      {
        name: 'SET_SCALING_FACTOR',
        title: 'SET_SCALING_FACTOR(adjustment_factor)',
        description: 'Sets the scaling factor for the current database.',
        example: 'SET_SCALING_FACTOR(1.5);'
      },
      {
        name: 'START_REBALANCE_CLUSTER',
        title: 'START_REBALANCE_CLUSTER()',
        description: 'Starts a cluster rebalance operation to redistribute data among nodes.',
        example: 'START_REBALANCE_CLUSTER();'
      }
    ],
    Collection: [
      {
        name: 'APPLY_AVG',
        description: 'Calculates the average value of elements in an array.',
        example: 'SELECT APPLY_AVG(array_column) FROM table_name;'
      },
      {
        name: 'APPLY_COUNT',
        description: 'Counts the number of non-NULL elements in an array.',
        example: 'SELECT APPLY_COUNT(array_column) FROM table_name;'
      },
      {
        name: 'APPLY_COUNT_ELEMENTS',
        description: 'Counts the number of elements in an array.',
        example: 'SELECT APPLY_COUNT_ELEMENTS(array_column) FROM table_name;'
      },
      {
        name: 'APPLY_MAX',
        description: 'Finds the maximum value in an array.',
        example: 'SELECT APPLY_MAX(array_column) FROM table_name;'
      },
      {
        name: 'APPLY_MIN',
        description: 'Finds the minimum value in an array.',
        example: 'SELECT APPLY_MIN(array_column) FROM table_name;'
      },
      {
        name: 'APPLY_SUM',
        description: 'Calculates the sum of elements in an array.',
        example: 'SELECT APPLY_SUM(array_column) FROM table_name;'
      },
      {
        name: 'ARRAY_CAT',
        description: 'Concatenates two or more arrays.',
        example: 'SELECT ARRAY_CAT(array_column1, array_column2, ..., array_columnN) FROM table_name;'
      },
      {
        name: 'ARRAY_CONTAINS',
        description: 'Checks if an array contains a specific value.',
        example: 'SELECT ARRAY_CONTAINS(array_column, value) FROM table_name;'
      },
      {
        name: 'ARRAY_COUNT',
        description: 'Counts the number of elements in an array.',
        example: 'SELECT ARRAY_COUNT(array_column) FROM table_name;'
      },
      {
        name: 'ARRAY_DIMS',
        description: 'Returns the number of dimensions in an array.',
        example: 'SELECT ARRAY_DIMS(array_column) FROM table_name;'
      },
      {
        name: 'ARRAY_FIND',
        description: 'Searches for a value in an array and returns its index.',
        example: 'SELECT ARRAY_FIND(array_column, value) FROM table_name;'
      },
      {
        name: 'ARRAY_LENGTH',
        description: 'Returns the length of an array.',
        example: 'SELECT ARRAY_LENGTH(array_column) FROM table_name;'
      },
      {
        name: 'CONTAINS',
        description: 'Checks if an array contains a specific value.',
        example: 'SELECT CONTAINS(array_column, value) FROM table_name;'
      },
      {
        name: 'EXPLODE',
        description: 'Transforms an array into a set of rows.',
        example: 'SELECT EXPLODE(array_column) FROM table_name;'
      },
      {
        name: 'IMPLODE',
        description: 'Combines values from multiple rows into an array.',
        example: 'SELECT IMPLODE(column_name, separator) FROM table_name;'
      },
      {
        name: 'SET_UNION',
        description: 'Combines two or more arrays into a single array, removing duplicates.',
        example: 'SELECT SET_UNION(array_column1, array_column2, ..., array_columnN) FROM table_name;'
      },
      {
        name: 'STRING_TO_ARRAY',
        description: 'Converts a string to an array using a specified separator.',
        example: 'SELECT STRING_TO_ARRAY(string_column, separator) FROM table_name;'
      },
      {
        name: 'TO_JSON',
        description: 'Converts an array to JSON format.',
        example: 'SELECT TO_JSON(array_column) FROM table_name;'
      }
    ],
    Communications: [
      {
        name: 'NOTIFY',
        title: "NOTIFY ( 'message', 'notifier', 'target‑topic' ) ",
        description: 'Specifies the text message to include with a notification.',
        example: "SELECT NOTIFY('ETL Done!', 'my_notifier', 'DB_activity_topic');"
      }
    ],
    Constraint: [
      {
        name: 'ANALYZE_CONSTRAINTS',
        title: 'ANALYZE_CONSTRAINTS()',
        description: 'Analyzes constraints to update the constraint information.',
        example: 'ANALYZE_CONSTRAINTS();'
      },
      {
        name: 'ANALYZE_CORRELATIONS',
        title: 'ANALYZE_CORRELATIONS(table_name, column_list)',
        description: 'Analyzes the correlation between columns in a specified table.',
        example: "ANALYZE_CORRELATIONS('my_table', 'col1, col2');"
      },
      {
        name: 'DISABLE_DUPLICATE_KEY_ERROR',
        title: 'DISABLE_DUPLICATE_KEY_ERROR()',
        description: 'Disables the duplicate key error in a session.',
        example: 'DISABLE_DUPLICATE_KEY_ERROR();'
      },
      {
        name: 'LAST_INSERT_ID',
        title: 'LAST_INSERT_ID()',
        description: 'Returns the last inserted row ID in the current session.',
        example: 'LAST_INSERT_ID(); -- Result: 12345'
      },
      {
        name: 'REENABLE_DUPLICATE_KEY_ERROR',
        title: 'REENABLE_DUPLICATE_KEY_ERROR()',
        description: 'Re-enables the duplicate key error in a session.',
        example: 'REENABLE_DUPLICATE_KEY_ERROR();'
      }
    ],
    DataCollector: [
      {
        name: 'CLEAR_DATA_COLLECTOR',
        title: 'CLEAR_DATA_COLLECTOR()',
        description: 'Clears all data collected by Data Collector.',
        example: 'CLEAR_DATA_COLLECTOR();'
      },
      {
        name: 'DATA_COLLECTOR_HELP',
        title: 'DATA_COLLECTOR_HELP()',
        description: 'Displays help information for Data Collector commands.',
        example: 'DATA_COLLECTOR_HELP();'
      },
      {
        name: 'FLUSH_DATA_COLLECTOR',
        title: 'FLUSH_DATA_COLLECTOR()',
        description: 'Forces Data Collector to flush the current set of metrics to the database.',
        example: 'FLUSH_DATA_COLLECTOR();'
      },
      {
        name: 'GET_DATA_COLLECTOR_NOTIFY_POLICY',
        title: 'GET_DATA_COLLECTOR_NOTIFY_POLICY()',
        description: 'Gets the current notification policy for Data Collector.',
        example: "GET_DATA_COLLECTOR_NOTIFY_POLICY(); -- Result: 'ALL'"
      },
      {
        name: 'GET_DATA_COLLECTOR_POLICY',
        title: 'GET_DATA_COLLECTOR_POLICY()',
        description: 'Gets the current data collection policy for Data Collector.',
        example: "GET_DATA_COLLECTOR_POLICY(); -- Result: 'LATEST ON ERROR'"
      },
      {
        name: 'SET_DATA_COLLECTOR_NOTIFY_POLICY',
        title: 'SET_DATA_COLLECTOR_NOTIFY_POLICY(policy)',
        description: 'Sets the notification policy for Data Collector.',
        example: "SET_DATA_COLLECTOR_NOTIFY_POLICY('ON ERROR');"
      },
      {
        name: 'SET_DATA_COLLECTOR_POLICY',
        title: 'SET_DATA_COLLECTOR_POLICY(policy)',
        description: 'Sets the data collection policy for Data Collector.',
        example: "SET_DATA_COLLECTOR_POLICY('ALL');"
      },
      {
        name: 'SET_DATA_COLLECTOR_TIME_POLICY',
        title: 'SET_DATA_COLLECTOR_TIME_POLICY(policy)',
        description: 'Sets the time-based data collection policy for Data Collector.',
        example: "SET_DATA_COLLECTOR_TIME_POLICY('EVERY 1 MINUTE');"
      }
    ],
    DataPreparation: [
      {
        name: 'BALANCE',
        title: "BALANCE('output‑view', 'input‑relation', 'response‑column', 'balance‑method')",
        description: 'Creates balanced samples by oversampling or undersampling.',
        example: "SELECT BALANCE('output_table','input_table' 'class_column', 'balance_by_column');"
      },
      {
        name: 'CORR_MATRIX',
        title: 'CORR_MATRIX(input-columns)',
        description: 'Calculates the correlation matrix for numeric columns.',
        example: "SELECT CORR_MATRIX('input_table');"
      },
      {
        name: 'DETECT_OUTLIERS',
        title: "DETECT_OUTLIERS('output‑table', 'input‑relation','input‑columns', 'detection‑method' )",
        description: 'Detects outliers in numeric columns using the Z-score method.',
        example: "SELECT DETECT_OUTLIERS('output_table','input_table', 'numeric_columns', 'threshold');"
      },
      {
        name: 'IMPUTE',
        title: 'IMPUTE',
        description: 'Imputes missing values in numeric columns using various methods.',
        example: "SELECT IMPUTE('input_table', 'output_table', 'impute_column', 'method');"
      },
      {
        name: 'NORMALIZE',
        title: "NORMALIZE('output‑view', 'input‑relation', 'input‑columns', 'method')",
        description: 'Performs min-max scaling on numeric columns.',
        example: "SELECT NORMALIZE('output_table','input_table', 'numeric_columns', 'output_min_max', 'input_min_max');"
      },
      {
        name: 'NORMALIZE_FIT',
        title: "NORMALIZE_FIT('model‑name', 'input‑relation', 'input‑columns', 'normalization‑method')",
        description: 'Fits the normalization parameters for later use with the NORMALIZE function.',
        example: "SELECT NORMALIZE_FIT('input_table', 'output_table', 'numeric_columns', 'output_min_max');"
      },
      {
        name: 'ONE_HOT_ENCODER_FIT',
        title: "ONE_HOT_ENCODER_FIT('model‑name', 'input‑relation','input‑columns')",
        description: 'Generates a sorted list of each of the category levels for each feature to be encoded, and stores the model.',
        example: "SELECT ONE_HOT_ENCODER_FIT('input_table', 'output_table', 'categorical_columns');"
      },
      {
        name: 'PCA',
        title: "PCA('model‑name', 'input‑relation', 'input‑columns')",
        description:
          'Computes principal components from the input table/view. The results are saved in a PCA model. Internally, PCA finds the components by using SVD on the co-variance matrix built from the input date. The singular values of this decomposition are also saved as part of the PCA model. The signs of all elements of a principal component could be flipped all together on different runs.',
        example: "SELECT PCA('input_table', 'output_table', 'numeric_columns', 'num_components');"
      },
      {
        name: 'SUMMARIZE_CATCOL',
        title: 'SUMMARIZE_CATCOL(target‑column)',
        description: 'Returns a statistical summary of categorical data input',
        example: "SELECT SUMMARIZE_CATCOL('input_table', 'output_table', 'categorical_columns');"
      },
      {
        name: 'SUMMARIZE_NUMCOL',
        title: 'SUMMARIZE_NUMCOL(input‑columns)',
        description: 'Returns a statistical summary of columns in a Vertica table',
        example: "SELECT SUMMARIZE_NUMCOL(* USING PARAMETERS exclude_columns='id,name,gender,title') OVER() FROM employee;"
      },
      {
        name: 'SVD',
        title: "SVD('model‑name', 'input‑relation', 'input‑columns')",
        description:
          'Computes singular values (the diagonal of the S matrix) and right singular vectors (the V matrix) of an SVD decomposition of the input relation. The results are saved as an SVD model. The signs of all elements of a singular vector in SVD could be flipped all together on different runs.',
        example: "SELECT SVD ('svdmodel', 'small_svd', 'x1,x2,x3,x4');"
      }
    ],
    Date: [
      {
        name: 'ADD_MONTHS',
        description: 'Adds a specified number of months to a date.',
        example: 'SELECT ADD_MONTHS(date_column, num_months) FROM table_name;'
      },
      {
        name: 'AGE_IN_MONTHS',
        description: 'Calculates the age in months between two dates.',
        example: 'SELECT AGE_IN_MONTHS(start_date, end_date) FROM table_name;'
      },
      {
        name: 'AGE_IN_YEARS',
        description: 'Calculates the age in years between two dates.',
        example: 'SELECT AGE_IN_YEARS(start_date, end_date) FROM table_name;'
      },
      {
        name: 'CLOCK_TIMESTAMP',
        description: 'Gets the current date and time as a timestamp.',
        example: 'SELECT CLOCK_TIMESTAMP() FROM table_name;'
      },
      {
        name: 'CURRENT_DATE',
        description: 'Gets the current date.',
        example: 'SELECT CURRENT_DATE FROM table_name;'
      },
      {
        name: 'CURRENT_TIME',
        description: 'Gets the current time.',
        example: 'SELECT CURRENT_TIME FROM table_name;'
      },
      {
        name: 'CURRENT_TIMESTAMP',
        description: 'Gets the current date and time as a timestamp.',
        example: 'SELECT CURRENT_TIMESTAMP FROM table_name;'
      },
      {
        name: 'DATE_PART',
        description: 'Extracts a specific component from a date or timestamp.',
        example: "SELECT DATE_PART('component', date_or_timestamp) FROM table_name;"
      },
      {
        name: 'DATE',
        description: 'Converts a string to a date.',
        example: "SELECT DATE('YYYY-MM-DD', date_string) FROM table_name;"
      },
      {
        name: 'DATE_TRUNC',
        description: 'Truncates a date or timestamp to a specific unit.',
        example: "SELECT DATE_TRUNC('unit', date_or_timestamp) FROM table_name;"
      },
      {
        name: 'DATEDIFF',
        description: 'Calculates the difference between two dates.',
        example: "SELECT DATEDIFF('unit', start_date, end_date) FROM table_name;"
      },
      {
        name: 'DAY',
        description: 'Gets the day of the month from a date.',
        example: 'SELECT DAY(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFMONTH',
        description: 'Gets the day of the month from a date.',
        example: 'SELECT DAYOFMONTH(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFWEEK',
        description: 'Gets the day of the week from a date.',
        example: 'SELECT DAYOFWEEK(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFWEEK_ISO',
        description: 'Gets the ISO day of the week from a date.',
        example: 'SELECT DAYOFWEEK_ISO(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFYEAR',
        description: 'Gets the day of the year from a date.',
        example: 'SELECT DAYOFYEAR(date_column) FROM table_name;'
      },
      {
        name: 'DAYS',
        description: 'Calculates the difference in days between two dates.',
        example: 'SELECT DAYS(start_date, end_date) FROM table_name;'
      },
      {
        name: 'EXTRACT',
        description: 'Extracts a specific component from a date or timestamp.',
        example: "SELECT EXTRACT('component' FROM date_or_timestamp) FROM table_name;"
      },
      {
        name: 'GETDATE',
        description: 'Gets the current date and time as a timestamp.',
        example: 'SELECT GETDATE() FROM table_name;'
      },
      {
        name: 'GETUTCDATE',
        description: 'Gets the current date and time as a UTC timestamp.',
        example: 'SELECT GETUTCDATE() FROM table_name;'
      },
      {
        name: 'HOUR',
        description: 'Gets the hour from a time or timestamp.',
        example: 'SELECT HOUR(time_or_timestamp) FROM table_name;'
      },
      {
        name: 'ISFINITE',
        description: 'Checks if a date or timestamp is finite.',
        example: 'SELECT ISFINITE(date_or_timestamp) FROM table_name;'
      },
      {
        name: 'JULIAN_DAY',
        description: 'Calculates the Julian day number for a date.',
        example: 'SELECT JULIAN_DAY(date_column) FROM table_name;'
      },
      {
        name: 'LAST_DAY',
        description: 'Gets the last day of the month for a date.',
        example: 'SELECT LAST_DAY(date_column) FROM table_name;'
      },
      {
        name: 'LOCALTIME',
        description: 'Gets the current time.',
        example: 'SELECT LOCALTIME FROM table_name;'
      },
      {
        name: 'LOCALTIMESTAMP',
        description: 'Gets the current date and time as a timestamp.',
        example: 'SELECT LOCALTIMESTAMP FROM table_name;'
      },
      {
        name: 'MICROSECOND',
        description: 'Gets the microsecond from a time or timestamp.',
        example: 'SELECT MICROSECOND(time_or_timestamp) FROM table_name;'
      },
      {
        name: 'MIDNIGHT_SECONDS',
        description: 'Calculates the number of seconds since midnight.',
        example: 'SELECT MIDNIGHT_SECONDS(time_column) FROM table_name;'
      },
      {
        name: 'MINUTE',
        description: 'Gets the minute from a time or timestamp.',
        example: 'SELECT MINUTE(time_or_timestamp) FROM table_name;'
      },
      {
        name: 'MONTH',
        description: 'Gets the month from a date or timestamp.',
        example: 'SELECT MONTH(date_or_timestamp) FROM table_name;'
      },
      {
        name: 'MONTHS_BETWEEN',
        description: 'Calculates the number of months between two dates.',
        example: 'SELECT MONTHS_BETWEEN(start_date, end_date) FROM table_name;'
      },
      {
        name: 'NEW_TIME',
        description: 'Converts a time from one time zone to another.',
        example: "SELECT NEW_TIME(time_column, 'from_tz', 'to_tz') FROM table_name;"
      },
      {
        name: 'NEXT_DAY',
        description: 'Finds the next occurrence of a specific day of the week after a date.',
        example: "SELECT NEXT_DAY(date_column, 'day_of_week') FROM table_name;"
      },
      {
        name: 'NOW [Date/Time]',
        description: 'Gets the current date and time as a timestamp.',
        example: 'SELECT NOW FROM table_name;'
      },
      {
        name: 'OVERLAPS',
        description: 'Checks if two time intervals overlap.',
        example: 'SELECT OVERLAPS(start1, end1, start2, end2) FROM table_name;'
      },
      {
        name: 'QUARTER',
        description: 'Gets the quarter from a date or timestamp.',
        example: 'SELECT QUARTER(date_or_timestamp) FROM table_name;'
      },
      {
        name: 'ROUND',
        description: 'Rounds a time or timestamp to a specific unit.',
        example: "SELECT ROUND(time_or_timestamp, 'unit') FROM table_name;"
      },
      {
        name: 'SECOND',
        description: 'Gets the second from a time or timestamp.',
        example: 'SELECT SECOND(time_or_timestamp) FROM table_name;'
      },
      {
        name: 'STATEMENT_TIMESTAMP',
        description: 'Gets the start time of the current statement.',
        example: 'SELECT STATEMENT_TIMESTAMP FROM table_name;'
      },
      {
        name: 'SYSDATE',
        description: 'Gets the current date and time as a timestamp.',
        example: 'SELECT SYSDATE FROM table_name;'
      },
      {
        name: 'TIME_SLICE',
        description: 'Truncates a time or timestamp to a specific interval.',
        example: "SELECT TIME_SLICE(time_or_timestamp, 'interval') FROM table_name;"
      },
      {
        name: 'TIMEOFDAY',
        description: 'Gets the current time as a string.',
        example: 'SELECT TIMEOFDAY FROM table_name;'
      },
      {
        name: 'TIMESTAMPADD',
        description: 'Adds a specified interval to a timestamp.',
        example: "SELECT TIMESTAMPADD('unit', num_intervals, timestamp_column) FROM table_name;"
      },
      {
        name: 'TIMESTAMPDIFF',
        description: 'Calculates the difference between two timestamps.',
        example: "SELECT TIMESTAMPDIFF('unit', start_timestamp, end_timestamp) FROM table_name;"
      },
      {
        name: 'TIMESTAMP_ROUND',
        description: 'Rounds a timestamp to a specific unit.',
        example: "SELECT TIMESTAMP_ROUND(timestamp_column, 'unit') FROM table_name;"
      },
      {
        name: 'TIMESTAMP_TRUNC',
        description: 'Truncates a timestamp to a specific unit.',
        example: "SELECT TIMESTAMP_TRUNC(timestamp_column, 'unit') FROM table_name;"
      },
      {
        name: 'TRANSACTION_TIMESTAMP',
        description: 'Gets the start time of the current transaction.',
        example: 'SELECT TRANSACTION_TIMESTAMP FROM table_name;'
      },
      {
        name: 'TRUNC',
        description: 'Truncates a date or timestamp to a specific unit.',
        example: "SELECT TRUNC(date_or_timestamp, 'unit') FROM table_name;"
      },
      {
        name: 'WEEK',
        description: 'Gets the week number from a date.',
        example: 'SELECT WEEK(date_column) FROM table_name;'
      },
      {
        name: 'WEEK_ISO',
        description: 'Gets the ISO week number from a date.',
        example: 'SELECT WEEK_ISO(date_column) FROM table_name;'
      },
      {
        name: 'YEAR',
        description: 'Gets the year from a date or timestamp.',
        example: 'SELECT YEAR(date_or_timestamp) FROM table_name;'
      },
      {
        name: 'YEAR_ISO',
        description: 'Gets the ISO year from a date or timestamp.',
        example: 'SELECT YEAR_ISO(date_or_timestamp) FROM table_name;'
      }
    ],
    Epoch: [
      {
        name: 'ADVANCE_EPOCH',
        title: 'ADVANCE_EPOCH(epochs_to_advance)',
        description: 'Advances the current epoch by a specified number of epochs.',
        example: 'ADVANCE_EPOCH(3);'
      },
      {
        name: 'GET_AHM_EPOCH',
        title: 'GET_AHM_EPOCH()',
        description: 'Returns the Auto Healer Monitor (AHM) epoch value.',
        example: 'GET_AHM_EPOCH(); -- Result: 98765'
      },
      {
        name: 'GET_AHM_TIME',
        title: 'GET_AHM_TIME()',
        description: 'Returns the Auto Healer Monitor (AHM) timestamp value.',
        example: "GET_AHM_TIME(); -- Result: '2023-07-17 12:34:56'"
      },
      {
        name: 'GET_CURRENT_EPOCH',
        title: 'GET_CURRENT_EPOCH()',
        description: 'Returns the current epoch value.',
        example: 'GET_CURRENT_EPOCH(); -- Result: 12345'
      },
      {
        name: 'GET_LAST_GOOD_EPOCH',
        title: 'GET_LAST_GOOD_EPOCH()',
        description: 'Returns the last good epoch value.',
        example: 'GET_LAST_GOOD_EPOCH(); -- Result: 98765'
      },
      {
        name: 'MAKE_AHM_NOW',
        title: 'MAKE_AHM_NOW()',
        description: 'Sets the Auto Healer Monitor (AHM) time to the current time.',
        example: 'MAKE_AHM_NOW();'
      },
      {
        name: 'SET_AHM_EPOCH',
        title: 'SET_AHM_EPOCH(epoch)',
        description: 'Sets the Auto Healer Monitor (AHM) epoch value.',
        example: 'SET_AHM_EPOCH(54321);'
      },
      {
        name: 'SET_AHM_TIME',
        title: 'SET_AHM_TIME(timestamp)',
        description: 'Sets the Auto Healer Monitor (AHM) timestamp value.',
        example: "SET_AHM_TIME('2023-07-17 18:30:00');"
      }
    ],
    Error: [
      {
        name: 'THROW_ERROR',
        description: 'Returns a user-defined error message.',
        example: "SELECT (CASE WHEN true THEN THROW_ERROR('Failure!!!') ELSE some_text END) FROM pitcher_err;"
      }
    ],
    Flex: [
      {
        name: 'BUILD_FLEXTABLE_VIEW',
        title: 'BUILD_FLEXTABLE_VIEW(schema_name, table_name, is_recoverable)',
        description: 'Builds a FlexTable view in the specified schema and table.',
        example: "BUILD_FLEXTABLE_VIEW('public', 'my_flex_table', false);"
      },
      {
        name: 'COMPUTE_FLEXTABLE_KEYS',
        title: 'COMPUTE_FLEXTABLE_KEYS(schema_name, table_name)',
        description: 'Computes FlexTable keys for the specified schema and table.',
        example: "COMPUTE_FLEXTABLE_KEYS('public', 'my_flex_table');"
      },
      {
        name: 'COMPUTE_FLEXTABLE_KEYS_AND_BUILD_VIEW',
        title: 'COMPUTE_FLEXTABLE_KEYS_AND_BUILD_VIEW(schema_name, table_name)',
        description: 'Computes FlexTable keys and builds a FlexTable view in the specified schema and table.',
        example: "COMPUTE_FLEXTABLE_KEYS_AND_BUILD_VIEW('public', 'my_flex_table');"
      },
      {
        name: 'EMPTYMAP',
        title: 'EMPTYMAP()',
        description: 'Creates an empty map.',
        example: 'EMPTYMAP(); -- Result: {}'
      },
      {
        name: 'MAPAGGREGATE',
        title: 'MAPAGGREGATE(map, aggregate_function)',
        description: 'Aggregates values in the map using the specified aggregate function.',
        example: "MAPAGGREGATE({'a': 10, 'b': 20, 'c': 30}, 'sum'); -- Result: 60"
      },
      {
        name: 'MAPCONTAINSKEY',
        title: 'MAPCONTAINSKEY(map, key)',
        description: 'Checks if the map contains the specified key.',
        example: "MAPCONTAINSKEY({'a': 10, 'b': 20, 'c': 30}, 'b'); -- Result: true"
      },
      {
        name: 'MAPCONTAINSVALUE',
        title: 'MAPCONTAINSVALUE(map, value)',
        description: 'Checks if the map contains the specified value.',
        example: "MAPCONTAINSVALUE({'a': 10, 'b': 20, 'c': 30}, 20); -- Result: true"
      },
      {
        name: 'MAPDELIMITEDEXTRACTOR',
        title: 'MAPDELIMITEDEXTRACTOR(delimiter)',
        description: 'Creates a map extractor with the specified delimiter.',
        example: "MAPDELIMITEDEXTRACTOR('|');"
      },
      {
        name: 'MAPITEMS',
        title: 'MAPITEMS(map)',
        description: 'Returns an array of key-value pairs from the map.',
        example: "MAPITEMS({'a': 10, 'b': 20, 'c': 30}); -- Result: [{'key': 'a', 'value': 10}, {'key': 'b', 'value': 20}, {'key': 'c', 'value': 30}]"
      },
      {
        name: 'MAPJSONEXTRACTOR',
        title: 'MAPJSONEXTRACTOR(json_path)',
        description: 'Creates a map extractor with the specified JSON path.',
        example: "MAPJSONEXTRACTOR('$.name');"
      },
      {
        name: 'MAPKEYS',
        title: 'MAPKEYS(map)',
        description: 'Returns an array of keys from the map.',
        example: "MAPKEYS({'a': 10, 'b': 20, 'c': 30}); -- Result: ['a', 'b', 'c']"
      },
      {
        name: 'MAPKEYSINFO',
        title: 'MAPKEYSINFO(map)',
        description: 'Returns information about keys in the map.',
        example:
          "MAPKEYSINFO({'a': 10, 'b': 20, 'c': 30}); -- Result: [{'key': 'a', 'exists': true}, {'key': 'b', 'exists': true}, {'key': 'd', 'exists': false}]"
      },
      {
        name: 'MAPLOOKUP',
        title: 'MAPLOOKUP(map, key)',
        description: 'Looks up a value in the map using the specified key.',
        example: "MAPLOOKUP({'a': 10, 'b': 20, 'c': 30}, 'c'); -- Result: 30"
      },
      {
        name: 'MAPPUT',
        title: 'MAPPUT(map, key, value)',
        description: 'Puts a key-value pair into the map.',
        example: "MAPPUT({}, 'a', 10);"
      },
      {
        name: 'MAPREGEXEXTRACTOR',
        title: 'MAPREGEXEXTRACTOR(regex)',
        description: 'Creates a map extractor with the specified regular expression.',
        example: "MAPREGEXEXTRACTOR('([a-z]+):([0-9]+)');"
      },
      {
        name: 'MAPSIZE',
        title: 'MAPSIZE(map)',
        description: 'Returns the number of key-value pairs in the map.',
        example: "MAPSIZE({'a': 10, 'b': 20, 'c': 30}); -- Result: 3"
      },
      {
        name: 'MAPTOSTRING',
        title: 'MAPTOSTRING(map)',
        description: 'Converts the map to a string representation.',
        example: "MAPTOSTRING({'a': 10, 'b': 20, 'c': 30}); -- Result: '{\"a\":10,\"b\":20,\"c\":30}'"
      },
      {
        name: 'MAPVALUES',
        title: 'MAPVALUES(map)',
        description: 'Returns an array of values from the map.',
        example: "MAPVALUES({'a': 10, 'b': 20, 'c': 30}); -- Result: [10, 20, 30]"
      },
      {
        name: 'MAPVERSION',
        title: 'MAPVERSION()',
        description: 'Returns the version number of the map.',
        example: 'MAPVERSION(); -- Result: 3'
      },
      {
        name: 'MATERIALIZE_FLEXTABLE_COLUMNS',
        title: 'MATERIALIZE_FLEXTABLE_COLUMNS(schema_name, table_name)',
        description: 'Materializes FlexTable columns in the specified schema and table.',
        example: "MATERIALIZE_FLEXTABLE_COLUMNS('public', 'my_flex_table');"
      },
      {
        name: 'RESTORE_FLEXTABLE_DEFAULT_KEYS_TABLE_AND_VIEW',
        title: 'RESTORE_FLEXTABLE_DEFAULT_KEYS_TABLE_AND_VIEW(table_name)',
        description: 'Restores the default keys table and view for a FlexTable in the specified schema and table.',
        example: "RESTORE_FLEXTABLE_DEFAULT_KEYS_TABLE_AND_VIEW('my_flex_table');"
      }
    ],
    Formatting: [
      {
        name: 'TO_BITSTRING',
        title: 'TO_BITSTRING(value)',
        description: 'Converts an integer or numeric value to a bitstring representation.',
        example: 'SELECT TO_BITSTRING(42);'
      },
      {
        name: 'TO_CHAR',
        title: "TO_CHAR(date_or_timestamp, 'format')",
        description: 'Converts a date or timestamp to a character string with a specified format.',
        example: "SELECT TO_CHAR(date_column, 'YYYY-MM-DD HH24:MI:SS');"
      },
      {
        name: 'TO_DATE',
        title: "TO_DATE('date_string', 'format')",
        description: 'Converts a character string to a date with a specified format.',
        example: "SELECT TO_DATE('2023-07-01', 'YYYY-MM-DD');"
      },
      {
        name: 'TO_HEX',
        title: 'TO_HEX(value)',
        description: 'Converts an integer or numeric value to a hexadecimal representation.',
        example: 'SELECT TO_HEX(255);'
      },
      {
        name: 'TO_TIMESTAMP',
        title: "TO_TIMESTAMP('timestamp_string', 'format')",
        description: 'Converts a character string to a timestamp with a specified format.',
        example: "SELECT TO_TIMESTAMP('2023-07-01 12:34:56', 'YYYY-MM-DD HH24:MI:SS');"
      },
      {
        name: 'TO_TIMESTAMP_TZ',
        title: "TO_TIMESTAMP_TZ('timestamp_tz_string', 'format')",
        description: 'Converts a character string to a timestamp with time zone with a specified format.',
        example: "SELECT TO_TIMESTAMP_TZ('2023-07-01 12:34:56 -07:00', 'YYYY-MM-DD HH24:MI:SS TZH:TZM');"
      },
      {
        name: 'TO_NUMBER',
        title: "TO_NUMBER('numeric_string', 'format')",
        description: 'Converts a character string to a numeric value.',
        example: "SELECT TO_NUMBER('123.45', '999.99');"
      }
    ],
    Geospatial: [
      {
        name: 'ST_AsText',
        title: 'ST_AsText',
        description: 'Converts a geometry to a Well-Known Text (WKT) representation.',
        example: 'SELECT ST_AsText(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Area',
        title: 'ST_Area',
        description: 'Calculates the area of a geometry.',
        example: 'SELECT ST_Area(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_AsBinary',
        title: 'ST_AsBinary',
        description: 'Converts a geometry to a Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_AsBinary(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Boundary',
        title: 'ST_Boundary',
        description: 'Calculates the boundary of a geometry.',
        example: 'SELECT ST_Boundary(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Buffer',
        title: 'ST_Buffer',
        description: 'Computes the buffer region around a geometry.',
        example: 'SELECT ST_Buffer(geometry_column, buffer_distance) FROM table_name;'
      },
      {
        name: 'ST_Centroid',
        title: 'ST_Centroid',
        description: 'Calculates the centroid (center point) of a geometry.',
        example: 'SELECT ST_Centroid(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Contains',
        title: 'ST_Contains',
        description: 'Checks if one geometry contains another.',
        example: 'SELECT ST_Contains(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_ConvexHull',
        title: 'ST_ConvexHull',
        description: 'Calculates the convex hull of a geometry.',
        example: 'SELECT ST_ConvexHull(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Crosses',
        title: 'ST_Crosses',
        description: 'Checks if two geometries cross each other.',
        example: 'SELECT ST_Crosses(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Difference',
        title: 'ST_Difference',
        description: 'Computes the difference of two geometries.',
        example: 'SELECT ST_Difference(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Disjoint',
        title: 'ST_Disjoint',
        description: 'Checks if two geometries are disjoint (have no points in common).',
        example: 'SELECT ST_Disjoint(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Distance',
        title: 'ST_Distance',
        description: 'Calculates the distance between two geometries.',
        example: 'SELECT ST_Distance(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Envelope',
        title: 'ST_Envelope',
        description: 'Calculates the envelope (minimum bounding box) of a geometry.',
        example: 'SELECT ST_Envelope(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Equals',
        title: 'ST_Equals',
        description: 'Checks if two geometries are exactly equal.',
        example: 'SELECT ST_Equals(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_GeographyFromText',
        title: 'ST_GeographyFromText',
        description: 'Converts a Well-Known Text (WKT) representation to a geography.',
        example: "SELECT ST_GeographyFromText('POINT(-122.34900 47.65100)');"
      },
      {
        name: 'ST_GeographyFromWKB',
        title: 'ST_GeographyFromWKB',
        description: 'Converts a Well-Known Binary (WKB) representation to a geography.',
        example: 'SELECT ST_GeographyFromWKB(wkb_column) FROM table_name;'
      },
      {
        name: 'ST_GeoHash',
        title: 'ST_GeoHash',
        description: 'Calculates the geohash of a geometry.',
        example: 'SELECT ST_GeoHash(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_GeometryN',
        title: 'ST_GeometryN',
        description: 'Returns the Nth geometry (zero-based index) in a geometry collection.',
        example: 'SELECT ST_GeometryN(geometry_collection, n) FROM table_name;'
      },
      {
        name: 'ST_GeometryType',
        title: 'ST_GeometryType',
        description: 'Returns the type of a geometry.',
        example: 'SELECT ST_GeometryType(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_GeomFromGeoHash',
        title: 'ST_GeomFromGeoHash',
        description: 'Converts a geohash to a geometry.',
        example: "SELECT ST_GeomFromGeoHash('9qw1j9cw20k');"
      },
      {
        name: 'ST_GeomFromGeoJSON',
        title: 'ST_GeomFromGeoJSON',
        description: 'Converts GeoJSON text to a geometry.',
        example: 'SELECT ST_GeomFromGeoJSON(\'{"type":"Point","coordinates":[-122.34900,47.65100]}\');'
      },
      {
        name: 'ST_GeomFromText',
        title: 'ST_GeomFromText',
        description: 'Converts a Well-Known Text (WKT) representation to a geometry.',
        example: "SELECT ST_GeomFromText('POINT(-122.34900 47.65100)');"
      },
      {
        name: 'ST_GeomFromWKB',
        title: 'ST_GeomFromWKB',
        description: 'Converts a Well-Known Binary (WKB) representation to a geometry.',
        example: 'SELECT ST_GeomFromWKB(wkb_column) FROM table_name;'
      },
      {
        name: 'ST_Intersection',
        title: 'ST_Intersection',
        description: 'Computes the intersection of two geometries.',
        example: 'SELECT ST_Intersection(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Intersects',
        title: 'ST_Intersects',
        description: 'Checks if two geometries intersect each other.',
        example: 'SELECT ST_Intersects(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_IsEmpty',
        title: 'ST_IsEmpty',
        description: 'Checks if a geometry is empty.',
        example: 'SELECT ST_IsEmpty(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_IsSimple',
        title: 'ST_IsSimple',
        description: 'Checks if a geometry is simple (contains no self-intersections).',
        example: 'SELECT ST_IsSimple(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_IsValid',
        title: 'ST_IsValid',
        description: 'Checks if a geometry is valid (has valid coordinates and structure).',
        example: 'SELECT ST_IsValid(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Length',
        title: 'ST_Length',
        description: 'Calculates the length of a geometry.',
        example: 'SELECT ST_Length(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_NumGeometries',
        title: 'ST_NumGeometries',
        description: 'Returns the number of geometries in a geometry collection.',
        example: 'SELECT ST_NumGeometries(geometry_collection) FROM table_name;'
      },
      {
        name: 'ST_NumPoints',
        title: 'ST_NumPoints',
        description: 'Returns the number of points in a geometry.',
        example: 'SELECT ST_NumPoints(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Overlaps',
        title: 'ST_Overlaps',
        description: 'Checks if two geometries overlap each other.',
        example: 'SELECT ST_Overlaps(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_PointFromGeoHash',
        title: 'ST_PointFromGeoHash',
        description: 'Converts a geohash to a point geometry.',
        example: "SELECT ST_PointFromGeoHash('9qw1j9cw20k');"
      },
      {
        name: 'ST_PointN',
        title: 'ST_PointN',
        description: 'Returns the Nth point (zero-based index) in a geometry.',
        example: 'SELECT ST_PointN(geometry_column, n) FROM table_name;'
      },
      {
        name: 'ST_Relate',
        title: 'ST_Relate',
        description: 'Returns the DE-9IM spatial relation matrix between two geometries.',
        example: 'SELECT ST_Relate(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_SRID',
        title: 'ST_SRID',
        description: 'Returns the spatial reference identifier (SRID) of a geometry.',
        example: 'SELECT ST_SRID(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_SymDifference',
        title: 'ST_SymDifference',
        description: 'Computes the symmetric difference of two geometries.',
        example: 'SELECT ST_SymDifference(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Touches',
        title: 'ST_Touches',
        description: 'Checks if two geometries touch each other at a point.',
        example: 'SELECT ST_Touches(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Transform',
        title: 'ST_Transform',
        description: 'Transforms a geometry from one spatial reference system to another.',
        example: 'SELECT ST_Transform(geometry_column, target_srid) FROM table_name;'
      },
      {
        name: 'ST_Union',
        title: 'ST_Union',
        description: 'Computes the union of two geometries.',
        example: 'SELECT ST_Union(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_Within',
        title: 'ST_Within',
        description: 'Checks if one geometry is completely within another.',
        example: 'SELECT ST_Within(geom1, geom2) FROM table_name;'
      },
      {
        name: 'ST_X',
        title: 'ST_X',
        description: 'Returns the X-coordinate of a point geometry.',
        example: 'SELECT ST_X(point_geometry) FROM table_name;'
      },
      {
        name: 'ST_XMax',
        title: 'ST_XMax',
        description: 'Returns the maximum X-coordinate of a geometry.',
        example: 'SELECT ST_XMax(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_XMin',
        title: 'ST_XMin',
        description: 'Returns the minimum X-coordinate of a geometry.',
        example: 'SELECT ST_XMin(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_YMax',
        title: 'ST_YMax',
        description: 'Returns the maximum Y-coordinate of a geometry.',
        example: 'SELECT ST_YMax(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_YMin',
        title: 'ST_YMin',
        description: 'Returns the minimum Y-coordinate of a geometry.',
        example: 'SELECT ST_YMin(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Y',
        title: 'ST_Y',
        description: 'Returns the Y-coordinate of a point geometry.',
        example: 'SELECT ST_Y(point_geometry) FROM table_name;'
      },
      {
        name: 'STV_AsGeoJSON',
        title: 'STV_AsGeoJSON',
        description: 'Converts a geometry to GeoJSON format.',
        example: 'SELECT STV_AsGeoJSON(geometry_column) FROM table_name;'
      },
      {
        name: 'STV_Create_Index',
        title: 'STV_Create_Index',
        description: 'Creates a geospatial index on a geometry column.',
        example: 'CREATE STV_Create_Index(geometry_column);'
      },
      {
        name: 'STV_Describe_Index',
        title: 'STV_Describe_Index',
        description: 'Describes the details of a geospatial index.',
        example: 'SELECT STV_Describe_Index(index_name) FROM table_name;'
      },
      {
        name: 'STV_Drop_Index',
        title: 'STV_Drop_Index',
        description: 'Drops a geospatial index from a geometry column.',
        example: 'DROP STV_Drop_Index(index_name);'
      },
      {
        name: 'STV_DWithin',
        title: 'STV_DWithin',
        description: 'Checks if a geometry is within a specified distance of another geometry.',
        example: 'SELECT STV_DWithin(geometry_column, target_geometry, distance) FROM table_name;'
      },
      {
        name: 'STV_Export2Shapefile',
        title: 'STV_Export2Shapefile',
        description: 'Exports a geometry column to a Shapefile.',
        example: "SELECT STV_Export2Shapefile(geometry_column, 'shapefile_directory') FROM table_name;"
      },
      {
        name: 'STV_Extent',
        title: 'STV_Extent',
        description: 'Returns the bounding box (extent) of a geometry.',
        example: 'SELECT STV_Extent(geometry_column) FROM table_name;'
      },
      {
        name: 'STV_ForceLHR',
        title: 'STV_ForceLHR',
        description: 'Forces a geometry to use left-hand rule (LHR) orientation.',
        example: 'SELECT STV_ForceLHR(geometry_column) FROM table_name;'
      },
      {
        name: 'STV_Geography',
        title: 'STV_Geography',
        description: 'Converts a geometry to a geography.',
        example: 'SELECT STV_Geography(geometry_column) FROM table_name;'
      },
      {
        name: 'STV_GeographyPoint',
        title: 'STV_GeographyPoint',
        description: 'Converts a point geometry to a geography point.',
        example: 'SELECT STV_GeographyPoint(point_geometry) FROM table_name;'
      },
      {
        name: 'STV_Geometry',
        title: 'STV_Geometry',
        description: 'Converts a geography to a geometry.',
        example: 'SELECT STV_Geometry(geography_column) FROM table_name;'
      },
      {
        name: 'STV_GeometryPoint',
        title: 'STV_GeometryPoint',
        description: 'Converts a geography point to a point geometry.',
        example: 'SELECT STV_GeometryPoint(geography_point) FROM table_name;'
      },
      {
        name: 'STV_GetExportShapefileDirectory',
        title: 'STV_GetExportShapefileDirectory',
        description: 'Returns the current export shapefile directory.',
        example: 'SELECT STV_GetExportShapefileDirectory();'
      },
      {
        name: 'STV_Intersect',
        title: 'STV_Intersect',
        description: 'Calculates the intersection of two geometries using the scalar function.',
        example: 'SELECT STV_Intersect(geom1, geom2) FROM table_name;'
      },
      {
        name: 'STV_LineStringPoint',
        title: 'STV_LineStringPoint',
        description: 'Returns a point from a linestring.',
        example: 'SELECT STV_LineStringPoint(line_string, n) FROM table_name;'
      },
      {
        name: 'STV_MemSize',
        title: 'STV_MemSize',
        description: 'Returns the memory size of a geometry or geography.',
        example: 'SELECT STV_MemSize(geometry_column) FROM table_name;'
      },
      {
        name: 'STV_NN',
        title: 'STV_NN',
        description: 'Performs a k-nearest neighbor search on a geometry table.',
        example: 'SELECT STV_NN(geometry_column, target_geometry, k) FROM table_name;'
      },
      {
        name: 'STV_PolygonPoint',
        title: 'STV_PolygonPoint',
        description: 'Returns a point from a polygon.',
        example: 'SELECT STV_PolygonPoint(polygon, n) FROM table_name;'
      },
      {
        name: 'STV_Reverse',
        title: 'STV_Reverse',
        description: 'Reverses the vertex order of a geometry.',
        example: 'SELECT STV_Reverse(geometry_column) FROM table_name;'
      },
      {
        name: 'STV_Rename_Index',
        title: 'STV_Rename_Index',
        description: 'Renames a geospatial index.',
        example: 'ALTER STV_Rename_Index(old_index_name, new_index_name);'
      },
      {
        name: 'STV_Refresh_Index',
        title: 'STV_Refresh_Index',
        description: 'Refreshes a geospatial index to reflect changes in the geometry column.',
        example: 'REFRESH STV_Refresh_Index(index_name);'
      },
      {
        name: 'STV_SetExportShapefileDirectory',
        title: 'STV_SetExportShapefileDirectory',
        description: 'Sets the export shapefile directory for geometry exports.',
        example: "SELECT STV_SetExportShapefileDirectory('new_shapefile_directory');"
      },
      {
        name: 'STV_ShpSource',
        title: 'STV_ShpSource',
        description: 'Defines a shapefile as a table source.',
        example: "CREATE TABLE table_name AS SELECT * FROM STV_ShpSource('shapefile_directory');"
      },
      {
        name: 'STV_ShpParser',
        title: 'STV_ShpParser',
        description: 'Parses a shapefile and returns a geometry table.',
        example: "SELECT * FROM STV_ShpParser('shapefile_directory');"
      }
    ],
    IP: [
      {
        name: 'INET_ATON',
        title: 'INET_ATON (expression)',
        description:
          'Converts a string that contains a dotted-quad representation of an IPv4 network address to an INTEGER. It trims any surrounding white space from the string. This function returns NULL if the string is NULL or contains anything other than a quad dotted IPv4 address.',
        example: "SELECT INET_ATON('209.207.224.40')"
      },
      {
        name: 'INET_NTOA',
        title: 'INET_NTOA (expression)',
        description:
          'Converts an INTEGER value into a VARCHAR dotted-quad representation of an IPv4 network address. INET_NTOA returns NULL if the integer value is NULL, negative, or is greater than 232 (4294967295).',
        example: 'SELECT INET_NTOA(03021962)'
      },
      {
        name: 'V6_ATON',
        title: 'V6_ATON (expression)',
        description:
          'Converts a string containing a colon-delimited IPv6 network address into a VARBINARY string. Any spaces around the IPv6 address are trimmed. This function returns NULL if the input value is NULL or it cannot be parsed as an IPv6 address.',
        example: "SELECT V6_ATON('2001:DB8::8:800:200C:417A')"
      },
      {
        name: 'V6_NTOA',
        title: 'V6_NTOA (expression)',
        description: 'Converts an IPv6 address represented as varbinary to a character string.',
        example: "SELECT V6_NTOA(V6_ATON('1.2.3.4'));"
      },
      {
        name: 'V6_SUBNETA',
        title: 'V6_SUBNETA (address, subnet)',
        description:
          'Returns a VARCHAR containing a subnet address in CIDR (Classless Inter-Domain Routing) format from a binary or alphanumeric IPv6 address. Returns NULL if either parameter is NULL, the address cannot be parsed as an IPv6 address, or the subnet value is outside the range of 0 to 128.',
        example: "SELECT V6_SUBNETA(V6_ATON('2001:db8::8:800:200c:417a'), 28);"
      },
      {
        name: 'V6_SUBNETN',
        title: 'V6_SUBNETN (address, subnet-size)',
        description: 'Calculates a subnet address in CIDR (Classless Inter-Domain Routing) format from a varbinary or alphanumeric IPv6 address.',
        example: "SELECT V6_SUBNETN(V6_ATON('2001:db8::8:800:200c:417a'), 28);"
      },
      {
        name: 'V6_TYPE',
        title: 'V6_TYPE (address)',
        description:
          'Returns an INTEGER value that classifies the type of the network address passed to it as defined in IETF RFC 4291 section 2.4. For example, If you pass this function the string 127.0.0.1, it returns 2 which indicates the address is a loopback address. This function accepts both IPv4 and IPv6 addresses.',
        example: "SELECT V6_TYPE(V6_ATON('192.168.2.10')); "
      }
    ],
    Keyword: [
      {
        name: 'GROUP',
        title: 'GROUP',
        description: 'Groups rows based on a specific column in the SELECT statement.',
        example: 'SELECT department, COUNT(*) FROM employees GROUP BY department;'
      },
      {
        name: 'HAVING',
        title: 'HAVING',
        description: 'Specifies a condition for grouped data in the SELECT statement.',
        example: 'SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 50000;'
      },
      {
        name: 'SELECT',
        title: 'SELECT',
        description: 'Retrieves data from one or more tables.',
        example: 'SELECT * FROM products;'
      },
      {
        name: 'FROM',
        title: 'FROM',
        description: 'Specifies the table from which data is queried.',
        example: 'SELECT * FROM employees;'
      },
      {
        name: 'ALL',
        description: 'Used in subqueries to allow comparison with all values in the result set.',
        formula: 'expr comparison_operator ALL (subquery)',
        example: 'SELECT product_name FROM products WHERE price > ALL (SELECT price FROM products WHERE category_id = 1);'
      }
    ],
    ML_Algorithms: [
      {
        name: 'AUTOREGRESSOR',
        title: "AUTOREGRESSOR ('model‑name', 'input‑relation', 'data‑column', 'timestamp‑column')",
        description:
          'Creates an autoregressive (AR) model from a stationary time series with consistent timesteps that can then be used for prediction via PREDICT_AUTOREGRESSOR.\n\nAutoregressive models predict future values of a time series based on the preceding values. More specifically, the user-specified lag determines how many previous timesteps it takes into account during computation, and predicted values are linear combinations of the values at each lag.\n\nSince its input data must be sorted by timestamp, this algorithm is single-threaded.',
        example: ''
      },
      {
        name: 'BISECTING_KMEANS',
        title: "BISECTING_KMEANS('model-name', 'input-relation', 'input-columns', 'num-clusters')",
        description:
          'Executes the bisecting k‑means algorithm on an input relation. The result is a trained model with a hierarchy of cluster centers, with a range of k values, each of which can be used for prediction.',
        example:
          "SELECT BISECTING_KMEANS('myModel', 'iris1', '*', '5'\n       USING PARAMETERS exclude_columns = 'Species,id', split_method ='sum_squares', output_view = 'myBKmeansView');"
      },
      {
        name: 'KMEANS',
        title: "KMEANS('model‑name', 'input‑relation', 'input‑columns', 'num‑clusters')",
        description:
          'Executes the k-means algorithm on an input relation. The result is a model with a list of cluster centers.\n\nYou can export the resulting k-means model in VERTICA_MODELS or PMML format to apply it on data outside Vertica. You can also train a k-means model elsewhere, then import it to Vertica in PMML format to predict on data in Vertica.',
        example:
          "SELECT KMEANS('myKmeansModel', 'iris1', '*', 5\nUSING PARAMETERS max_iterations=20, output_view='myKmeansView', key_columns='id', exclude_columns='Species, id');\n           KMEANS"
      },
      {
        name: 'LINEAR_REG',
        title: "LINEAR_REG('model‑name', 'input‑relation', 'response‑column', 'predictor‑columns')",
        description:
          'Executes linear regression on an input relation, and returns a linear regression model.\n\nYou can export the resulting linear regression model in VERTICA_MODELS or PMML format to apply it on data outside Vertica. You can also train a linear regression model elsewhere, then import it to Vertica in PMML format to predict on data in Vertica.',
        example: "SELECT LINEAR_REG('myLinearRegModel', 'faithful', 'eruptions', 'waiting' \n                      USING PARAMETERS optimizer='BFGS');"
      },
      {
        name: 'LOGISTIC_REG',
        title: "LOGISTIC_REG('model‑name', 'input‑relation', 'response‑column', 'predictor‑columns')",
        description:
          'Executes logistic regression on an input relation. The result is a logistic regression model.\n\nYou can export the resulting logistic regression model in VERTICA_MODELS or PMML format to apply it on data outside Vertica. You can also train a logistic regression model elsewhere, then import it to Vertica in PMML format to predict on data in Vertica.',
        example:
          "SELECT LOGISTIC_REG('myLogisticRegModel', 'mtcars', 'am',\n                       'mpg, cyl, disp, hp, drat, wt, qsec, vs, gear, carb'\n                        USING PARAMETERS exclude_columns='hp', optimizer='BFGS');"
      },
      {
        name: 'MOVING_AVERAGE',
        title: "MOVING_AVERAGE('model‑name', 'input‑relation', 'data‑column', 'timestamp‑column')",
        description:
          'Creates a moving-average (MA) model from a stationary time series with consistent timesteps that can then be used for prediction via PREDICT_MOVING_AVERAGE.\n\nMoving average models use the errors of previous predictions to make future predictions. More specifically, the user-specified lag determines how many previous predictions and errors it takes into account during computation.\n\nSince its input data must be sorted by timestamp, this algorithm is single-threaded.',
        example: ''
      },
      {
        name: 'NAIVE_BAYES',
        title: "NAIVE_BAYES('model‑name', 'input‑relation', 'response‑column', 'predictor‑columns')",
        description: 'Executes the Naive Bayes algorithm on an input relation and returns a Naive Bayes model.',
        example: "SELECT NAIVE_BAYES('naive_house84_model', 'house84_train', 'party', '*'\n                      USING PARAMETERS exclude_columns='party, id');"
      },
      {
        name: 'RF_CLASSIFIER',
        title: "RF_CLASSIFIER('model‑name', input‑relation, 'response‑column', 'predictor‑columns' )",
        description: 'Trains a random forest model for classification on an input relation.',
        example:
          "SELECT RF_CLASSIFIER ('myRFModel', 'iris', 'Species', 'Sepal_Length, Sepal_Width, \nPetal_Length, Petal_Width' USING PARAMETERS ntree=100, sampling_size=0.3);"
      },
      {
        name: 'RF_REGRESSOR',
        title: "RF_REGRESSOR('model‑name', input‑relation, 'response‑column', 'predictor‑columns')",
        description: 'Trains a random forest model for regression on an input relation.',
        example: "SELECT RF_REGRESSOR ('myRFRegressorModel', 'mtcars', 'carb', 'mpg, cyl, hp, drat, wt' USING PARAMETERS\nntree=100, sampling_size=0.3);"
      },
      {
        name: 'SVM_CLASSIFIER',
        title: "SVM_CLASSIFIER('model‑name', input‑relation, 'response‑column', 'predictor‑columns')",
        description: 'Trains the SVM model on an input relation.',
        example:
          "SELECT SVM_CLASSIFIER(\n       'mySvmClassModel', 'mtcars', 'am', 'mpg,cyl,disp,hp,drat,wt,qsec,vs,gear,carb'\n       USING PARAMETERS exclude_columns = 'hp,drat');"
      },
      {
        name: 'SVM_REGRESSOR',
        title: "SVM_REGRESSOR('model‑name', input‑relation, 'response‑column', 'predictor‑columns')",
        description: 'Trains the SVM model on an input relation.',
        example:
          "SELECT SVM_REGRESSOR('mySvmRegModel', 'faithful', 'eruptions', 'waiting'\n                          USING PARAMETERS error_tolerance=0.1, max_iterations=100);"
      },
      {
        name: 'XGB_CLASSIFIER',
        title: "XGB_CLASSIFIER('model‑name', input‑relation, 'response‑column', 'predictor‑columns')",
        description: 'Trains an XGBoost model for classification on an input relation.',
        example: ''
      },
      {
        name: 'XGB_REGRESSOR',
        title: "XGB_REGRESSOR('model‑name', input‑relation, 'response‑column', 'predictor‑columns')",
        description: 'Trains an XGBoost model for regression on an input relation.',
        example: ''
      }
    ],
    ML_Evaluation: [
      {
        name: 'CONFUSION_MATRIX',
        title: 'CONFUSION_MATRIX ( targets, predictions)',
        description:
          'Computes the confusion matrix of a table with observed and predicted values of a response variable. CONFUSION_MATRIX produces a table with the following dimensions:\n\nRows: Number of classes\nColumns: Number of classes + 2',
        example: ''
      },
      {
        name: 'CROSS_VALIDATE',
        title: "CROSS_VALIDATE ( 'algorithm', 'input‑relation', 'response‑column', 'predictor‑columns')",
        description:
          'Performs k-fold cross validation on a learning algorithm using an input relation, and grid search for hyper parameters. The output is an average performance indicator of the selected algorithm. This function supports SVM classification, naive bayes, and logistic regression.',
        example: ''
      },
      {
        name: 'ERROR_RATE',
        title: 'ERROR_RATE ( targets, predictions)',
        description:
          'Using an input table, returns a table that calculates the rate of incorrect classifications and displays them as FLOAT values. ERROR_RATE returns a table with the following dimensions:\n\nRows: Number of classes plus one row that contains the total error rate across classes\nColumns: 2',
        example: ''
      },
      {
        name: 'LIFT_TABLE',
        title: 'LIFT_TABLE ( targets, probabilities )',
        description: 'Returns a table that compares the predictive quality of a machine learning model. This function is also known as a lift chart.',
        example: ''
      },
      {
        name: 'MSE',
        title: 'MSE ( targets, predictions ) OVER()',
        description: 'Returns a table that displays the mean squared error of the prediction and response columns in a machine learning model.',
        example: ''
      },
      {
        name: 'PRC',
        title:
          'PRC ( targets, probabilities\n       [ USING PARAMETERS \n             [num_bins = num‑bins] \n             [, f1_score = return‑score ] \n             [, main_class = class‑name ] )\nOVER()',
        description: 'Returns a table that displays the points on a receiver precision recall (PR) curve.\n\n',
        example: ''
      },
      {
        name: 'READ_TREE',
        title: "READ_TREE ( USING PARAMETERS model_name = 'model‑name')",
        description: 'Reads the contents of trees within the random forest or XGBoost model.',
        example: ''
      },
      {
        name: 'RF_PREDICTOR_IMPORTANCE',
        title: "RF_PREDICTOR_IMPORTANCE ( USING PARAMETERS model_name = 'model‑name' [, tree_id = tree‑id] )",
        description:
          'Measures the importance of the predictors in a random forest model using the Mean Decrease Impurity (MDI) approach. The importance vector is normalized to sum to 1.',
        example: ''
      },
      {
        name: 'ROC',
        title:
          'ROC ( targets, probabilities \n        [ USING PARAMETERS \n              [num_bins = num‑bins]\n              [, AUC = output]\n              [, main_class = class‑name ] ) ] )\nOVER()',
        description:
          'Returns a table that displays the points on a receiver operating characteristic curve. The ROC function tells you the accuracy of a classification model as you raise the discrimination threshold for the model.',
        example: ''
      },
      {
        name: 'RSQUARED',
        title: 'RSQUARED ( targets, predictions ) OVER()',
        description: 'Returns a table with the R-squared value of the predictions in a regression model.',
        example: ''
      }
    ],
    ML_Management: [
      {
        name: 'EXPORT_MODELS',
        title: "EXPORT_MODELS ( 'output-dir', 'export-target')",
        description: 'Exports machine learning models.',
        example: ''
      },
      {
        name: 'GET_MODEL_ATTRIBUTE',
        title: "GET_MODEL_ATTRIBUTE ( USING PARAMETERS model_name = 'model‑name' [, attr_name = 'attribute' ] ) ",
        description:
          'Extracts either a specific attribute from a model or all attributes from a model. Use this function to view a list of attributes and row counts or view detailed information about a single attribute. The output of GET_MODEL_ATTRIBUTE is a table format where users can select particular columns or rows.',
        example: ''
      },
      {
        name: 'GET_MODEL_SUMMARY',
        title: "GET_MODEL_SUMMARY ( USING PARAMETERS model_name = 'model‑name' )",
        description: 'Returns summary information of a model.',
        example: ''
      },
      {
        name: 'IMPORT_MODELS',
        title: "IMPORT_MODELS ( 'source'\n           [ USING PARAMETERS [ new_schema = 'schema‑name' ] [, category = 'model-category' ] ] )",
        description:
          'Imports models into Vertica, either Vertica models that were exported with EXPORT_MODELS, or models in Predictive Model Markup Language (PMML) or TensorFlow format. You can use this function to move models between Vertica clusters, or to import PMML and TensorFlow models trained elsewhere.',
        example: ''
      },
      {
        name: 'UPGRADE_MODEL',
        title: "UPGRADE_MODEL ( [ USING PARAMETERS [model_name = 'model‑name'] ] )",
        description:
          'Upgrades a model from a previous Vertica version. Vertica automatically runs this function during a database upgrade and if you run the IMPORT_MODELS function. Manually call this function to upgrade models after a backup or restore.\n\nIf UPGRADE_MODEL fails to upgrade the model and the model is of category VERTICA_MODELS, it cannot be used for in-database scoring and cannot be exported as a PMML model.',
        example: ''
      }
    ],
    ML_Transformations: [
      {
        name: 'APPLY_BISECTING_KMEANS',
        title: "SELECT APPLY_BISECTING_KMEANS( 'input-columns')",
        description:
          'Applies a trained bisecting k-means model to an input relation, and assigns each new data point to the closest matching cluster in the trained model.',
        example: ''
      },
      {
        name: 'APPLY_INVERSE_PCA',
        title: "SELECT APPLY_INVERSE_PCA( 'input-columns')",
        description: 'Inverts the APPLY_PCA-generated transform back to the original coordinate system.',
        example:
          "SELECT PCA ('pcamodel', 'world','country,HDI,em1970,em1971,em1972,em1973,em1974,em1975,em1976,em1977,\nem1978,em1979,em1980,em1981,em1982,em1983,em1984 ,em1985,em1986,em1987,em1988,em1989,em1990,em1991,em1992,\nem1993,em1994,em1995,em1996,em1997,em1998,em1999,em2000,em2001,em2002,em2003,em2004,em2005,em2006,em2007,\nem2008,em2009,em2010,gdp1970,gdp1971,gdp1972,gdp1973,gdp1974,gdp1975,gdp1976,gdp1977,gdp1978,gdp1979,gdp1980,\ngdp1981,gdp1982,gdp1983,gdp1984,gdp1985,gdp1986,gdp1987,gdp1988,gdp1989,gdp1990,gdp1991,gdp1992,gdp1993,\ngdp1994,gdp1995,gdp1996,gdp1997,gdp1998,gdp1999,gdp2000,gdp2001,gdp2002,gdp2003,gdp2004,gdp2005,gdp2006,\ngdp2007,gdp2008,gdp2009,gdp2010' USING PARAMETERS exclude_columns='HDI,country');"
      },
      {
        name: 'APPLY_INVERSE_SVD',
        title: "APPLY_INVERSE_SVD ( 'input‑columns')",
        description:
          'Transforms the data back to the original domain. This essentially computes the approximated version of the original data by multiplying three matrices: matrix U (input to this function), matrices S and V (stored in the model).',
        example: "SELECT APPLY_INVERSE_SVD (* USING PARAMETERS model_name='svdmodel', exclude_columns='id', \nkey_columns='id') OVER () FROM transform_svd;"
      },
      {
        name: 'APPLY_KMEANS',
        title: 'APPLY_KMEANS ( input‑columns )',
        description: 'Assigns each row of an input relation to a cluster center from an existing k-means model.',
        example: "SELECT id, APPLY_KMEANS(Sepal_Length, 2.2, 1.3, Petal_Width \nUSING PARAMETERS model_name='myKmeansModel', match_by_pos='true') FROM iris2;"
      },
      {
        name: 'APPLY_NORMALIZE',
        title: 'APPLY_NORMALIZE ( input‑columns )',
        description:
          'A UDTF function that applies the normalization parameters saved in a model to a set of specified input columns. If any column specified in the function is not in the model, its data passes through unchanged to APPLY_NORMALIZE.',
        example: ''
      },
      {
        name: 'APPLY_ONE_HOT_ENCODER',
        title: 'APPLY_ONE_HOT_ENCODER ( input‑columns )',
        description: 'A user-defined transform function (UDTF) that loads the one hot encoder model and writes out a table that contains the encoded columns.',
        example: "SELECT APPLY_ONE_HOT_ENCODER(cyl USING PARAMETERS model_name='one_hot_encoder_model', \ndrop_first='true', ignore_null='false') FROM mtcars;"
      },
      {
        name: 'APPLY_PCA',
        title: 'APPLY_PCA ( input‑columns )',
        description: 'Transforms the data using a PCA model. This returns new coordinates of each data point.',
        example: ''
      },
      {
        name: 'APPLY_SVD',
        title: 'APPLY_SVD ( input‑columns )',
        description: 'Transforms the data using an SVD model. This computes the matrix U of the SVD decomposition.',
        example: ''
      },
      {
        name: 'PREDICT_AUTOREGRESSOR',
        title: 'PREDICT_AUTOREGRESSOR (timeseries‑column)',
        description:
          'Applies an autoregressor (AR) model to an input relation.\n\nAutoregressive models use previous values to make predictions. More specifically, the user-specified "lag" determines how many previous timesteps it takes into account during computation, and predicted values are linear combinations of those lags.',
        example: ''
      },
      {
        name: 'PREDICT_LINEAR_REG',
        title: 'PREDICT_LINEAR_REG (input‑columns)',
        description: 'Applies a linear regression model on an input relation and returns the predicted value as a FLOAT.',
        example: ''
      },
      {
        name: 'PREDICT_LOGISTIC_REG',
        title: 'PREDICT_LOGISTIC_REG (input‑columns)',
        description:
          'Applies a logistic regression model on an input relation.\n\nPREDICT_LOGISTIC_REG returns as a FLOAT the predicted class or the probability of the predicted class, depending on how the type parameter is set. You can cast the return value to INTEGER or another numeric type when the return is in the probability of the predicted class.',
        example: ''
      },
      {
        name: 'PREDICT_MOVING_AVERAGE',
        title: "PREDICT_MOVING_AVERAGE ( 'timeseries‑column')",
        description:
          'Applies a moving-average (MA) model, created by MOVING_AVERAGE, to an input relation.\n\nMoving average models use the errors of previous predictions to make future predictions. More specifically, the user-specified "lag" determines how many previous predictions and errors it takes into account during computation.',
        example: ''
      },
      {
        name: 'PREDICT_NAIVE_BAYES',
        title: 'PREDICT_NAIVE_BAYES ( input‑columns)',
        description:
          'Applies a Naive Bayes model on an input relation.\n\nDepending on how the type parameter is set, PREDICT_NAIVE_BAYES returns a VARCHAR that specifies either the predicted class or probability of the predicted class. If the function returns probability, you can cast the return value to an INTEGER or another numeric data type.',
        example: ''
      },
      {
        name: 'PREDICT_NAIVE_BAYES_CLASSES',
        title: 'PREDICT_NAIVE_BAYES_CLASSES ( predictor‑columns)',
        description:
          'Applies a Naive Bayes model on an input relation and returns the probabilities of classes:\n\nVARCHAR predicted column contains the class label with the highest probability.\nMultiple FLOAT columns, where the first probability column contains the probability for the class specified in the predicted column. Other columns contain the probability of belonging to each class specified in the classes parameter.',
        example: ''
      },
      {
        name: 'PREDICT_PMML',
        title: 'PREDICT_PMML (input‑columns)',
        description:
          'Applies an imported PMML model on an input relation. The function returns the result that would be expected for the model type encoded in the PMML model.',
        example: ''
      },
      {
        name: 'PREDICT_RF_CLASSIFIER',
        title: 'PREDICT_RF_CLASSIFIER (input‑columns)',
        description:
          'Applies a random forest model on an input relation. PREDICT_RF_CLASSIFIER returns a VARCHAR data type that specifies one of the following, as determined by how the type parameter is set:\n\nThe predicted class (based on popular votes)\nProbability of a class for each input instance.',
        example: ''
      },
      {
        name: 'PREDICT_RF_CLASSIFIER_CLASSES',
        title: 'PREDICT_RF_CLASSIFIER_CLASSES (predictor‑columns)',
        description:
          'Applies a random forest model on an input relation and returns the probabilities of classes:\n\nVARCHAR predicted column contains the class label with the highest vote (popular vote).\nMultiple FLOAT columns, where the first probability column contains the probability for the class reported in the predicted column. Other columns contain the probability of each class specified in the classes parameter.\nKey columns with the same value and data type as matching input columns specified in parameter key_columns.',
        example: ''
      },
      {
        name: 'PREDICT_RF_REGRESSOR',
        title: 'PREDICT_RF_REGRESSOR ( input‑columns)',
        description:
          'Applies a random forest model on an input relation, and returns with a FLOAT data type that specifies the predicted value of the random forest model—the average of the prediction of the trees in the forest.',
        example: ''
      },
      {
        name: 'PREDICT_SVM_CLASSIFIER',
        title: 'PREDICT_SVM_CLASSIFIER (input‑columns)',
        description: 'Uses an SVM model to predict class labels for samples in an input relation, and returns the predicted value as a FLOAT data type.',
        example: ''
      },
      {
        name: 'PREDICT_SVM_REGRESSOR',
        title: 'PREDICT_SVM_REGRESSOR(input‑columns)',
        description: 'Uses an SVM model to perform regression on samples in an input relation, and returns the predicted value as a FLOAT data type.',
        example: ''
      },
      {
        name: 'PREDICT_TENSORFLOW',
        title: 'PREDICT_TENSORFLOW ( input‑columns)',
        description: 'Applies a TensorFlow model on an input relation, and returns with the result expected for the encoded model type.',
        example: ''
      },
      {
        name: 'PREDICT_XGB_CLASSIFIER',
        title: 'PREDICT_XGB_CLASSIFIER ( input‑columns)',
        description:
          'Applies an XGBoost classifier model on an input relation. PREDICT_XGB_CLASSIFIER returns a VARCHAR data type that specifies one of the following, as determined by how the type parameter is set:\n\nThe predicted class (based on probability scores)\nProbability of a class for each input instance.',
        example: ''
      },
      {
        name: 'PREDICT_XGB_CLASSIFIER_CLASSES',
        title: 'PREDICT_XGB_CLASSIFIER_CLASSES ( predictor‑columns)',
        description:
          'Applies an XGBoost classifier model on an input relation and returns the probabilities of classes:\n\nVARCHAR predicted column contains the class label with the highest probability.\nMultiple FLOAT columns, where the first probability column contains the probability for the class reported in the predicted column. Other columns contain the probability of each class specified in the classes parameter.\nKey columns with the same value and data type as matching input columns specified in parameter key_columns.\nAll trees contribute to a predicted probability for each response class, and the highest probability class is chosen.',
        example: ''
      },
      {
        name: 'PREDICT_XGB_REGRESSOR',
        title: 'PREDICT_XGB_REGRESSOR ( input‑columns)',
        description:
          'Applies an XGBoost regressor model on an input relation. PREDICT_XGB_REGRESSOR returns a FLOAT data type that specifies the predicted value by the XGBoost model: a weighted sum of contributions by each tree in the model.',
        example: ''
      },
      {
        name: 'REVERSE_NORMALIZE',
        title: 'REVERSE_NORMALIZE ( input‑columns)',
        description:
          'Reverses the normalization transformation on normalized data, thereby de-normalizing the normalized data. If you specify a column that is not in the specified model, REVERSE_NORMALIZE returns that column unchanged.',
        example: ''
      }
    ],
    Math: [
      {
        name: 'ABS',
        title: 'ABS ( expression )',
        description: 'Returns the absolute value of a number.',
        example: 'SELECT ABS(-10); -- Result: 10'
      },
      {
        name: 'ACOS',
        title: 'ACOS ( expression )',
        description: 'Returns the inverse cosine (arc cosine) of a number.',
        example: 'SELECT ACOS(0.5); -- Result: 1.0471975511966'
      },
      {
        name: 'ASIN',
        title: 'ASIN ( expression )',
        description: 'Returns the inverse sine (arc sine) of a number.',
        example: 'SELECT ASIN(0.5); -- Result: 0.5235987755983'
      },
      {
        name: 'ATAN',
        title: 'ATAN ( expression )',
        description: 'Returns the inverse tangent (arc tangent) of a number.',
        example: 'SELECT ATAN(1); -- Result: 0.7853981633974'
      },
      {
        name: 'ATAN2',
        title: 'ATAN2 ( expression1, expression2 )',
        description: 'Returns the inverse tangent (arc tangent) of the quotient of two numbers.',
        example: 'SELECT ATAN2(1, 2); -- Result: 0.4636476090008'
      },
      {
        name: 'CBRT',
        title: 'CBRT ( expression )',
        description: 'Returns the cube root of a number.',
        example: 'SELECT CBRT(27); -- Result: 3'
      },
      {
        name: 'CEILING',
        title: 'CEILING ( expression )',
        description: 'Returns the smallest integer greater than or equal to a number.',
        example: 'SELECT CEILING(5.3); -- Result: 6'
      },
      {
        name: 'COS',
        title: 'COS ( expression )',
        description: 'Returns the cosine of an angle specified in radians.',
        example: 'SELECT COS(0); -- Result: 1'
      },
      {
        name: 'COSH',
        title: 'COSH ( expression )',
        description: 'Returns the hyperbolic cosine of a number.',
        example: 'SELECT COSH(0); -- Result: 1'
      },
      {
        name: 'COT',
        title: 'COT ( expression )',
        description: 'Returns the cotangent of an angle specified in radians.',
        example: 'SELECT COT(1); -- Result: 0.6420926159343'
      },
      {
        name: 'DEGREES',
        title: 'DEGREES ( expression )',
        description: 'Converts an angle specified in radians to degrees.',
        example: 'SELECT DEGREES(1.5707963267949); -- Result: 90'
      },
      {
        name: 'DISTANCE',
        title: 'DISTANCE ( x1, y1, x2, y2 )',
        description: 'Returns the Euclidean distance between two points in a two-dimensional plane.',
        example: 'SELECT DISTANCE(1, 2, 3, 4); -- Result: 2.8284271247462'
      },
      {
        name: 'DISTANCEV',
        title: 'DISTANCEV ( value1, value2, ... )',
        description: 'Returns the Euclidean distance between two vectors in a multi-dimensional space.',
        example: 'SELECT DISTANCEV(1, 2, 3, 4); -- Result: 5.6568542494924'
      },
      {
        name: 'EXP',
        title: 'EXP ( expression )',
        description: "Returns Euler's number e raised to the power of a number.",
        example: 'SELECT EXP(1); -- Result: 2.718281828459'
      },
      {
        name: 'FLOOR',
        title: 'FLOOR ( expression )',
        description: 'Returns the largest integer less than or equal to a number.',
        example: 'SELECT FLOOR(5.7); -- Result: 5'
      },
      {
        name: 'HASH',
        title: 'HASH ( expression )',
        description: 'Returns a hash value for the input expression.',
        example: "SELECT HASH('Hello'); -- Result: 550514691"
      },
      {
        name: 'LN',
        title: 'LN ( expression )',
        description: 'Returns the natural logarithm of a number.',
        example: 'SELECT LN(1); -- Result: 0'
      },
      {
        name: 'LOG',
        title: 'LOG ( base, expression )',
        description: 'Returns the logarithm of a number to a specified base.',
        example: 'SELECT LOG(10, 100); -- Result: 2'
      },
      {
        name: 'LOG10',
        title: 'LOG10 ( expression )',
        description: 'Returns the base-10 logarithm of a number.',
        example: 'SELECT LOG10(100); -- Result: 2'
      },
      {
        name: 'MOD',
        title: 'MOD ( dividend, divisor )',
        description: 'Returns the remainder after division of one number by another.',
        example: 'SELECT MOD(10, 3); -- Result: 1'
      },
      {
        name: 'PI',
        title: 'PI ()',
        description: 'Returns the value of the mathematical constant pi (π).',
        example: 'SELECT PI(); -- Result: 3.1415926535898'
      },
      {
        name: 'POWER',
        title: 'POWER ( base, exponent )',
        description: 'Returns the value of a number raised to the power of another number.',
        example: 'SELECT POWER(2, 3); -- Result: 8'
      },
      {
        name: 'RADIANS',
        title: 'RADIANS ( expression )',
        description: 'Converts an angle specified in degrees to radians.',
        example: 'SELECT RADIANS(90); -- Result: 1.5707963267949'
      },
      {
        name: 'RANDOM',
        title: 'RANDOM ()',
        description: 'Returns a random number between 0 and 1.',
        example: 'SELECT RANDOM(); -- Result: 0.123456789'
      },
      {
        name: 'RANDOMINT',
        title: 'RANDOMINT ( upper_bound )',
        description: 'Returns a random integer between 0 and the specified upper bound (exclusive).',
        example: 'SELECT RANDOMINT(10); -- Result: 7'
      },
      {
        name: 'RANDOMINT_CRYPTO',
        title: 'RANDOMINT_CRYPTO ( upper_bound )',
        description: 'Returns a cryptographically secure random integer between 0 and the specified upper bound (exclusive).',
        example: 'SELECT RANDOMINT_CRYPTO(100); -- Result: 72'
      },
      {
        name: 'ROUND',
        title: 'ROUND ( expression, precision )',
        description: 'Rounds a number to a specified number of decimal places.',
        example: 'SELECT ROUND(5.356, 2); -- Result: 5.36'
      },
      {
        name: 'SIGN',
        title: 'SIGN ( expression )',
        description: 'Returns the sign of a number (1 for positive, -1 for negative, and 0 for zero).',
        example: 'SELECT SIGN(-7.5); -- Result: -1'
      },
      {
        name: 'SIN',
        title: 'SIN ( expression )',
        description: 'Returns the sine of an angle specified in radians.',
        example: 'SELECT SIN(0); -- Result: 0'
      },
      {
        name: 'SINH',
        title: 'SINH ( expression )',
        description: 'Returns the hyperbolic sine of a number.',
        example: 'SELECT SINH(0); -- Result: 0'
      },
      {
        name: 'SQRT',
        title: 'SQRT ( expression )',
        description: 'Returns the square root of a number.',
        example: 'SELECT SQRT(25); -- Result: 5'
      },
      {
        name: 'TAN',
        title: 'TAN ( expression )',
        description: 'Returns the tangent of an angle specified in radians.',
        example: 'SELECT TAN(0); -- Result: 0'
      },
      {
        name: 'TANH',
        title: 'TANH ( expression )',
        description: 'Returns the hyperbolic tangent of a number.',
        example: 'SELECT TANH(0); -- Result: 0'
      },
      {
        name: 'TRUNC',
        title: 'TRUNC ( expression )',
        description: 'Truncates a number to an integer by removing the decimal portion.',
        example: 'SELECT TRUNC(5.7); -- Result: 5'
      },
      {
        name: 'WIDTH_BUCKET',
        title: 'WIDTH_BUCKET ( operand, low_value, high_value, num_buckets )',
        description: 'Assigns a bucket number to a value within specified range and number of buckets.',
        example: 'SELECT WIDTH_BUCKET(40, 0, 100, 5); -- Result: 3'
      }
    ],
    NullHandling: [
      {
        name: 'COALESCE',
        title: 'COALESCE ( expr1, expr2, ... )',
        description: 'Returns the first non-null expression in the list.',
        example: 'SELECT COALESCE(NULL, 10, 20); -- Result: 10'
      },
      {
        name: 'IFNULL',
        title: 'IFNULL ( expr1, expr2 )',
        description: 'Returns expr1 if it is not null, otherwise returns expr2.',
        example: 'SELECT IFNULL(NULL, 30); -- Result: 30'
      },
      {
        name: 'ISNULL',
        title: 'ISNULL ( expression )',
        description: 'Returns true if the expression is null, otherwise returns false.',
        example: 'SELECT ISNULL(40); -- Result: false'
      },
      {
        name: 'NULLIF',
        title: 'NULLIF ( expr1, expr2 )',
        description: 'Returns null if expr1 and expr2 are equal, otherwise returns expr1.',
        example: 'SELECT NULLIF(10, 10); -- Result: null'
      },
      {
        name: 'NULLIFZERO',
        title: 'NULLIFZERO ( expression )',
        description: 'Returns null if the expression is equal to zero, otherwise returns the expression.',
        example: 'SELECT NULLIFZERO(0); -- Result: null'
      },
      {
        name: 'NVL',
        title: 'NVL ( expr1, expr2 )',
        description: 'Returns expr1 if it is not null, otherwise returns expr2.',
        example: "SELECT NVL(NULL, 'Hello'); -- Result: 'Hello'"
      },
      {
        name: 'NVL2',
        title: 'NVL2 ( expr1, expr2, expr3 )',
        description: 'Returns expr2 if expr1 is not null, otherwise returns expr3.',
        example: "SELECT NVL2(10, 'Yes', 'No'); -- Result: 'Yes'"
      },
      {
        name: 'ZEROIFNULL',
        title: 'ZEROIFNULL ( expression )',
        description: 'Returns zero if the expression is null, otherwise returns the expression.',
        example: 'SELECT ZEROIFNULL(NULL); -- Result: 0'
      }
    ],
    PatternMatching: [
      {
        name: 'EVENT_NAME',
        title: 'EVENT_NAME()',
        description: 'Returns a VARCHAR value representing the name of the event that matched the row.',
        example: 'SELECT event_name();'
      },
      {
        name: 'MATCH_ID',
        title: 'MATCH_ID()',
        description: 'Returns a successful pattern match as an INTEGER value. The returned value is the ordinal position of a match within a partition.',
        example: 'SELECT uid,\n       sid,\n       ts,\n       refurl,\n       pageurl,\n       action,\n       match_id()\nFROM clickstream_log'
      }
    ],
    RegularExpression: [
      {
        name: 'ISUTF8',
        title: 'ISUTF8 ( string )',
        description: 'Checks if a string is valid UTF-8 encoding.',
        example: "SELECT ISUTF8('Hello'); -- Result: true"
      },
      {
        name: 'MATCH_COLUMNS',
        title: 'MATCH_COLUMNS ( column_name, regex_pattern )',
        description: 'Returns a boolean value indicating if the column values match the specified regular expression.',
        example: "SELECT MATCH_COLUMNS('email', '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$') FROM users;"
      },
      {
        name: 'REGEXP_COUNT',
        title: 'REGEXP_COUNT ( string, regex_pattern )',
        description: 'Returns the number of occurrences of a regular expression pattern in a string.',
        example: "SELECT REGEXP_COUNT('ababab', 'ab'); -- Result: 3"
      },
      {
        name: 'REGEXP_ILIKE',
        title: 'REGEXP_ILIKE ( string, regex_pattern )',
        description: 'Performs a case-insensitive regular expression match on a string.',
        example: "SELECT REGEXP_ILIKE('Hello', 'hello'); -- Result: true"
      },
      {
        name: 'REGEXP_INSTR',
        title: 'REGEXP_INSTR ( string, regex_pattern )',
        description: 'Returns the position of the first occurrence of a regular expression pattern in a string.',
        example: "SELECT REGEXP_INSTR('hello world', 'lo'); -- Result: 4"
      },
      {
        name: 'REGEXP_LIKE',
        title: 'REGEXP_LIKE ( string, regex_pattern )',
        description: 'Performs a case-sensitive regular expression match on a string.',
        example: "SELECT REGEXP_LIKE('Hello', 'hello'); -- Result: false"
      },
      {
        name: 'REGEXP_NOT_ILIKE',
        title: 'REGEXP_NOT_ILIKE ( string, regex_pattern )',
        description: 'Performs a case-insensitive regular expression non-match on a string.',
        example: "SELECT REGEXP_NOT_ILIKE('Hello', 'hello'); -- Result: false"
      },
      {
        name: 'REGEXP_NOT_LIKE',
        title: 'REGEXP_NOT_LIKE ( string, regex_pattern )',
        description: 'Performs a case-sensitive regular expression non-match on a string.',
        example: "SELECT REGEXP_NOT_LIKE('Hello', 'hello'); -- Result: true"
      },
      {
        name: 'REGEXP_REPLACE',
        title: 'REGEXP_REPLACE ( string, regex_pattern, replacement )',
        description: 'Replaces occurrences of a regular expression pattern in a string with a specified replacement.',
        example: "SELECT REGEXP_REPLACE('Hello world', 'o', 'x'); -- Result: 'Hellx wxrld'"
      },
      {
        name: 'REGEXP_SUBSTR',
        title: 'REGEXP_SUBSTR ( string, regex_pattern )',
        description: 'Extracts substrings from a string that match a regular expression pattern.',
        example: "SELECT REGEXP_SUBSTR('123abc456', '[0-9]+'); -- Result: '123'"
      }
    ],
    Sequence: [
      {
        name: 'CURRVAL',
        title: 'CURRVAL ( sequence_name )',
        description: 'Returns the current value of a sequence generator.',
        example: "SELECT CURRVAL('my_sequence'); -- Result: 100"
      },
      {
        name: 'LAST_INSERT_ID',
        title: 'LAST_INSERT_ID()',
        description: 'Returns the last automatically generated value (e.g., AUTO_INCREMENT in MySQL) that was inserted into a column in the current session.',
        example: 'SELECT LAST_INSERT_ID(); -- Result: 123'
      },
      {
        name: 'NEXTVAL',
        title: 'NEXTVAL ( sequence_name )',
        description: 'Returns the next value of a sequence generator and advances the sequence.',
        example: "SELECT NEXTVAL('my_sequence'); -- Result: 101"
      }
    ],
    String: [
      {
        name: 'ASCII',
        title: 'ASCII ( string )',
        description: 'Returns the ASCII code value of the first character in a string.',
        example: "SELECT ASCII('A'); -- Result: 65"
      },
      {
        name: 'BIT_LENGTH',
        title: 'BIT_LENGTH ( expression )',
        description: 'Returns the length of a string in bits.',
        example: "SELECT BIT_LENGTH('Hello'); -- Result: 40"
      },
      {
        name: 'BITCOUNT',
        title: 'BITCOUNT ( binary )',
        description: 'Returns the number of set bits in a binary value.',
        example: 'SELECT BITCOUNT(255); -- Result: 8'
      },
      {
        name: 'BITSTRING_TO_BINARY',
        title: 'BITSTRING_TO_BINARY ( bitstring )',
        description: 'Converts a bit string to a binary value.',
        example: "SELECT BITSTRING_TO_BINARY('101010'); -- Result: 42"
      },
      {
        name: 'BTRIM',
        title: 'BTRIM ( string )',
        description: 'Removes leading and trailing spaces (or other characters) from a string.',
        example: "SELECT BTRIM('   Hello   '); -- Result: 'Hello'"
      },
      {
        name: 'CHARACTER_LENGTH',
        title: 'CHARACTER_LENGTH ( string )',
        description: 'Returns the number of characters in a string.',
        example: "SELECT CHARACTER_LENGTH('Hello'); -- Result: 5"
      },
      {
        name: 'CHR',
        title: 'CHR ( integer )',
        description: 'Returns the character represented by the ASCII code value.',
        example: "SELECT CHR(65); -- Result: 'A'"
      },
      {
        name: 'COLLATION',
        title: 'COLLATION ( expression )',
        description: 'Returns the collation of a string expression.',
        example: "SELECT COLLATION('Hello'); -- Result: 'en_US'"
      },
      {
        name: 'CONCAT',
        title: 'CONCAT ( string1, string2, ... )',
        description: 'Concatenates two or more strings.',
        example: "SELECT CONCAT('Hello', ' ', 'World'); -- Result: 'Hello World'"
      },
      {
        name: 'DECODE',
        title: 'DECODE ( expression, search, result [, search, result]... [, default] )',
        description: 'Decodes an expression by comparing it to a list of search expressions and returning a result based on the first match.',
        example: "SELECT DECODE(2, 1, 'One', 2, 'Two', 'Default'); -- Result: 'Two'"
      },
      {
        name: 'EDIT_DISTANCE',
        title: 'EDIT_DISTANCE ( string1, string2 )',
        description: 'Calculates the Levenshtein distance between two strings.',
        example: "SELECT EDIT_DISTANCE('kitten', 'sitting'); -- Result: 3"
      },
      {
        name: 'GREATEST',
        title: 'GREATEST ( expr1, expr2, ... )',
        description: 'Returns the greatest value among the list of expressions.',
        example: 'SELECT GREATEST(10, 20, 30); -- Result: 30'
      },
      {
        name: 'GREATESTB',
        title: 'GREATESTB ( expr1, expr2, ... )',
        description: 'Returns the greatest binary value among the list of expressions.',
        example: 'SELECT GREATESTB(10, 20, 30); -- Result: 30'
      },
      {
        name: 'HEX_TO_BINARY',
        title: 'HEX_TO_BINARY ( hex_string )',
        description: 'Converts a hexadecimal string to a binary value.',
        example: "SELECT HEX_TO_BINARY('1F'); -- Result: 31"
      },
      {
        name: 'HEX_TO_INTEGER',
        title: 'HEX_TO_INTEGER ( hex_string )',
        description: 'Converts a hexadecimal string to an integer value.',
        example: "SELECT HEX_TO_INTEGER('A0'); -- Result: 160"
      },
      {
        name: 'INET_ATON',
        title: 'INET_ATON ( ip_address )',
        description: 'Converts an IP address string to a numeric value.',
        example: "SELECT INET_ATON('192.168.1.1'); -- Result: 3232235777"
      },
      {
        name: 'INET_NTOA',
        title: 'INET_NTOA ( numeric_ip )',
        description: 'Converts a numeric IP address to a string.',
        example: "SELECT INET_NTOA(3232235777); -- Result: '192.168.1.1'"
      },
      {
        name: 'INITCAP',
        title: 'INITCAP ( string )',
        description: 'Converts the first character of each word to uppercase and the rest to lowercase.',
        example: "SELECT INITCAP('hello world'); -- Result: 'Hello World'"
      },
      {
        name: 'INITCAPB',
        title: 'INITCAPB ( string )',
        description: 'Converts the first character of each word in a binary string to uppercase and the rest to lowercase.',
        example: "SELECT INITCAPB('hello world'); -- Result: 'Hello World'"
      },
      {
        name: 'INSERT',
        title: 'INSERT ( source_string, start_position, replace_length, insert_string )',
        description: 'Replaces a substring in a string with another substring.',
        example: "SELECT INSERT('Hello World', 7, 5, 'Universe'); -- Result: 'Hello Universe'"
      },
      {
        name: 'INSTR',
        title: 'INSTR ( source_string, search_string )',
        description: 'Returns the position of the first occurrence of a substring in a string.',
        example: "SELECT INSTR('Hello World', 'World'); -- Result: 7"
      },
      {
        name: 'INSTRB',
        title: 'INSTRB ( source_string, search_string )',
        description: 'Returns the position of the first occurrence of a substring in a binary string.',
        example: "SELECT INSTRB('Hello World', 'World'); -- Result: 7"
      },
      {
        name: 'ISUTF8',
        title: 'ISUTF8 ( string )',
        description: 'Checks if a string is valid UTF-8 encoding.',
        example: "SELECT ISUTF8('Hello'); -- Result: true"
      },
      {
        name: 'LEAST',
        title: 'LEAST ( expr1, expr2, ... )',
        description: 'Returns the smallest value among the list of expressions.',
        example: 'SELECT LEAST(10, 20, 30); -- Result: 10'
      },
      {
        name: 'LEASTB',
        title: 'LEASTB ( expr1, expr2, ... )',
        description: 'Returns the smallest binary value among the list of expressions.',
        example: 'SELECT LEASTB(10, 20, 30); -- Result: 10'
      },
      {
        name: 'LEFT',
        title: 'LEFT ( string, length )',
        description: 'Returns a specified number of characters from the left of a string.',
        example: "SELECT LEFT('Hello World', 5); -- Result: 'Hello'"
      },
      {
        name: 'LENGTH',
        title: 'LENGTH ( string )',
        description: 'Returns the number of bytes in a string.',
        example: "SELECT LENGTH('Hello'); -- Result: 5"
      },
      {
        name: 'LOWER',
        title: 'LOWER ( string )',
        description: 'Converts a string to lowercase.',
        example: "SELECT LOWER('Hello'); -- Result: 'hello'"
      },
      {
        name: 'LOWERB',
        title: 'LOWERB ( string )',
        description: 'Converts a binary string to lowercase.',
        example: "SELECT LOWERB('Hello'); -- Result: 'hello'"
      },
      {
        name: 'LPAD',
        title: 'LPAD ( string, length, pad_string )',
        description: 'Pads a string on the left with a specified pad string to a specified length.',
        example: "SELECT LPAD('Hello', 10, '-'); -- Result: '-----Hello'"
      },
      {
        name: 'LTRIM',
        title: 'LTRIM ( string )',
        description: 'Removes leading spaces (or other characters) from a string.',
        example: "SELECT LTRIM('   Hello   '); -- Result: 'Hello   '"
      },
      {
        name: 'MAKEUTF8',
        title: 'MAKEUTF8 ( string )',
        description: 'Converts a string to UTF-8 encoding.',
        example: "SELECT MAKEUTF8('Hello'); -- Result: 'Hello'"
      },
      {
        name: 'MD5',
        title: 'MD5 ( string )',
        description: 'Calculates the MD5 hash of a string.',
        example: "SELECT MD5('Hello'); -- Result: '5d41402abc4b2a76b9719d911017c592'"
      },
      {
        name: 'OCTET_LENGTH',
        title: 'OCTET_LENGTH ( string )',
        description: 'Returns the number of bytes in a string.',
        example: "SELECT OCTET_LENGTH('Hello'); -- Result: 5"
      },
      {
        name: 'OVERLAY',
        title: 'OVERLAY ( source_string, replace_string, start_position [, replace_length] )',
        description: 'Replaces a substring in a string with another substring.',
        example: "SELECT OVERLAY('Hello World', 'Universe', 7, 5); -- Result: 'Hello Universe'"
      },
      {
        name: 'OVERLAYB',
        title: 'OVERLAYB ( source_string, replace_string, start_position [, replace_length] )',
        description: 'Replaces a substring in a binary string with another substring.',
        example: "SELECT OVERLAYB('Hello World', 'Universe', 7, 5); -- Result: 'Hello Universe'"
      },
      {
        name: 'POSITION',
        title: 'POSITION ( search_string IN source_string )',
        description: 'Returns the position of the first occurrence of a substring in a string.',
        example: "SELECT POSITION('World' IN 'Hello World'); -- Result: 7"
      },
      {
        name: 'POSITIONB',
        title: 'POSITIONB ( search_string IN source_string )',
        description: 'Returns the position of the first occurrence of a substring in a binary string.',
        example: "SELECT POSITIONB('World' IN 'Hello World'); -- Result: 7"
      },
      {
        name: 'QUOTE_IDENT',
        title: 'QUOTE_IDENT ( identifier )',
        description: 'Returns an escaped SQL identifier.',
        example: "SELECT QUOTE_IDENT('my_table'); -- Result: '\"my_table\"'"
      },
      {
        name: 'QUOTE_LITERAL',
        title: 'QUOTE_LITERAL ( literal )',
        description: 'Returns an escaped SQL string literal.',
        example: "SELECT QUOTE_LITERAL('It''s raining'); -- Result: '''It''s raining'''"
      },
      {
        name: 'QUOTE_NULLABLE',
        title: 'QUOTE_NULLABLE ( literal )',
        description: 'Returns an escaped SQL string literal or NULL if the input is null.',
        example: "SELECT QUOTE_NULLABLE('Hello'); -- Result: '''Hello'''"
      },
      {
        name: 'REPEAT',
        title: 'REPEAT ( string, count )',
        description: 'Repeats a string a specified number of times.',
        example: "SELECT REPEAT('Hello', 3); -- Result: 'HelloHelloHello'"
      },
      {
        name: 'REPLACE',
        title: 'REPLACE ( source_string, search_string, replace_string )',
        description: 'Replaces all occurrences of a substring in a string with another substring.',
        example: "SELECT REPLACE('Hello World', 'World', 'Universe'); -- Result: 'Hello Universe'"
      },
      {
        name: 'RIGHT',
        title: 'RIGHT ( string, length )',
        description: 'Returns a specified number of characters from the right of a string.',
        example: "SELECT RIGHT('Hello World', 5); -- Result: 'World'"
      },
      {
        name: 'RPAD',
        title: 'RPAD ( string, length, pad_string )',
        description: 'Pads a string on the right with a specified pad string to a specified length.',
        example: "SELECT RPAD('Hello', 10, '-'); -- Result: 'Hello-----'"
      },
      {
        name: 'RTRIM',
        title: 'RTRIM ( string )',
        description: 'Removes trailing spaces (or other characters) from a string.',
        example: "SELECT RTRIM('   Hello   '); -- Result: '   Hello'"
      },
      {
        name: 'SHA1',
        title: 'SHA1 ( string )',
        description: 'Calculates the SHA1 hash of a string.',
        example: "SELECT SHA1('Hello'); -- Result: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c'"
      },
      {
        name: 'SHA224',
        title: 'SHA224 ( string )',
        description: 'Calculates the SHA224 hash of a string.',
        example: "SELECT SHA224('Hello'); -- Result: 'ea09ae9cc6768c50fcee903ed054556e5bfc8347907f12598aa24193'"
      },
      {
        name: 'SHA256',
        title: 'SHA256 ( string )',
        description: 'Calculates the SHA256 hash of a string.',
        example: "SELECT SHA256('Hello'); -- Result: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'"
      },
      {
        name: 'SHA384',
        title: 'SHA384 ( string )',
        description: 'Calculates the SHA384 hash of a string.',
        example: "SELECT SHA384('Hello'); -- Result: '59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13ab5ed75a2'"
      },
      {
        name: 'SHA512',
        title: 'SHA512 ( string )',
        description: 'Calculates the SHA512 hash of a string.',
        example:
          "SELECT SHA512('Hello'); -- Result: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3aDEF46F73BCDEC043'"
      },
      {
        name: 'SOUNDEX',
        title: 'SOUNDEX ( string )',
        description: 'Calculates the soundex code of a string.',
        example: "SELECT SOUNDEX('Robert'); -- Result: 'R163'"
      },
      {
        name: 'SOUNDEX_MATCHES',
        title: 'SOUNDEX_MATCHES ( string1, string2 )',
        description: 'Checks if two strings have the same soundex code.',
        example: "SELECT SOUNDEX_MATCHES('Robert', 'Rupert'); -- Result: true"
      },
      {
        name: 'SPACE',
        title: 'SPACE ( length )',
        description: 'Returns a string of spaces with the specified length.',
        example: "SELECT SPACE(5); -- Result: '     '"
      },
      {
        name: 'SPLIT_PART',
        title: 'SPLIT_PART ( string, delimiter, field_number )',
        description: 'Extracts a field from a string using a delimiter.',
        example: "SELECT SPLIT_PART('John_Doe', '_', 2); -- Result: 'Doe'"
      },
      {
        name: 'SPLIT_PARTB',
        title: 'SPLIT_PARTB ( string, delimiter, field_number )',
        description: 'Extracts a field from a binary string using a delimiter.',
        example: "SELECT SPLIT_PARTB('John_Doe', '_', 2); -- Result: 'Doe'"
      },
      {
        name: 'STRPOS',
        title: 'STRPOS ( source_string, search_string )',
        description: 'Returns the position of the first occurrence of a substring in a string.',
        example: "SELECT STRPOS('Hello World', 'World'); -- Result: 7"
      },
      {
        name: 'STRPOSB',
        title: 'STRPOSB ( source_string, search_string )',
        description: 'Returns the position of the first occurrence of a substring in a binary string.',
        example: "SELECT STRPOSB('Hello World', 'World'); -- Result: 7"
      },
      {
        name: 'SUBSTR',
        title: 'SUBSTR ( string, start_position [, length] )',
        description: 'Returns a substring of a string starting from a specified position.',
        example: "SELECT SUBSTR('Hello World', 7, 5); -- Result: 'World'"
      },
      {
        name: 'SUBSTRB',
        title: 'SUBSTRB ( string, start_position [, length] )',
        description: 'Returns a substring of a binary string starting from a specified position.',
        example: "SELECT SUBSTRB('Hello World', 7, 5); -- Result: 'World'"
      },
      {
        name: 'SUBSTRING',
        title: 'SUBSTRING ( source_string FROM start_position [FOR length] )',
        description: 'Returns a substring of a string starting from a specified position.',
        example: "SELECT SUBSTRING('Hello World' FROM 7 FOR 5); -- Result: 'World'"
      },
      {
        name: 'TO_BITSTRING',
        title: 'TO_BITSTRING ( integer )',
        description: 'Converts an integer to a bit string.',
        example: "SELECT TO_BITSTRING(42); -- Result: '101010'"
      },
      {
        name: 'TO_HEX',
        title: 'TO_HEX ( numeric )',
        description: 'Converts a numeric value to a hexadecimal string.',
        example: "SELECT TO_HEX(42); -- Result: '2A'"
      },
      {
        name: 'TRANSLATE',
        title: 'TRANSLATE ( source_string, from_string, to_string )',
        description: 'Translates characters in a string from one set of characters to another.',
        example: "SELECT TRANSLATE('Hello World', 'l', 'L'); -- Result: 'HeLLo WorLd'"
      },
      {
        name: 'TRIM',
        title: 'TRIM ( [ [ BOTH | LEADING | TRAILING ] [ trim_character ] FROM ] string )',
        description: 'Removes leading and/or trailing spaces (or other characters) from a string.',
        example: "SELECT TRIM('   Hello   '); -- Result: 'Hello'"
      },
      {
        name: 'UPPER',
        title: 'UPPER ( string )',
        description: 'Converts a string to uppercase.',
        example: "SELECT UPPER('Hello'); -- Result: 'HELLO'"
      },
      {
        name: 'UPPERB',
        title: 'UPPERB ( string )',
        description: 'Converts a binary string to uppercase.',
        example: "SELECT UPPERB('Hello'); -- Result: 'HELLO'"
      },
      {
        name: 'V6_ATON',
        title: 'V6_ATON ( ipv6_address )',
        description: 'Converts an IPv6 address string to a numeric value.',
        example: "SELECT V6_ATON('2001:0db8:85a3:0000:0000:8a2e:0370:7334'); -- Result: 42540766411282592856904265521221385556"
      },
      {
        name: 'V6_NTOA',
        title: 'V6_NTOA ( numeric_ipv6 )',
        description: 'Converts a numeric IPv6 address to a string.',
        example: "SELECT V6_NTOA(42540766411282592856904265521221385556); -- Result: '2001:db8:85a3::8a2e:370:7334'"
      },
      {
        name: 'V6_SUBNETA',
        title: 'V6_SUBNETA ( ipv6_subnet )',
        description: 'Extracts the network address from an IPv6 subnet.',
        example: "SELECT V6_SUBNETA('2001:0db8:85a3::/64'); -- Result: '2001:db8:85a3::'"
      },
      {
        name: 'V6_SUBNETN',
        title: 'V6_SUBNETN ( ipv6_subnet )',
        description: 'Extracts the prefix length from an IPv6 subnet.',
        example: "SELECT V6_SUBNETN('2001:0db8:85a3::/64'); -- Result: 64"
      },
      {
        name: 'V6_TYPE',
        title: 'V6_TYPE ( ipv6_address )',
        description: 'Returns the type of an IPv6 address.',
        example: "SELECT V6_TYPE('2001:0db8:85a3::8a2e:0370:7334'); -- Result: 'global unicast'"
      }
    ],
    System: [
      {
        name: 'CURRENT_DATABASE',
        title: 'CURRENT_DATABASE()',
        description: 'Returns the name of the current database.',
        example: "SELECT CURRENT_DATABASE(); -- Result: 'my_database'"
      },
      {
        name: 'CURRENT_SCHEMA',
        title: 'CURRENT_SCHEMA()',
        description: 'Returns the name of the current schema.',
        example: "SELECT CURRENT_SCHEMA(); -- Result: 'public'"
      },
      {
        name: 'CURRENT_USER',
        title: 'CURRENT_USER()',
        description: 'Returns the name of the current user.',
        example: "SELECT CURRENT_USER(); -- Result: 'user123'"
      },
      {
        name: 'DBNAME',
        title: 'DBNAME(oid)',
        description: 'Returns the name of a database given its object identifier (OID).',
        example: "SELECT DBNAME(1234); -- Result: 'my_database'"
      },
      {
        name: 'HAS_TABLE_PRIVILEGE',
        title: 'HAS_TABLE_PRIVILEGE(grantee, tablename, privilege)',
        description: 'Checks if a grantee has a specified privilege on a table.',
        example: "SELECT HAS_TABLE_PRIVILEGE('user123', 'my_table', 'SELECT'); -- Result: true"
      },
      {
        name: 'LIST_ENABLED_CIPHERS',
        title: 'LIST_ENABLED_CIPHERS()',
        description: 'Lists the enabled encryption ciphers for the current session.',
        example: "SELECT LIST_ENABLED_CIPHERS(); -- Result: 'AES128, AES256'"
      },
      {
        name: 'SESSION_USER',
        title: 'SESSION_USER()',
        description: "Returns the name of the current session's user.",
        example: "SELECT SESSION_USER(); -- Result: 'user123'"
      },
      {
        name: 'USER',
        title: 'USER',
        description: 'Returns the name of the current user.',
        example: "SELECT USER; -- Result: 'user123'"
      },
      {
        name: 'USERNAME',
        title: 'USERNAME()',
        description: "Returns the operating system's user name.",
        example: "SELECT USERNAME(); -- Result: 'john_doe'"
      },
      {
        name: 'VERSION',
        title: 'VERSION()',
        description: 'Returns the version of the Vertica database.',
        example: "SELECT VERSION(); -- Result: 'v11.0.2'"
      }
    ],
    Time: [
      {
        name: 'TS_FIRST_VALUE',
        title: "TS_FIRST_VALUE ( expression [ IGNORE NULLS ] [, { 'CONST' | 'LINEAR' } ] ) ",
        description:
          'Processes the data that belongs to each time slice. A time series aggregate (TSA) function, TS_FIRST_VALUE returns the value at the start of the time slice, where an interpolation scheme is applied if the timeslice is missing, in which case the value is determined by the values corresponding to the previous (and next) timeslices based on the interpolation scheme of const (linear).\n\nTS_FIRST_VALUE returns one output row per time slice, or one output row per partition per time slice if partition expressions are specified',
        example:
          "SELECT slice_time, symbol,       \nTS_FIRST_VALUE(bid, 'const') fv_c,\n       TS_FIRST_VALUE(bid, 'linear') fv_l,\n       TS_LAST_VALUE(bid, 'const') lv_c\nFROM TickStore\nTIMESERIES slice_time AS '3 seconds' \nOVER(PARTITION BY symbol ORDER BY ts);'"
      },
      {
        name: 'TS_LAST_VALUE',
        title: "TS_LAST_VALUE ( expression [ IGNORE NULLS ] [, { 'CONST' | 'LINEAR' } ] ) ",
        description:
          'Processes the data that belongs to each time slice. A time series aggregate (TSA) function, TS_LAST_VALUE returns the value at the end of the time slice, where an interpolation scheme is applied if the timeslice is missing. In this case the value is determined by the values corresponding to the previous (and next) timeslices based on the interpolation scheme of const (linear).\n\nTS_LAST_VALUE returns one output row per time slice, or one output row per partition per time slice if partition expressions are specified.',
        example:
          "SELECT slice_time, symbol,       \nTS_FIRST_VALUE(bid, 'const') fv_c,\n       TS_FIRST_VALUE(bid, 'linear') fv_l,\n       TS_LAST_VALUE(bid, 'const') lv_c\nFROM TickStore\nTIMESERIES slice_time AS '3 seconds' \nOVER(PARTITION BY symbol ORDER BY ts);"
      }
    ],
    URI: [
      {
        name: 'URI_PERCENT_DECODE',
        title: 'URI_PERCENT_DECODE (expression)',
        description: 'Decodes a percent-encoded Universal Resource Identifier (URI) according to the RFC 3986 standard.',
        example: 'SELECT URI_PERCENT_DECODE(Websites) from URI;'
      },
      {
        name: 'URI_PERCENT_ENCODE',
        title: 'URI_PERCENT_ENCODE (expression)',
        description:
          'Encodes a Universal Resource Identifier (URI) according to the RFC 3986 standard for percent encoding. For compatibility with older encoders, this function converts + to space; space is converted to %20.',
        example: 'SELECT Websites, URI_PERCENT_ENCODE(Websites) from URI;'
      }
    ],
    UUID: [
      {
        name: 'UUID_GENERATE',
        title: 'UUID_GENERATE()',
        description: 'Returns a new universally unique identifier (UUID) that is generated based on high-quality randomness from /dev/urandom.',
        example: 'CREATE TABLE Customers(\n     cust_id UUID DEFAULT UUID_GENERATE(), \n   lname VARCHAR(36), \n   fname VARCHAR(24));'
      }
    ]
  }
});
