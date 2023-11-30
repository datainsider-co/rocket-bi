export const getBigquerySyntax = () => ({
  name: 'bigquery',
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
    keywords: [
      // from https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#reserved_keywords
      'ALL',
      'AND',
      'ANY',
      'ARRAY',
      'AS',
      'ASC',
      'ASSERT_ROWS_MODIFIED',
      'AT',
      'BETWEEN',
      'BY',
      'CASE',
      'CAST',
      'COLLATE',
      'CONTAINS',
      'CREATE',
      'CROSS',
      'CUBE',
      'CURRENT',
      'DEFAULT',
      'DEFINE',
      'DESC',
      'DISTINCT',
      'ELSE',
      'END',
      'ENUM',
      'ESCAPE',
      'EXCEPT',
      'EXCLUDE',
      'EXISTS',
      'EXTRACT',
      'FALSE',
      'FETCH',
      'FOLLOWING',
      'FOR',
      'FROM',
      'FULL',
      'GROUP',
      'GROUPING',
      'GROUPS',
      'HASH',
      'HAVING',
      'IF',
      'IGNORE',
      'IN',
      'INNER',
      'INTERSECT',
      'INTERVAL',
      'INTO',
      'IS',
      'JOIN',
      'LATERAL',
      'LEFT',
      'LIKE',
      'LIMIT',
      'LOOKUP',
      'MERGE',
      'NATURAL',
      'NEW',
      'NO',
      'NOT',
      'NULL',
      'NULLS',
      'OF',
      'ON',
      'OR',
      'ORDER',
      'OUTER',
      'OVER',
      'PARTITION',
      'PRECEDING',
      'PROTO',
      'QUALIFY',
      'RANGE',
      'RECURSIVE',
      'RESPECT',
      'RIGHT',
      'ROLLUP',
      'ROWS',
      'SELECT',
      'SET',
      'SOME',
      'STRUCT',
      'TABLESAMPLE',
      'THEN',
      'TO',
      'TREAT',
      'TRUE',
      'UNBOUNDED',
      'UNION',
      'UNNEST',
      'USING',
      'WHEN',
      'WHERE',
      'WINDOW',
      'WITH',
      'WITHIN'
    ],
    databases: [],
    tables: [],
    columns: [],
    operators: ['AND', 'BETWEEN', 'IN', 'LIKE', 'NOT', 'OR', 'IS', 'NULL', 'INTERSECT', 'UNION', 'INNER', 'JOIN', 'LEFT', 'OUTER', 'RIGHT', 'GLOBAL'],
    builtinFunctions: [
      // aggregate functions
      'ANY_VALUE',
      'ARRAY_AGG',
      'ARRAY_CONCAT_AGG',
      'AVG',
      'BIT_AND',
      'BIT_OR',
      'BIT_XOR',
      'COUNT',
      'COUNTIF',
      'LOGICAL_AND',
      'LOGICAL_OR',
      'MAX',
      'MIN',
      'STRING_AGG',
      'SUM',
      // statistical aggregate functions
      'CORR',
      'COVAR_POP',
      'COVAR_SAMP',
      'STDDEV_POP',
      'STDDEV_SAMP',
      'STDDEV',
      'VAR_POP',
      'VAR_SAMP',
      'VARIANCE',
      // approximate aggregate functions
      'APPROX_COUNT_DISTINCT',
      'APPROX_QUANTILES',
      'APPROX_TOP_COUNT',
      'APPROX_TOP_SUM',
      // hyperloglog++ functions
      'HLL_COUNT.INIT',
      'HLL_COUNT.MERGE',
      'HLL_COUNT.MERGE_PARTIAL',
      'HLL_COUNT.EXTRACT',
      // numbering functions
      'RANK',
      'DENSE_RANK',
      'PERCENT_RANK',
      'CUME_DIST',
      'NTILE',
      'ROW_NUMBER',
      // bit functions
      'BIT_COUNT',
      // conversion functions
      'CAST',
      'PARSE_BIGNUMERIC',
      'PARSE_NUMERIC',
      'SAFE_CAST',
      // mathematical functions
      'ABS',
      'SIGN',
      'IS_INF',
      'IS_NAN',
      'IEEE_DIVIDE',
      'RAND',
      'SQRT',
      'POW',
      'POWER',
      'EXP',
      'LN',
      'LOG',
      'LOG10',
      'GREATEST',
      'LEAST',
      'DIV',
      'SAFE_DIVIDE',
      'SAFE_MULTIPLY',
      'SAFE_NEGATE',
      'SAFE_ADD',
      'SAFE_SUBTRACT',
      'MOD',
      'ROUND',
      'TRUNC',
      'CEIL',
      'CEILING',
      'FLOOR',
      'COS',
      'COSH',
      'ACOS',
      'ACOSH',
      'SIN',
      'SINH',
      'ASIN',
      'ASINH',
      'TAN',
      'TANH',
      'ATAN',
      'ATANH',
      'ATAN2',
      'RANGE_BUCKET',
      // navigation functions
      'FIRST_VALUE',
      'LAST_VALUE',
      'NTH_VALUE',
      'LEAD',
      'LAG',
      'PERCENTILE_COUNT',
      'PERCENTILE_DISC',
      // aggregate analytic functions (functions are listed under other categories)
      // hash functions
      'FARM_FINGERPRINT',
      'MD5',
      'SHA1',
      'SHA256',
      'SHA512',
      // string functions
      'ASCII',
      'BYTE_LENGTH',
      'CHAR_LENGTH',
      'CHARACTER_LENGTH',
      'CHR',
      'CODE_POINTS_TO_BYTES',
      'CODE_POINTS_TO_STRING',
      'COLLATE',
      'CONCAT',
      'CONTAINS_SUBSTR',
      'ENDS_WITH',
      'FORMAT',
      'FROM_BASE32',
      'FROM_BASE64',
      'FROM_HEX',
      'INITCAP',
      'INSTR',
      'LEFT',
      'LENGTH',
      'LPAD',
      'LOWER',
      'LTRIM',
      'NORMALIZE',
      'NORMALIZE_AND_CASEFOLD',
      'OCTET_LENGTH',
      'REGEXP_CONTAINS',
      'REGEXP_EXTRACT',
      'REGEXP_EXTRACT_ALL',
      'REGEXP_INSTR',
      'REGEXP_REPLACE',
      'REGEXP_SUBSTR',
      'REPLACE',
      'REPEAT',
      'REVERSE',
      'RIGHT',
      'RPAD',
      'RTRIM',
      'SAFE_CONVERT_BYTES_TO_STRING',
      'SOUNDEX',
      'SPLIT',
      'STARTS_WITH',
      'STRPOS',
      'SUBSTR',
      'SUBSTRING',
      'TO_BASE32',
      'TO_BASE64',
      'TO_CODE_POINTS',
      'TO_HEX',
      'TRANSLATE',
      'TRIM',
      'UNICODE',
      'UPPER',
      // json functions
      'JSON_EXTRACT',
      'JSON_QUERY',
      'JSON_EXTRACT_SCALAR',
      'JSON_VALUE',
      'JSON_EXTRACT_ARRAY',
      'JSON_QUERY_ARRAY',
      'JSON_EXTRACT_STRING_ARRAY',
      'JSON_VALUE_ARRAY',
      'PARSE_JSON',
      'TO_JSON',
      'TO_JSON_STRING',
      'STRING',
      'BOOL',
      'INT64',
      'FLOAT64',
      'JSON_TYPE',
      // array functions
      'ARRAY',
      'ARRAY_CONCAT',
      'ARRAY_LENGTH',
      'ARRAY_TO_STRING',
      'GENERATE_ARRAY',
      'GENERATE_DATE_ARRAY',
      'GENERATE_TIMESTAMP_ARRAY',
      'ARRAY_REVERSE',
      // date functions
      'CURRENT_DATE',
      'EXTRACT',
      'DATE',
      'DATE_ADD',
      'DATE_SUB',
      'DATE_DIFF',
      'DATE_TRUNC',
      'DATE_FROM_UNIX_DATE',
      'FORMAT_DATE',
      'LAST_DAY',
      'PARSE_DATE',
      'UNIX_DATE',
      // datetime functions
      'CURRENT_DATETIME',
      'DATETIME',
      //'EXTRACT', (duplicated above)
      'DATETIME_ADD',
      'DATETIME_SUB',
      'DATETIME_DIFF',
      'DATETIME_TRUNC',
      'FORMAT_DATETIME',
      // 'LAST_DAY', (duplicated above)
      'PARSE_DATETIME',
      // time functions
      'CURRENT_TIME',
      'TIME',
      // 'EXTRACT', (duplicated above)
      'TIME_ADD',
      'TIME_SUB',
      'TIME_DIFF',
      'TIME_TRUNC',
      'FORMAT_TIME',
      'PARSE_TIME',
      // timestamp functions
      'CURRENT_TIMESTAMP',
      // 'EXTRACT', (duplicated above)
      'STRING',
      'TIMESTAMP',
      'TIMESTAMP_ADD',
      'TIMESTAMP_SUB',
      'TIMESTAMP_DIFF',
      'TIMESTAMP_TRUNC',
      'FORMAT_TIMESTAMP',
      'PARSE_TIMESTAMP',
      'TIMESTAMP_SECONDS',
      'TIMESTAMP_MILLIS',
      'TIMESTAMP_MICROS',
      'UNIX_SECONDS',
      'UNIX_MILLIS',
      'UNIX_MICROS',
      // interval functions
      'MAKE_INTERVAL',
      // 'EXTRACT', (duplicated above)
      'JUSTIFY_DAYS',
      'JUSTIFY_HOURS',
      'JUSTIFY_INTERVAL',
      // geography functions
      'S2_CELLIDFROMPOINT',
      'S2_COVERINGCELLIDS',
      'ST_ANGLE',
      'ST_AREA',
      'ST_ASBINARY',
      'ST_ASGEOJSON',
      'ST_ASTEXT',
      'ST_AZIMUTH',
      'ST_BOUNDARY',
      'ST_BOUNDINGBOX',
      'ST_BUFFER',
      'ST_BUFFERWITHTOLERANCE',
      'ST_CENTROID',
      'ST_CENTROID_AGG',
      'ST_CLOSESTPOINT',
      'ST_CLUSTERDBSCAN',
      'ST_CONTAINS',
      'ST_CONVEXHULL',
      'ST_COVEREDBY',
      'ST_COVERS',
      'ST_DIFFERENCE',
      'ST_DIMENSION',
      'ST_DISJOINT',
      'ST_DISTANCE',
      'ST_DUMP',
      'ST_DWITHIN',
      'ST_ENDPOINT',
      'ST_EQUALS',
      'ST_EXTENT',
      'ST_EXTERIORRING',
      'ST_GEOGFROM',
      'ST_GEOGROMGEOJSON',
      'ST_GEOGFROMTEXT',
      'ST_GEOGFROMWKB',
      'ST_GEOPOINT',
      'ST_GEOPOINTFROMGEOHASH',
      'ST_GEOHASH',
      'ST_GEOMETRYTYPE',
      'ST_INTERIORRINGS',
      'ST_INTERSECTION',
      'ST_INTERSECTS',
      'ST_INTERSECTSBOX',
      'ST_ISCOLLECTION',
      'ST_ISEMPTY',
      'ST_LENGTH',
      'ST_MAKELINE',
      'ST_MAKEPOLYGON',
      'ST_MAKEPOLYGONORIENTED',
      'ST_MAXDISTANCE',
      'ST_NPOINTS',
      'ST_NUMGEOMETRIES',
      'ST_NUMPOINTS',
      'ST_PERIMETER',
      'ST_POINTN',
      'ST_SIMPLIFY',
      'ST_SNAPTOGRID',
      'ST_STARTPOINT',
      'ST_TOUCHES',
      'ST_UNION',
      'ST_UNION_AGG',
      'ST_WITHIN',
      'ST_X',
      'ST_Y',
      // security functions
      'SESSION_USER',
      // uuid functions
      'GENERATE_UUID',
      // net functions
      'NET.IP_FROM_STRING',
      'NET.SAFE_IP_FROM_STRING',
      'NET.IP_TO_STRING',
      'NET.IP_NET_MASK',
      'NET.IP_TRUNC',
      'NET.IPV4_FROM_INT64',
      'NET.IPV4_TO_INT64',
      'NET.HOST',
      'NET.PUBLIC_SUFFIX',
      'NET.REG_DOMAIN',
      // debugging functions
      'ERROR',
      // aead encryption functions
      'KEYS.NEW_KEYSET',
      'KEYS.ADD_KEY_FROM_RAW_BYTES',
      'AEAD.DECRYPT_BYTES',
      'AEAD.DECRYPT_STRING',
      'AEAD.ENCRYPT',
      'KEYS.KEYSET_CHAIN',
      'KEYS.KEYSET_FROM_JSON',
      'KEYS.KEYSET_TO_JSON',
      'KEYS.ROTATE_KEYSET',
      'KEYS.KEYSET_LENGTH'
    ],

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
  supportedFunction: {
    AEAD: [
      {
        name: 'AEAD.DECRYPT_BYTES',
        title: 'AEAD.DECRYPT_BYTES(keyset, ciphertext, additional_data)',
        description:
          "Uses the matching key from keyset to decrypt ciphertext and verifies the integrity of the data using additional_data. Returns an error if decryption or verification fails.\n\nkeyset is a serialized BYTES value returned by one of the KEYS functions or a STRUCT returned by KEYS.KEYSET_CHAIN. keyset must contain the key that was used to encrypt ciphertext, and the key must be in an 'ENABLED' state, or else the function returns an error. AEAD.DECRYPT_BYTES identifies the matching key in keyset by finding the key with the key ID that matches the one encrypted in ciphertext.\n\nciphertext is a BYTES value that is the result of a call to AEAD.ENCRYPT where the input plaintext was of type BYTES.\n\nIf ciphertext includes an initialization vector (IV), it should be the first bytes of ciphertext. If ciphertext includes an authentication tag, it should be the last bytes of ciphertext. If the IV and authentic tag are one (SIV), it should be the first bytes of ciphertext. The IV and authentication tag commonly require 16 bytes, but may vary in size.\n\nadditional_data is a STRING or BYTES value that binds the ciphertext to its context. This forces the ciphertext to be decrypted in the same context in which it was encrypted. This function casts any STRING value to BYTES. This must be the same as the additional_data provided to AEAD.ENCRYPT to encrypt ciphertext, ignoring its type, or else the function returns an error.",
        example:
          'SELECT\n  ecd.customer_id,\n  AEAD.DECRYPT_BYTES(\n    (SELECT ck.keyset\n     FROM aead.CustomerKeysets AS ck\n     WHERE ecd.customer_id = ck.customer_id),\n    ecd.encrypted_animal,\n    CAST(CAST(customer_id AS STRING) AS BYTES)\n  ) AS favorite_animal\nFROM aead.EncryptedCustomerData AS ecd;'
      },
      {
        name: 'AEAD.DECRYPT_STRING',
        title: 'AEAD.ENCRYPT(keyset, plaintext, additional_data)',
        description: 'Like AEAD.DECRYPT_BYTES, but where ciphertext is of type STRING.'
      },
      {
        name: 'AEAD.ENCRYPT',
        title: 'AEAD.ENCRYPT(keyset, plaintext, additional_data)',
        description:
          'Encrypts plaintext using the primary cryptographic key in keyset. The algorithm of the primary key must be AEAD_AES_GCM_256. Binds the ciphertext to the context defined by additional_data. Returns NULL if any input is NULL.\n\nkeyset is a serialized BYTES value returned by one of the KEYS functions or a STRUCT returned by KEYS.KEYSET_CHAIN.\n\nplaintext is the STRING or BYTES value to be encrypted.\n\nadditional_data is a STRING or BYTES value that binds the ciphertext to its context. This forces the ciphertext to be decrypted in the same context in which it was encrypted. plaintext and additional_data must be of the same type. AEAD.ENCRYPT(keyset, string1, string2) is equivalent to AEAD.ENCRYPT(keyset, CAST(string1 AS BYTES), CAST(string2 AS BYTES)).\n\nThe output is ciphertext BYTES. The ciphertext contains a Tink-specific prefix indicating the key used to perform the encryption.',
        example:
          "WITH CustomerKeysets AS (\n  SELECT 1 AS customer_id, KEYS.NEW_KEYSET('AEAD_AES_GCM_256') AS keyset UNION ALL\n  SELECT 2, KEYS.NEW_KEYSET('AEAD_AES_GCM_256') UNION ALL\n  SELECT 3, KEYS.NEW_KEYSET('AEAD_AES_GCM_256')\n), PlaintextCustomerData AS (\n  SELECT 1 AS customer_id, 'elephant' AS favorite_animal UNION ALL\n  SELECT 2, 'walrus' UNION ALL\n  SELECT 3, 'leopard'\n)\nSELECT\n  pcd.customer_id,\n  AEAD.ENCRYPT(\n    (SELECT keyset\n     FROM CustomerKeysets AS ck\n     WHERE ck.customer_id = pcd.customer_id),\n    pcd.favorite_animal,\n    CAST(pcd.customer_id AS STRING)\n  ) AS encrypted_animal\nFROM PlaintextCustomerData AS pcd;"
      },
      {
        name: 'DETERMINISTIC_DECRYPT_BYTES',
        title: 'DETERMINISTIC_DECRYPT_BYTES(keyset, ciphertext, additional_data)',
        description:
          "Uses the matching key from keyset to decrypt ciphertext and verifies the integrity of the data using additional_data. Returns an error if decryption fails.\n\nkeyset is a serialized BYTES value or a STRUCT value returned by one of the KEYS functions. keyset must contain the key that was used to encrypt ciphertext, the key must be in an 'ENABLED' state, and the key must be of type DETERMINISTIC_AEAD_AES_SIV_CMAC_256, or else the function returns an error. DETERMINISTIC_DECRYPT_BYTES identifies the matching key in keyset by finding the key with the key ID that matches the one encrypted in ciphertext.\n\nciphertext is a BYTES value that is the result of a call to DETERMINISTIC_ENCRYPT where the input plaintext was of type BYTES.\n\nThe ciphertext must follow Tink's wire format. The first byte of ciphertext should contain a Tink key version followed by a 4 byte key hint. If ciphertext includes an initialization vector (IV), it should be the next bytes of ciphertext. If ciphertext includes an authentication tag, it should be the last bytes of ciphertext. If the IV and authentic tag are one (SIV), it should be the first bytes of ciphertext. The IV and authentication tag commonly require 16 bytes, but may vary in size.\n\nadditional_data is a STRING or BYTES value that binds the ciphertext to its context. This forces the ciphertext to be decrypted in the same context in which it was encrypted. This function casts any STRING value to BYTES. This must be the same as the additional_data provided to DETERMINISTIC_ENCRYPT to encrypt ciphertext, ignoring its type, or else the function returns an error.",
        example:
          'SELECT\n  ecd.customer_id,\n  DETERMINISTIC_DECRYPT_BYTES(\n    (SELECT ck.keyset\n     FROM deterministic.CustomerKeysets AS ck\n     WHERE ecd.customer_id = ck.customer_id),\n    ecd.encrypted_animal,\n    CAST(CAST(ecd.customer_id AS STRING) AS BYTES)\n  ) AS favorite_animal\nFROM deterministic.EncryptedCustomerData AS ecd;'
      },
      {
        name: 'DETERMINISTIC_DECRYPT_STRING',
        title: 'DETERMINISTIC_DECRYPT_STRING(keyset, ciphertext, additional_data)',
        description: 'Like DETERMINISTIC_DECRYPT_BYTES, but where plaintext is of type STRING.'
      },
      {
        name: 'DETERMINISTIC_ENCRYPT',
        title: 'DETERMINISTIC_ENCRYPT(keyset, plaintext, additional_data)',
        description:
          'Encrypts plaintext using the primary cryptographic key in keyset using deterministic AEAD. The algorithm of the primary key must be DETERMINISTIC_AEAD_AES_SIV_CMAC_256. Binds the ciphertext to the context defined by additional_data. Returns NULL if any input is NULL.\n\nkeyset is a serialized BYTES value or a STRUCT value returned by one of the KEYS functions.\n\nplaintext is the STRING or BYTES value to be encrypted.\n\nadditional_data is a STRING or BYTES value that binds the ciphertext to its context. This forces the ciphertext to be decrypted in the same context in which it was encrypted. plaintext and additional_data must be of the same type. DETERMINISTIC_ENCRYPT(keyset, string1, string2) is equivalent to DETERMINISTIC_ENCRYPT(keyset, CAST(string1 AS BYTES), CAST(string2 AS BYTES)).\n\nThe output is ciphertext BYTES. The ciphertext contains a Tink-specific prefix indicating the key used to perform the encryption. Given an identical keyset and plaintext, this function returns the same ciphertext each time it is invoked (including across queries).',
        example:
          "WITH CustomerKeysets AS (\n  SELECT 1 AS customer_id,\n  KEYS.NEW_KEYSET('DETERMINISTIC_AEAD_AES_SIV_CMAC_256') AS keyset UNION ALL\n  SELECT 2, KEYS.NEW_KEYSET('DETERMINISTIC_AEAD_AES_SIV_CMAC_256') UNION ALL\n  SELECT 3, KEYS.NEW_KEYSET('DETERMINISTIC_AEAD_AES_SIV_CMAC_256')\n), PlaintextCustomerData AS (\n  SELECT 1 AS customer_id, 'elephant' AS favorite_animal UNION ALL\n  SELECT 2, 'walrus' UNION ALL\n  SELECT 3, 'leopard'\n)\nSELECT\n  pcd.customer_id,\n  DETERMINISTIC_ENCRYPT(\n    (SELECT keyset\n     FROM CustomerKeysets AS ck\n     WHERE ck.customer_id = pcd.customer_id),\n    pcd.favorite_animal,\n    CAST(pcd.customer_id AS STRING)\n  ) AS encrypted_animal\nFROM PlaintextCustomerData AS pcd;"
      },
      {
        name: 'KEYS.ADD_KEY_FROM_RAW_BYTES',
        title: 'KEYS.ADD_KEY_FROM_RAW_BYTES(keyset, key_type, raw_key_bytes)',
        description:
          "Returns a serialized keyset as BYTES with the addition of a key to keyset based on key_type and raw_key_bytes.\n\nThe primary cryptographic key remains the same as in keyset. The expected length of raw_key_bytes depends on the value of key_type. The following are supported key_types:\n\n'AES_CBC_PKCS': Creates a key for AES decryption using cipher block chaining and PKCS padding. raw_key_bytes is expected to be a raw key BYTES value of length 16, 24, or 32; these lengths have sizes of 128, 192, and 256 bits, respectively. GoogleSQL AEAD functions do not support keys of these types for encryption; instead, prefer 'AEAD_AES_GCM_256' or 'AES_GCM' keys.\n'AES_GCM': Creates a key for AES decryption or encryption using Galois/Counter Mode. raw_key_bytes must be a raw key BYTES value of length 16 or 32; these lengths have sizes of 128 and 256 bits, respectively. When keys of this type are inputs to AEAD.ENCRYPT, the output ciphertext does not have a Tink-specific prefix indicating which key was used as input.\nThe output keysets each contain two things: the primary cryptographic key created using KEYS.NEW_KEYSET('AEAD_AES_GCM_256'), and the raw key added using KEYS.ADD_KEY_FROM_RAW_BYTES. If a keyset in the output is used with AEAD.ENCRYPT, GoogleSQL uses the primary cryptographic key created using KEYS.NEW_KEYSET('AEAD_AES_GCM_256') to encrypt the input plaintext. If the keyset is used with AEAD.DECRYPT_STRING or AEAD.DECRYPT_BYTES, GoogleSQL returns the resulting plaintext if either key succeeds in decrypting the ciphertext.",
        example:
          "WITH CustomerRawKeys AS (\n  SELECT 1 AS customer_id, b'0123456789012345' AS raw_key_bytes UNION ALL\n  SELECT 2, b'9876543210543210' UNION ALL\n  SELECT 3, b'0123012301230123'\n), CustomerIds AS (\n  SELECT 1 AS customer_id UNION ALL\n  SELECT 2 UNION ALL\n  SELECT 3\n)\nSELECT\n  ci.customer_id,\n  KEYS.ADD_KEY_FROM_RAW_BYTES(\n    KEYS.NEW_KEYSET('AEAD_AES_GCM_256'),\n    'AES_CBC_PKCS',\n    (SELECT raw_key_bytes FROM CustomerRawKeys AS crk\n     WHERE crk.customer_id = ci.customer_id)\n  ) AS keyset\nFROM CustomerIds AS ci;"
      },
      {
        name: 'KEYS.KEYSET_CHAIN',
        title: 'KEYS.KEYSET_CHAIN(kms_resource_name, first_level_keyset)',
        description:
          'Can be used in place of the keyset argument to the AEAD and deterministic encryption functions to pass a Tink keyset that is encrypted with a Cloud KMS key. This function lets you use other AEAD functions without including plaintext keys in a query.',
        example:
          "DECLARE kms_resource_name STRING;\nDECLARE first_level_keyset BYTES;\nSET kms_resource_name = 'gcp-kms://projects/my-project/locations/us/keyRings/my-key-ring/cryptoKeys/my-crypto-key';\nSET first_level_keyset = b'\\012\\044\\000\\107\\275\\360\\176\\264\\206\\332\\235\\215\\304...';\n\nCREATE TABLE aead.EncryptedCustomerData AS\nSELECT\n  customer_id,\n  AEAD.ENCRYPT(\n    KEYS.KEYSET_CHAIN(kms_resource_name, first_level_keyset),\n    favorite_animal,\n    CAST(CAST(customer_id AS STRING) AS BYTES)\n  ) AS encrypted_animal\nFROM\n  aead.RawCustomerData;"
      },
      {
        name: 'KEYS.KEYSET_FROM_JSON',
        title: 'KEYS.KEYSET_FROM_JSON(json_keyset)',
        description:
          'Returns the input json_keyset STRING as serialized BYTES, which is a valid input for other KEYS and AEAD functions. The JSON STRING must be compatible with the definition of the google.crypto.tink.Keyset protocol buffer message: the JSON keyset should be a JSON object containing objects and name-value pairs corresponding to those in the "keyset" message in the google.crypto.tink.Keyset definition. You can convert the output serialized BYTES representation back to a JSON STRING using KEYS.KEYSET_TO_JSON.'
      },
      {
        name: 'KEYS.KEYSET_LENGTH',
        title: 'KEYS.KEYSET_LENGTH(keyset)',
        description: 'Returns the number of keys in the provided keyset.'
      },
      {
        name: 'KEYS.KEYSET_TO_JSON',
        title: 'KEYS.KEYSET_TO_JSON(keyset)',
        description:
          'Returns a JSON STRING representation of the input keyset. The returned JSON STRING is compatible with the definition of the google.crypto.tink.Keyset protocol buffer message. You can convert the JSON STRING representation back to BYTES using KEYS.KEYSET_FROM_JSON.',
        example: "SELECT KEYS.KEYSET_TO_JSON(KEYS.NEW_KEYSET('AEAD_AES_GCM_256'));"
      },
      {
        name: 'KEYS.NEW_KEYSET',
        title: 'KEYS.NEW_KEYSET(key_type)',
        description:
          'Returns a serialized keyset containing a new key based on key_type. The returned keyset is a serialized BYTES representation of google.crypto.tink.Keyset that contains a primary cryptographic key and no additional keys. You can use the keyset with the AEAD.ENCRYPT, AEAD.DECRYPT_BYTES, and AEAD.DECRYPT_STRING functions for encryption and decryption, as well as with the KEYS group of key- and keyset-related functions.\n\nkey_type is a STRING literal representation of the type of key to create. key_type cannot be NULL. key_type can be:\n\nAEAD_AES_GCM_256: Creates a 256-bit key with the pseudo-random number generator provided by boringSSL. The key uses AES-GCM for encryption and decryption operations.\nDETERMINISTIC_AEAD_AES_SIV_CMAC_256: Creates a 512-bit AES-SIV-CMAC key, which contains a 256-bit AES-CTR key and 256-bit AES-CMAC key. The AES-SIV-CMAC key is created with the pseudo-random number generator provided by boringSSL. The key uses AES-SIV for encryption and decryption operations.',
        example:
          "SELECT customer_id, KEYS.NEW_KEYSET('AEAD_AES_GCM_256') AS keyset\nFROM (\n  SELECT 1 AS customer_id UNION ALL\n  SELECT 2 UNION ALL\n  SELECT 3\n) AS CustomerIds;"
      },
      {
        name: 'KEYS.NEW_WRAPPED_KEYSET',
        title: 'KEYS.NEW_WRAPPED_KEYSET(kms_resource_name, key_type)',
        description:
          'Creates a new keyset and encrypts it with a Cloud KMS key. Returns the wrapped keyset as a BYTES representation of google.crypto.tink.Keyset that contains a primary cryptographic key and no additional keys.'
      },
      {
        name: 'KEYS.REWRAP_KEYSET',
        title: 'KEYS.REWRAP_KEYSET(source_kms_resource_name, target_kms_resource_name, wrapped_keyset)',
        description:
          'Re-encrypts a wrapped keyset with a new Cloud KMS key. Returns the wrapped keyset as a BYTES representation of google.crypto.tink.Keyset that contains a primary cryptographic key and no additional keys.\n\nWhen this function is used, a wrapped keyset is decrypted by source_kms_resource_name and then re-encrypted by target_kms_resource_name. During this process, the decrypted keyset is never visible to customers.'
      },
      {
        name: 'KEYS.ROTATE_KEYSET',
        title: 'KEYS.ROTATE_KEYSET(keyset, key_type)',
        description:
          'Adds a new key to keyset based on key_type. This new key becomes the primary cryptographic key of the new keyset. Returns the new keyset serialized as BYTES.\n\nThe old primary cryptographic key from the input keyset remains an additional key in the returned keyset.\n\nThe new key_type must match the key type of existing keys in the keyset.'
      },
      {
        name: 'KEYS.ROTATE_WRAPPED_KEYSET',
        title: 'KEYS.ROTATE_WRAPPED_KEYSET(kms_resource_name, wrapped_keyset, key_type)',
        description:
          'Takes an existing wrapped keyset and returns a rotated and rewrapped keyset. The returned wrapped keyset is a BYTES representation of google.crypto.tink.Keyset.\n\nWhen this function is used, the wrapped keyset is decrypted, the new key is added, and then the keyset is re-encrypted. The primary cryptographic key from the input wrapped_keyset remains as an additional key in the returned keyset. During this rotation process, the decrypted keyset is never visible to customers.\n\n'
      }
    ],
    Aggregate: [
      {
        name: 'ANY_VALUE',
        title:
          'ANY_VALUE(\n  expression\n  [ HAVING { MAX | MIN } expression2 ]\n)\n[ OVER over_clause ]\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  [ ORDER BY expression [ { ASC | DESC }  ] [, ...] ]\n  [ window_frame_clause ]\n',
        description:
          "Returns expression for some row chosen from the group. Which row is chosen is nondeterministic, not random. Returns NULL when the input produces no rows. Returns NULL when expression is NULL for all rows in the group.\n\nANY_VALUE behaves as if RESPECT NULLS is specified; rows for which expression is NULL are considered and may be selected.\n\nIf the HAVING clause is included in the ANY_VALUE function, the OVER clause can't be used with this function.",
        example:
          'SELECT ANY_VALUE(fruit) as any_value\nFROM UNNEST(["apple", "banana", "pear"]) as fruit;\n\n/*-----------*\n | any_value |\n +-----------+\n | apple     |\n *-----------*/'
      },
      {
        name: 'ARRAY_AGG',
        title:
          'ARRAY_AGG(\n  [ DISTINCT ]\n  expression\n  [ { IGNORE | RESPECT } NULLS ]\n  [ ORDER BY key [ { ASC | DESC } ] [, ... ] ]\n  [ LIMIT n ]\n)\n[ OVER over_clause ]\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  [ ORDER BY expression [ { ASC | DESC }  ] [, ...] ]\n  [ window_frame_clause ]\n',
        description:
          "Returns an ARRAY of expression values. \nIf this function is used with the OVER clause, it's part of a window function call. In a window function call, aggregate function clauses can't be used. \nAn error is raised if an array in the final query result contains a NULL element.",
        example:
          'SELECT ARRAY_AGG(x) AS array_agg FROM UNNEST([2, 1,-2, 3, -2, 1, 2]) AS x;\n\n/*-------------------------*\n | array_agg               |\n +-------------------------+\n | [2, 1, -2, 3, -2, 1, 2] |\n *-------------------------*/'
      },
      {
        name: 'ARRAY_CONCAT_AGG',
        title: 'ARRAY_CONCAT_AGG(\n  expression\n  [ ORDER BY key [ { ASC | DESC } ] [, ... ] ]\n  [ LIMIT n ]\n)',
        description:
          'Concatenates elements from expression of type ARRAY, returning a single array as a result.\n\nThis function ignores NULL input arrays, but respects the NULL elements in non-NULL input arrays. An error is raised, however, if an array in the final query result contains a NULL element. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.',
        example:
          'SELECT FORMAT("%T", ARRAY_CONCAT_AGG(x)) AS array_concat_agg FROM (\n  SELECT [NULL, 1, 2, 3, 4] AS x\n  UNION ALL SELECT NULL\n  UNION ALL SELECT [5, 6]\n  UNION ALL SELECT [7, 8, 9]\n);\n\n/*-----------------------------------*\n | array_concat_agg                  |\n +-----------------------------------+\n | [NULL, 1, 2, 3, 4, 5, 6, 7, 8, 9] |\n *-----------------------------------*/'
      },
      {
        name: 'AVG',
        title:
          'AVG(\n  [ DISTINCT ]\n  expression\n)\n[ OVER over_clause ]\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  [ ORDER BY expression [ { ASC | DESC }  ] [, ...] ]\n  [ window_frame_clause ]\n',
        description:
          "Returns the average of non-NULL values in an aggregated group.\nIf this function is used with the OVER clause, it's part of a window function call. In a window function call, aggregate function clauses can't be used.",
        example: 'SELECT AVG(x) as avg\nFROM UNNEST([0, 2, 4, 4, 5]) as x;\n\n/*-----*\n | avg |\n +-----+\n | 3   |\n *-----*/'
      },
      {
        name: 'BIT_AND',
        title: 'BIT_AND(\n  expression\n)',
        description: 'Performs a bitwise AND operation on expression and returns the result.',
        example: 'SELECT BIT_AND(x) as bit_and FROM UNNEST([0xF001, 0x00A1]) as x;\n\n/*---------*\n | bit_and |\n +---------+\n | 1       |\n *---------*/'
      },
      {
        name: 'BIT_OR',
        title: 'BIT_OR(\n  expression\n)',
        description: 'Performs a bitwise OR operation on expression and returns the result.',
        example: 'SELECT BIT_OR(x) as bit_or FROM UNNEST([0xF001, 0x00A1]) as x;\n\n/*--------*\n | bit_or |\n +--------+\n | 61601  |\n *--------*/'
      },
      {
        name: 'BIT_XOR',
        title: 'BIT_XOR(\n  [ DISTINCT ]\n  expression\n)',
        description: 'Performs a bitwise XOR operation on expression and returns the result.',
        example: 'SELECT BIT_XOR(x) AS bit_xor FROM UNNEST([5678, 1234]) AS x;\n\n/*---------*\n | bit_xor |\n +---------+\n | 4860    |\n *---------*/'
      },
      {
        name: 'COUNT',
        title: 'COUNT(*)\n[OVER over_clause]',
        description: 'Returns the number of rows in the input. Returns the number of rows with expression evaluated to any value other than NULL.',
        example:
          'SELECT\n  COUNT(*) AS count_star,\n  COUNT(DISTINCT x) AS count_dist_x\nFROM UNNEST([1, 4, 4, 5]) AS x;\n\n/*------------+--------------*\n | count_star | count_dist_x |\n +------------+--------------+\n | 4          | 3            |\n *------------+--------------*/'
      },
      {
        name: 'COUNTIF',
        title:
          'COUNTIF(\n  expression\n)\n[ OVER over_clause ]\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  [ ORDER BY expression [ { ASC | DESC }  ] [, ...] ]\n  [ window_frame_clause ]\n',
        description:
          'Returns the count of TRUE values for expression. Returns 0 if there are zero input rows, or if expression evaluates to FALSE or NULL for all rows.\n\nSince expression must be a BOOL, the form COUNTIF(DISTINCT ...) is not supported. This would not be useful: there is only one distinct value of TRUE. Usually when someone wants to combine COUNTIF and DISTINCT, they want to count the number of distinct values of an expression for which a certain condition is satisfied',
        example:
          'SELECT COUNTIF(x<0) AS num_negative, COUNTIF(x>0) AS num_positive\nFROM UNNEST([5, -2, 3, 6, -10, -7, 4, 0]) AS x;\n\n/*--------------+--------------*\n | num_negative | num_positive |\n +--------------+--------------+\n | 3            | 4            |\n *--------------+--------------*/'
      },
      {
        name: 'LOGICAL_AND',
        title: 'LOGICAL_AND(\n  expression\n)',
        description:
          'Returns the logical AND of all non-NULL expressions. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.',
        example:
          'SELECT LOGICAL_AND(x < 3) AS logical_and FROM UNNEST([1, 2, 4]) AS x;\n\n/*-------------*\n | logical_and |\n +-------------+\n | FALSE       |\n *-------------*/'
      },
      {
        name: 'LOGICAL_OR',
        title: 'LOGICAL_OR(\n  expression\n)',
        description:
          'Returns the logical OR of all non-NULL expressions. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.',
        example:
          'SELECT LOGICAL_OR(x < 3) AS logical_or FROM UNNEST([1, 2, 4]) AS x;\n\n/*------------*\n | logical_or |\n +------------+\n | TRUE       |\n *------------*/'
      },
      {
        name: 'MAX',
        title: 'MAX(\n expression\n)',
        description: 'Returns the maximum non-NULL value in an aggregated group.',
        example: 'SELECT MAX(x) AS max\nFROM UNNEST([8, 37, 55, 4]) AS x;\n\n/*-----*\n | max |\n +-----+\n | 55  |\n *-----*/'
      },
      {
        name: 'MIN',
        title: 'MIN(\n expression\n)',
        description: 'Returns the minimum non-NULL value in an aggregated group.',
        example: 'SELECT MIN(x) AS max\nFROM UNNEST([8, 37, 55, 4]) AS x;\n\n/*-----*\n | max |\n +-----+\n | 55  |\n *-----*/'
      },
      {
        name: 'STRING_AGG',
        title: 'STRING_AGG(\n  [ DISTINCT ]\n  expression [, delimiter]\n  [ ORDER BY key [ { ASC | DESC } ] [, ... ] ]\n  [ LIMIT n ]\n)',
        description:
          'Returns a value (either STRING or BYTES) obtained by concatenating non-NULL values. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.\n\nIf a delimiter is specified, concatenated values are separated by that delimiter; otherwise, a comma is used as a delimiter.',
        example:
          'SELECT STRING_AGG(fruit) AS string_agg\nFROM UNNEST(["apple", NULL, "pear", "banana", "pear"]) AS fruit;\n\n/*------------------------*\n | string_agg             |\n +------------------------+\n | apple,pear,banana,pear |\n *------------------------*/'
      },
      {
        name: 'SUM',
        title: 'SUM(\n  [ DISTINCT ]\n  expression\n)',
        description: 'Returns the sum of non-NULL values in an aggregated group.',
        example: 'SELECT SUM(x) AS sum\nFROM UNNEST([1, 2, 3, 4, 5, 4, 3, 2, 1]) AS x;\n\n/*-----*\n | sum |\n +-----+\n | 25  |\n *-----*/'
      }
    ],
    Approximate: [
      {
        name: 'APPROX_COUNT_DISTINCT',
        title: 'APPROX_COUNT_DISTINCT(expression)',
        description:
          'Returns the approximate result for COUNT(DISTINCT expression). The value returned is a statistical estimate, not necessarily the actual value.\n\nThis function is less accurate than COUNT(DISTINCT expression), but performs better on huge input.',
        example:
          'SELECT APPROX_COUNT_DISTINCT(x) as approx_distinct\nFROM UNNEST([0, 1, 1, 2, 3, 5]) as x;\n\n/*-----------------*\n | approx_distinct |\n +-----------------+\n | 5               |\n *-----------------*/'
      },
      {
        name: 'APPROX_QUANTILES',
        title: 'APPROX_COUNT_DISTINCT(expression)',
        description:
          'Returns the approximate result for COUNT(DISTINCT expression). The value returned is a statistical estimate, not necessarily the actual value.\n\nThis function is less accurate than COUNT(DISTINCT expression), but performs better on huge input.',
        example:
          'SELECT APPROX_COUNT_DISTINCT(x) as approx_distinct\nFROM UNNEST([0, 1, 1, 2, 3, 5]) as x;\n\n/*-----------------*\n | approx_distinct |\n +-----------------+\n | 5               |\n *-----------------*/'
      },
      {
        name: 'APPROX_TOP_COUNT',
        title: 'APPROX_TOP_COUNT(expression, number)',
        description:
          'Returns the approximate top elements of expression as an array of STRUCTs. The number parameter specifies the number of elements returned.\n\nEach STRUCT contains two fields. The first field (named value) contains an input value. The second field (named count) contains an INT64 specifying the number of times the value was returned.\n\nReturns NULL if there are zero input rows.',
        example:
          'SELECT APPROX_TOP_COUNT(x, 2) as approx_top_count\nFROM UNNEST(["apple", "apple", "pear", "pear", "pear", "banana"]) as x;\n\n/*-------------------------*\n | approx_top_count        |\n +-------------------------+\n | [{pear, 3}, {apple, 2}] |\n *-------------------------*/'
      },
      {
        name: 'APPROX_TOP_SUM',
        title: 'APPROX_TOP_SUM(expression, weight, number)',
        description:
          'Returns the approximate top elements of expression, based on the sum of an assigned weight. The number parameter specifies the number of elements returned.\n\nIf the weight input is negative or NaN, this function returns an error.\n\nThe elements are returned as an array of STRUCTs. Each STRUCT contains two fields: value and sum. The value field contains the value of the input expression. The sum field is the same type as weight, and is the approximate sum of the input weight associated with the value field.\n\nReturns NULL if there are zero input rows.',
        example:
          'SELECT APPROX_TOP_SUM(x, weight, 2) AS approx_top_sum FROM\nUNNEST([\n  STRUCT("apple" AS x, 3 AS weight),\n  ("pear", 2),\n  ("apple", 0),\n  ("banana", 5),\n  ("pear", 4)\n]);\n\n/*--------------------------*\n | approx_top_sum           |\n +--------------------------+\n | [{pear, 6}, {banana, 5}] |\n *--------------------------*/'
      }
    ],
    Array: [
      {
        name: 'ARRAY',
        title: 'ARRAY(subquery)',
        description:
          'If subquery produces a SQL table, the table must have exactly one column. Each element in the output ARRAY is the value of the single column of a row in the table.\n\nIf subquery produces a value table, then each element in the output ARRAY is the entire corresponding row of the value table.',
        example:
          'SELECT ARRAY\n  (SELECT 1 UNION ALL\n   SELECT 2 UNION ALL\n   SELECT 3) AS new_array;\n\n/*-----------*\n | new_array |\n +-----------+\n | [1, 2, 3] |\n *-----------*/'
      },
      {
        name: 'ARRAY_CONCAT',
        title: 'ARRAY_CONCAT(array_expression[, ...])',
        description:
          'Concatenates one or more arrays with the same element type into a single array.\n\nThe function returns NULL if any input argument is NULL.',
        example:
          'SELECT ARRAY_CONCAT([1, 2], [3, 4], [5, 6]) as count_to_six;\n\n/*--------------------------------------------------*\n | count_to_six                                     |\n +--------------------------------------------------+\n | [1, 2, 3, 4, 5, 6]                               |\n *--------------------------------------------------*/'
      },
      {
        name: 'ARRAY_LENGTH',
        title: 'ARRAY_LENGTH(array_expression)',
        description: 'Returns the size of the array. Returns 0 for an empty array. Returns NULL if the array_expression is NULL.',
        example:
          'WITH items AS\n  (SELECT ["coffee", NULL, "milk" ] as list\n  UNION ALL\n  SELECT ["cake", "pie"] as list)\nSELECT ARRAY_TO_STRING(list, \', \', \'NULL\'), ARRAY_LENGTH(list) AS size\nFROM items\nORDER BY size DESC;\n\n/*--------------------+------*\n | list               | size |\n +--------------------+------+\n | coffee, NULL, milk | 3    |\n | cake, pie          | 2    |\n *--------------------+------*/'
      },
      {
        name: 'ARRAY_REVERSE',
        title: 'ARRAY_REVERSE(value)',
        description: 'Returns the input ARRAY with elements in reverse order.',
        example:
          'WITH example AS (\n  SELECT [1, 2, 3] AS arr UNION ALL\n  SELECT [4, 5] AS arr UNION ALL\n  SELECT [] AS arr\n)\nSELECT\n  arr,\n  ARRAY_REVERSE(arr) AS reverse_arr\nFROM example;\n\n/*-----------+-------------*\n | arr       | reverse_arr |\n +-----------+-------------+\n | [1, 2, 3] | [3, 2, 1]   |\n | [4, 5]    | [5, 4]      |\n | []        | []          |\n *-----------+-------------*/'
      },
      {
        name: 'ARRAY_TO_STRING',
        title: 'ARRAY_TO_STRING(array_expression, delimiter[, null_text])',
        description:
          'Returns a concatenation of the elements in array_expression as a STRING. The value for array_expression can either be an array of STRING or BYTES data types.\n\nIf the null_text parameter is used, the function replaces any NULL values in the array with the value of null_text.\n\nIf the null_text parameter is not used, the function omits the NULL value and its preceding delimiter.\n\n',
        example:
          "WITH items AS\n  (SELECT ['coffee', 'tea', 'milk' ] as list\n  UNION ALL\n  SELECT ['cake', 'pie', NULL] as list)\n\nSELECT ARRAY_TO_STRING(list, '--') AS text\nFROM items;\n\n/*--------------------------------*\n | text                           |\n +--------------------------------+\n | coffee--tea--milk              |\n | cake--pie                      |\n *--------------------------------*/"
      },
      {
        name: 'GENERATE_ARRAY',
        title: 'GENERATE_ARRAY(start_expression, end_expression[, step_expression])',
        description: 'Returns an array of values. The start_expression and end_expression parameters determine the inclusive start and end of the array.',
        example:
          'SELECT GENERATE_ARRAY(1, 5) AS example_array;\n\n/*-----------------*\n | example_array   |\n +-----------------+\n | [1, 2, 3, 4, 5] |\n *-----------------*/'
      },
      {
        name: 'GENERATE_DATE_ARRAY',
        title: 'GENERATE_DATE_ARRAY(start_date, end_date[, INTERVAL INT64_expr date_part])',
        description: 'Returns an array of dates. The start_date and end_date parameters determine the inclusive start and end of the array.',
        example:
          "SELECT GENERATE_DATE_ARRAY('2016-10-05', '2016-10-08') AS example;\n\n/*--------------------------------------------------*\n | example                                          |\n +--------------------------------------------------+\n | [2016-10-05, 2016-10-06, 2016-10-07, 2016-10-08] |\n *--------------------------------------------------*/"
      },
      {
        name: 'GENERATE_TIMESTAMP_ARRAY',
        title: 'GENERATE_TIMESTAMP_ARRAY(start_timestamp, end_timestamp, INTERVAL step_expression date_part)',
        description:
          'Returns an ARRAY of TIMESTAMPS separated by a given interval. The start_timestamp and end_timestamp parameters determine the inclusive lower and upper bounds of the ARRAY.',
        example:
          "SELECT GENERATE_TIMESTAMP_ARRAY('2016-10-05 00:00:00', '2016-10-07 00:00:00',\n                                INTERVAL 1 DAY) AS timestamp_array;\n\n/*--------------------------------------------------------------------------*\n | timestamp_array                                                          |\n +--------------------------------------------------------------------------+\n | [2016-10-05 00:00:00+00, 2016-10-06 00:00:00+00, 2016-10-07 00:00:00+00] |\n *--------------------------------------------------------------------------*/"
      }
    ],
    Bit: [
      {
        name: 'BIT_COUNT',
        title: 'BIT_COUNT(expression)',
        description:
          "The input, expression, must be an integer or BYTES.\n\nReturns the number of bits that are set in the input expression. For signed integers, this is the number of bits in two's complement form.",
        example:
          "SELECT a, BIT_COUNT(a) AS a_bits, FORMAT(\"%T\", b) as b, BIT_COUNT(b) AS b_bits\nFROM UNNEST([\n  STRUCT(0 AS a, b'' AS b), (0, b'\\x00'), (5, b'\\x05'), (8, b'\\x00\\x08'),\n  (0xFFFF, b'\\xFF\\xFF'), (-2, b'\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFE'),\n  (-1, b'\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF'),\n  (NULL, b'\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF\\xFF')\n]) AS x;"
      }
    ],
    BuiltInTable: [
      {
        name: 'EXTERNAL_OBJECT_TRANSFORM',
        title: 'EXTERNAL_OBJECT_TRANSFORM(TABLE object_table_name, transform_types_array)',
        description:
          'This function returns a transformed object table with the original columns plus one or more additional columns, depending on the transform_types values specified.\n\nThis function only supports object tables as inputs. Subqueries or any other types of tables are not supported.\n\nobject_table_name is the name of the object table to be transformed, in the format dataset_name.object_table_name.\n\ntransform_types_array is an array of STRING literals. Currently, the only supported transform_types_array value is SIGNED_URL. Specifying SIGNED_URL creates read-only signed URLs for the objects in the identified object table, which are returned in a signed_url column. Generated signed URLs are valid for 6 hours.',
        example: "SELECT uri, signed_url\nFROM EXTERNAL_OBJECT_TRANSFORM(TABLE mydataset.myobjecttable, ['SIGNED_URL']);"
      }
    ],
    Conversion: [
      {
        name: 'CAST',
        title: 'CAST(expression AS typename [format_clause])',
        description:
          'Cast syntax is used in a query to indicate that the result type of an expression should be converted to some other type.\n\nWhen using CAST, a query can fail if GoogleSQL is unable to perform the cast. If you want to protect your queries from these types of errors, you can use SAFE_CAST.\n\nCasts between supported types that do not successfully map from the original value to the target domain produce runtime errors. For example, casting BYTES to STRING where the byte sequence is not valid UTF-8 results in a runtime error.\n\nSome casts can include a format clause, which provides instructions for how to conduct the cast. For example, you could instruct a cast to convert a sequence of bytes to a BASE64-encoded string instead of a UTF-8-encoded string.\n\nThe structure of the format clause is unique to each type of cast and more information is available in the section for that cast.',
        example: 'CAST(x=1 AS STRING)'
      },
      {
        name: 'PARSE_BIGNUMERIC',
        title: 'PARSE_BIGNUMERIC(string_expression)',
        description:
          'Converts a STRING to a BIGNUMERIC value.\n\nThe numeric literal contained in the string must not exceed the maximum precision or range of the BIGNUMERIC type, or an error occurs. If the number of digits after the decimal point exceeds 38, then the resulting BIGNUMERIC value rounds half away from zero to have 38 digits after the decimal point.',
        example: 'SELECT PARSE_BIGNUMERIC("123.45") AS parsed'
      },
      {
        name: 'PARSE_NUMERIC',
        title: 'PARSE_NUMERIC(string_expression)',
        description:
          'Converts a STRING to a NUMERIC value.\n\nThe numeric literal contained in the string must not exceed the maximum precision or range of the NUMERIC type, or an error occurs. If the number of digits after the decimal point exceeds nine, then the resulting NUMERIC value rounds half away from zero to have nine digits after the decimal point.',
        example: 'SELECT PARSE_NUMERIC("123.45") AS parsed'
      },
      {
        name: 'SAFE_CAST',
        title: 'SAFE_CAST(expression AS typename [format_clause])',
        description:
          'When using CAST, a query can fail if GoogleSQL is unable to perform the cast.If you want to protect your queries from these types of errors, you can use SAFE_CAST. SAFE_CAST replaces runtime errors with NULLs. However, during static analysis, impossible casts between two non-castable types still produce an error because the query is invalid.',
        example: 'SELECT CAST("apple" AS INT64) AS not_a_number;'
      }
    ],
    Date: [
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE()',
        description:
          'Returns the current date as a DATE object. Parentheses are optional when called with no arguments.\n\nThis function supports the following arguments:\n\ntime_zone_expression: A STRING expression that represents a time zone. If no time zone is specified, the default time zone, UTC, is used. If this expression is used and it evaluates to NULL, this function returns NULL.\nThe current date is recorded at the start of the query statement which contains this function, not when this specific function is evaluated.',
        example: 'SELECT CURRENT_DATE() AS the_date;'
      },
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE(time_zone_expression)',
        description:
          'Returns the current date as a DATE object. Parentheses are optional when called with no arguments.\n\nThis function supports the following arguments:\n\ntime_zone_expression: A STRING expression that represents a time zone. If no time zone is specified, the default time zone, UTC, is used. If this expression is used and it evaluates to NULL, this function returns NULL.\nThe current date is recorded at the start of the query statement which contains this function, not when this specific function is evaluated.',
        example: "SELECT CURRENT_DATE('America/Los_Angeles') AS the_date;"
      },
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE',
        description:
          'Returns the current date as a DATE object. Parentheses are optional when called with no arguments.\n\nThis function supports the following arguments:\n\ntime_zone_expression: A STRING expression that represents a time zone. If no time zone is specified, the default time zone, UTC, is used. If this expression is used and it evaluates to NULL, this function returns NULL.\nThe current date is recorded at the start of the query statement which contains this function, not when this specific function is evaluated.',
        example: 'SELECT CURRENT_DATE AS the_date;'
      },
      {
        name: 'DATE',
        title: 'DATE(year, month, day)',
        description:
          'Constructs or extracts a date.\n\nThis function supports the following arguments:\n\nyear: The INT64 value for year.\nmonth: The INT64 value for month.\nday: The INT64 value for day.',
        example: 'SELECT DATE(2016, 12, 25) AS date_ymd;'
      },
      {
        name: 'DATE',
        title: 'DATE(timestamp_expression)',
        description:
          'Constructs or extracts a date.\n\nThis function supports the following arguments:\n\ntimestamp_expression: A TIMESTAMP expression that contains the date.',
        example: "SELECT DATE(TIMESTAMP '2016-12-25 05:30:00+07') AS date_ymd;"
      },
      {
        name: 'DATE',
        title: 'DATE(timestamp_expression, time_zone_expression)',
        description:
          'Constructs or extracts a date.\n\nThis function supports the following arguments:\n\ntimestamp_expression: A TIMESTAMP expression that contains the date. \ntime_zone_expression: A STRING expression that represents a time zone. If no time zone is specified with timestamp_expression, the default time zone, UTC, is used.',
        example: "SELECT DATE(TIMESTAMP '2016-12-25 05:30:00+07', 'America/Los_Angeles') AS date_ymd;"
      },
      {
        name: 'DATE',
        title: 'DATE(datetime_expression)',
        description:
          'Constructs or extracts a date.\n\nThis function supports the following arguments:\n\ndatetime_expression: A DATETIME expression that contains the date.',
        example: "SELECT DATE(DATETIME '2016-12-25 23:59:59') AS date_ymd;"
      },
      {
        name: 'DATE_ADD',
        title: 'DATE_ADD(date_expression, INTERVAL int64_expression date_part)',
        description:
          "Adds a specified time interval to a DATE.\n\nDATE_ADD supports the following date_part values:\n\nDAY\nWEEK. Equivalent to 7 DAYs.\nMONTH\nQUARTER\nYEAR\nSpecial handling is required for MONTH, QUARTER, and YEAR parts when the date is at (or near) the last day of the month. If the resulting month has fewer days than the original date's day, then the resulting date is the last date of that month.",
        example: "SELECT DATE_ADD(DATE '2008-12-25', INTERVAL 5 DAY) AS five_days_later;"
      },
      {
        name: 'DATE_DIFF',
        title: 'DATE_DIFF(date_expression_a, date_expression_b, date_part)',
        description:
          'Returns the whole number of specified date_part intervals between two DATE objects (date_expression_a - date_expression_b). If the first DATE is earlier than the second one, the output is negative.\n\nDATE_DIFF supports the following date_part values:\n\nDAY\nWEEK This date part begins on Sunday.\nWEEK(<WEEKDAY>): This date part begins on WEEKDAY. Valid values for WEEKDAY are SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, and SATURDAY.\nISOWEEK: Uses ISO 8601 week boundaries. ISO weeks begin on Monday.\nMONTH, except when the first two arguments are TIMESTAMP objects.\nQUARTER\nYEAR\nISOYEAR: Uses the ISO 8601 week-numbering year boundary. The ISO year boundary is the Monday of the first week whose Thursday belongs to the corresponding Gregorian calendar year.',
        example: "SELECT DATE_DIFF(DATE '2010-07-07', DATE '2008-12-25', DAY) AS days_diff;"
      },
      {
        name: 'DATE_FROM_UNIX_DATE',
        title: 'DATE_FROM_UNIX_DATE(int64_expression)',
        description: 'Interprets int64_expression as the number of days since 1970-01-01.',
        example: 'SELECT DATE_FROM_UNIX_DATE(14238) AS date_from_epoch;'
      },
      {
        name: 'DATE_SUB',
        title: 'DATE_SUB(date_expression, INTERVAL int64_expression date_part)',
        description:
          "Subtracts a specified time interval from a DATE.\n\nDATE_SUB supports the following date_part values:\n\nDAY\nWEEK. Equivalent to 7 DAYs.\nMONTH\nQUARTER\nYEAR\nSpecial handling is required for MONTH, QUARTER, and YEAR parts when the date is at (or near) the last day of the month. If the resulting month has fewer days than the original date's day, then the resulting date is the last date of that month.",
        example: "SELECT DATE_SUB(DATE '2008-12-25', INTERVAL 5 DAY) AS five_days_ago;"
      },
      {
        name: 'DATE_TRUNC',
        title: 'DATE_TRUNC(date_expression, date_part)',
        description:
          'Truncates a DATE value to the granularity of date_part. The DATE value is always rounded to the beginning of date_part, which can be one of the following:\n\nDAY: The day in the Gregorian calendar year that contains the DATE value.\nWEEK: The first day of the week in the week that contains the DATE value. Weeks begin on Sundays. WEEK is equivalent to WEEK(SUNDAY).\nWEEK(WEEKDAY): The first day of the week in the week that contains the DATE value. Weeks begin on WEEKDAY. WEEKDAY must be one of the following: SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, or SATURDAY.\nISOWEEK: The first day of the ISO 8601 week in the ISO week that contains the DATE value. The ISO week begins on Monday. The first ISO week of each ISO year contains the first Thursday of the corresponding Gregorian calendar year.\nMONTH: The first day of the month in the month that contains the DATE value.\nQUARTER: The first day of the quarter in the quarter that contains the DATE value.\nYEAR: The first day of the year in the year that contains the DATE value.\nISOYEAR: The first day of the ISO 8601 week-numbering year in the ISO year that contains the DATE value. The ISO year is the Monday of the first week whose Thursday belongs to the corresponding Gregorian calendar year.',
        example: "SELECT DATE_TRUNC(DATE '2008-12-25', MONTH) AS month;"
      },
      {
        name: 'EXTRACT',
        title: 'EXTRACT(part FROM date_expression)',
        description:
          'Returns the value corresponding to the specified date part. The part must be one of:\n\nDAYOFWEEK: Returns values in the range [1,7] with Sunday as the first day of the week.\nDAY\nDAYOFYEAR\nWEEK: Returns the week number of the date in the range [0, 53]. Weeks begin with Sunday, and dates prior to the first Sunday of the year are in week 0.\nWEEK(<WEEKDAY>): Returns the week number of the date in the range [0, 53]. Weeks begin on WEEKDAY. Dates prior to the first WEEKDAY of the year are in week 0. Valid values for WEEKDAY are SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, and SATURDAY.\nISOWEEK: Returns the ISO 8601 week number of the date_expression. ISOWEEKs begin on Monday. Return values are in the range [1, 53]. The first ISOWEEK of each ISO year begins on the Monday before the first Thursday of the Gregorian calendar year.\nMONTH\nQUARTER: Returns values in the range [1,4].\nYEAR\nISOYEAR: Returns the ISO 8601 week-numbering year, which is the Gregorian calendar year containing the Thursday of the week to which date_expression belongs.',
        example: "SELECT EXTRACT(DAY FROM DATE '2013-12-25') AS the_day;"
      },
      {
        name: 'FORMAT_DATE',
        title: 'FORMAT_DATE(format_string, date_expr)',
        description: 'Formats the date_expr according to the specified format_string.',
        example: "SELECT FORMAT_DATE('%x', DATE '2008-12-25') AS US_format;"
      },
      {
        name: 'LAST_DAY',
        title: 'LAST_DAY(date_expression[, date_part])',
        description:
          'Returns the last day from a date expression. This is commonly used to return the last day of the month.\n\nYou can optionally specify the date part for which the last day is returned. If this parameter is not used, the default value is MONTH. LAST_DAY supports the following values for date_part:\n\nYEAR\nQUARTER\nMONTH\nWEEK. Equivalent to 7 DAYs.\nWEEK(<WEEKDAY>). <WEEKDAY> represents the starting day of the week. Valid values are SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, and SATURDAY.\nISOWEEK. Uses ISO 8601 week boundaries. ISO weeks begin on Monday.\nISOYEAR. Uses the ISO 8601 week-numbering year boundary. The ISO year boundary is the Monday of the first week whose Thursday belongs to the corresponding Gregorian calendar year.',
        example: "SELECT LAST_DAY(DATE '2008-11-25', MONTH) AS last_day"
      },
      {
        name: 'PARSE_DATE',
        title: 'PARSE_DATE(format_string, date_string)',
        description:
          'Converts a string representation of date to a DATE object.\n\nformat_string contains the format elements that define how date_string is formatted. Each element in date_string must have a corresponding element in format_string. The location of each element in format_string must match the location of each element in date_string.',
        example: "SELECT PARSE_DATE('%A %b %e %Y', 'Thursday Dec 25 2008')"
      },
      {
        name: 'UNIX_DATE',
        title: 'UNIX_DATE(date_expression)',
        description: 'Returns the number of days since 1970-01-01.',
        example: "SELECT UNIX_DATE(DATE '2008-12-25') AS days_from_epoch;"
      }
    ],
    DateTime: [
      {
        name: 'CURRENT_DATETIME',
        title: 'CURRENT_DATETIME([time_zone])',
        description:
          'Returns the current time as a DATETIME object. Parentheses are optional when called with no arguments.\n\nThis function supports an optional time_zone parameter. See Time zone definitions for information on how to specify a time zone.\n\nThe current date and time is recorded at the start of the query statement which contains this function, not when this specific function is evaluated.',
        example: 'SELECT CURRENT_DATETIME() as now;'
      },
      {
        name: 'DATETIME_ADD',
        title: 'DATETIME_ADD(datetime_expression, INTERVAL int64_expression part)',
        description:
          "Adds int64_expression units of part to the DATETIME object.\n\nDATETIME_ADD supports the following values for part:\n\nMICROSECOND\nMILLISECOND\nSECOND\nMINUTE\nHOUR\nDAY\nWEEK. Equivalent to 7 DAYs.\nMONTH\nQUARTER\nYEAR\nSpecial handling is required for MONTH, QUARTER, and YEAR parts when the date is at (or near) the last day of the month. If the resulting month has fewer days than the original DATETIME's day, then the result day is the last day of the new month.\n\n",
        example: 'SELECT\n  DATETIME "2008-12-25 15:30:00" as original_date,\n  DATETIME_ADD(DATETIME "2008-12-25 15:30:00", INTERVAL 10 MINUTE) as later;'
      },
      {
        name: 'DATETIME_DIFF',
        title: 'DATETIME_DIFF(datetime_expression_a, datetime_expression_b, part)',
        description:
          'Returns the whole number of specified part intervals between two DATETIME objects (datetime_expression_a - datetime_expression_b). If the first DATETIME is earlier than the second one, the output is negative. Throws an error if the computation overflows the result type, such as if the difference in microseconds between the two DATETIME objects would overflow an INT64 value.\n\nDATETIME_DIFF supports the following values for part:\n\nMICROSECOND\nMILLISECOND\nSECOND\nMINUTE\nHOUR\nDAY\nWEEK: This date part begins on Sunday.\nWEEK(<WEEKDAY>): This date part begins on WEEKDAY. Valid values for WEEKDAY are SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, and SATURDAY.\nISOWEEK: Uses ISO 8601 week boundaries. ISO weeks begin on Monday.\nMONTH, except when the first two arguments are TIMESTAMP objects.\nQUARTER\nYEAR\nISOYEAR: Uses the ISO 8601 week-numbering year boundary. The ISO year boundary is the Monday of the first week whose Thursday belongs to the corresponding Gregorian calendar year.',
        example:
          'SELECT\n  DATETIME "2010-07-07 10:20:00" as first_datetime,\n  DATETIME "2008-12-25 15:30:00" as second_datetime,\n  DATETIME_DIFF(DATETIME "2010-07-07 10:20:00",\n    DATETIME "2008-12-25 15:30:00", DAY) as difference;'
      },
      {
        name: 'DATETIME_SUB',
        title: 'DATETIME_SUB(datetime_expression, INTERVAL int64_expression part)',
        description:
          "Subtracts int64_expression units of part from the DATETIME.\n\nDATETIME_SUB supports the following values for part:\n\nMICROSECOND\nMILLISECOND\nSECOND\nMINUTE\nHOUR\nDAY\nWEEK. Equivalent to 7 DAYs.\nMONTH\nQUARTER\nYEAR\nSpecial handling is required for MONTH, QUARTER, and YEAR parts when the date is at (or near) the last day of the month. If the resulting month has fewer days than the original DATETIME's day, then the result day is the last day of the new month.",
        example: 'SELECT\n  DATETIME "2008-12-25 15:30:00" as original_date,\n  DATETIME_SUB(DATETIME "2008-12-25 15:30:00", INTERVAL 10 MINUTE) as earlier;\n'
      },
      {
        name: 'DATETIME_TRUNC',
        title: 'DATETIME_TRUNC(datetime_expression, date_time_part)',
        description:
          'Truncates a DATETIME value to the granularity of date_time_part. The DATETIME value is always rounded to the beginning of date_time_part, which can be one of the following:\n\nMICROSECOND: If used, nothing is truncated from the value.\nMILLISECOND: The nearest lessor or equal millisecond.\nSECOND: The nearest lessor or equal second.\nMINUTE: The nearest lessor or equal minute.\nHOUR: The nearest lessor or equal hour.\nDAY: The day in the Gregorian calendar year that contains the DATETIME value.\nWEEK: The first day of the week in the week that contains the DATETIME value. Weeks begin on Sundays. WEEK is equivalent to WEEK(SUNDAY).\nWEEK(WEEKDAY): The first day of the week in the week that contains the DATETIME value. Weeks begin on WEEKDAY. WEEKDAY must be one of the following: SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, or SATURDAY.\nISOWEEK: The first day of the ISO 8601 week in the ISO week that contains the DATETIME value. The ISO week begins on Monday. The first ISO week of each ISO year contains the first Thursday of the corresponding Gregorian calendar year.\nMONTH: The first day of the month in the month that contains the DATETIME value.\nQUARTER: The first day of the quarter in the quarter that contains the DATETIME value.\nYEAR: The first day of the year in the year that contains the DATETIME value.\nISOYEAR: The first day of the ISO 8601 week-numbering year in the ISO year that contains the DATETIME value. The ISO year is the Monday of the first week whose Thursday belongs to the corresponding Gregorian calendar year.\n',
        example: 'SELECT\n  DATETIME "2008-12-25 15:30:00" as original,\n  DATETIME_TRUNC(DATETIME "2008-12-25 15:30:00", DAY) as truncated;'
      },
      {
        name: 'EXTRACT',
        title: 'EXTRACT(part FROM datetime_expression)',
        description:
          'Returns a value that corresponds to the specified part from a supplied datetime_expression.\n\nAllowed part values are:\n\nMICROSECOND\nMILLISECOND\nSECOND\nMINUTE\nHOUR\nDAYOFWEEK: Returns values in the range [1,7] with Sunday as the first day of of the week.\nDAY\nDAYOFYEAR\nWEEK: Returns the week number of the date in the range [0, 53]. Weeks begin with Sunday, and dates prior to the first Sunday of the year are in week 0.\nWEEK(<WEEKDAY>): Returns the week number of datetime_expression in the range [0, 53]. Weeks begin on WEEKDAY. datetimes prior to the first WEEKDAY of the year are in week 0. Valid values for WEEKDAY are SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, and SATURDAY.\nISOWEEK: Returns the ISO 8601 week number of the datetime_expression. ISOWEEKs begin on Monday. Return values are in the range [1, 53]. The first ISOWEEK of each ISO year begins on the Monday before the first Thursday of the Gregorian calendar year.\nMONTH\nQUARTER\nYEAR\nISOYEAR: Returns the ISO 8601 week-numbering year, which is the Gregorian calendar year containing the Thursday of the week to which date_expression belongs.\nDATE\nTIME\nReturned values truncate lower order time periods. For example, when extracting seconds, EXTRACT truncates the millisecond and microsecond values.',
        example: 'SELECT EXTRACT(HOUR FROM DATETIME(2008, 12, 25, 15, 30, 00)) as hour;'
      },
      {
        name: 'FORMAT_DATETIME',
        title: 'FORMAT_DATETIME(format_string, datetime_expression)',
        description: 'Formats a DATETIME object according to the specified format_string',
        example: 'SELECT\n  FORMAT_DATETIME("%c", DATETIME "2008-12-25 15:30:00")\n  AS formatted;'
      },
      {
        name: 'LAST_DAY',
        title: 'LAST_DAY(datetime_expression[, date_part])',
        description:
          'Returns the last day from a datetime expression that contains the date. This is commonly used to return the last day of the month.\n\nYou can optionally specify the date part for which the last day is returned. If this parameter is not used, the default value is MONTH. LAST_DAY supports the following values for date_part:\n\nYEAR\nQUARTER\nMONTH\nWEEK. Equivalent to 7 DAYs.\nWEEK(<WEEKDAY>). <WEEKDAY> represents the starting day of the week. Valid values are SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, and SATURDAY.\nISOWEEK. Uses ISO 8601 week boundaries. ISO weeks begin on Monday.\nISOYEAR. Uses the ISO 8601 week-numbering year boundary. The ISO year boundary is the Monday of the first week whose Thursday belongs to the corresponding Gregorian calendar year.',
        example: "SELECT LAST_DAY(DATETIME '2008-11-25', MONTH) AS last_day"
      },
      {
        name: 'PARSE_DATETIME',
        title: 'PARSE_DATETIME(format_string, datetime_string)',
        description:
          'Converts a string representation of a datetime to a DATETIME object.\n\nformat_string contains the format elements that define how datetime_string is formatted. Each element in datetime_string must have a corresponding element in format_string. The location of each element in format_string must match the location of each element in datetime_string.',
        example: 'SELECT PARSE_DATETIME("%a %b %e %I:%M:%S %Y", "Thu Dec 25 07:30:00 2008")'
      }
    ],
    Debug: [
      {
        name: 'ERROR',
        title: 'ERROR(error_message)',
        description:
          'Returns an error. The error_message argument is a STRING.\n\nGoogleSQL treats ERROR in the same way as any expression that may result in an error: there is no special guarantee of evaluation order.',
        example:
          "SELECT\n  CASE\n    WHEN value = 'foo' THEN 'Value is foo.'\n    WHEN value = 'bar' THEN 'Value is bar.'\n    ELSE ERROR(CONCAT('Found unexpected value: ', value))\n  END AS new_value\nFROM (\n  SELECT 'foo' AS value UNION ALL\n  SELECT 'bar' AS value UNION ALL\n  SELECT 'baz' AS value);"
      }
    ],
    DifferentiallyPrivateAggregate: [],
    FederatedQuery: [],
    Geography: [],
    Hash: [
      {
        name: 'FARM_FINGERPRINT',
        title: 'FARM_FINGERPRINT(value)',
        description:
          'Computes the fingerprint of the STRING or BYTES input using the Fingerprint64 function from the open-source FarmHash library. The output of this function for a particular input will never change.\n\n',
        example:
          'WITH example AS (\n  SELECT 1 AS x, "foo" AS y, true AS z UNION ALL\n  SELECT 2 AS x, "apple" AS y, false AS z UNION ALL\n  SELECT 3 AS x, "" AS y, true AS z\n)\nSELECT\n  *,\n  FARM_FINGERPRINT(CONCAT(CAST(x AS STRING), y, CAST(z AS STRING)))\n    AS row_fingerprint\nFROM example;'
      },
      {
        name: 'SHA256',
        title: 'SHA256(input)',
        description:
          'Computes the hash of the input using the SHA-256 algorithm. The input can either be STRING or BYTES. The string version treats the input as an array of bytes.\n\nThis function returns 32 bytes.\n\n',
        example: 'SELECT SHA256("Hello World") as sha256;'
      },
      {
        name: 'SHA512',
        title: 'SHA256(input)',
        description:
          'Computes the hash of the input using the SHA-512 algorithm. The input can either be STRING or BYTES. The string version treats the input as an array of bytes.\n\nThis function returns 64 bytes.\n\n',
        example: 'SELECT SHA512("Hello World") as sha512;'
      }
    ],
    Interval: [
      {
        name: 'EXTRACT',
        title: 'EXTRACT(part FROM interval_expression)',
        description:
          'Returns the value corresponding to the specified date part. The part must be one of YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, MILLISECOND or MICROSECOND.',
        example:
          "SELECT\n  EXTRACT(YEAR FROM i) AS year,\nFROM\n  UNNEST([INTERVAL '1-2 3 4:5:6.789999' YEAR TO SECOND,\n          INTERVAL '0-13 370 48:61:61' YEAR TO SECOND]) AS i"
      },
      {
        name: 'JUSTIFY_DAYS',
        title: 'JUSTIFY_DAYS(interval_expression)',
        description: 'Normalizes the day part of the interval to the range from -29 to 29 by incrementing/decrementing the month or year part of the interval.',
        example: 'SELECT\n  JUSTIFY_DAYS(INTERVAL 29 DAY) AS i1'
      },
      {
        name: 'JUSTIFY_HOURS',
        title: 'JUSTIFY_HOURS(interval_expression)',
        description:
          'Normalizes the time part of the interval to the range from -23:59:59.999999 to 23:59:59.999999 by incrementing/decrementing the day part of the interval.',
        example: 'SELECT\n  JUSTIFY_HOURS(INTERVAL 23 HOUR) AS i1'
      },
      {
        name: 'JUSTIFY_INTERVAL',
        title: 'JUSTIFY_INTERVAL(interval_expression)',
        description: 'Normalizes the days and time parts of the interval.',
        example: "SELECT JUSTIFY_INTERVAL(INTERVAL '29 49:00:00' DAY TO SECOND) AS i"
      },
      {
        name: 'MAKE_INTERVAL',
        title: 'MAKE_INTERVAL([year][, month][, day][, hour][, minute][, second])',
        description:
          'Constructs an INTERVAL object using INT64 values representing the year, month, day, hour, minute, and second. All arguments are optional, 0 by default, and can be named arguments.',
        example: 'SELECT\n  MAKE_INTERVAL(1, 6, 15) AS i1'
      }
    ],
    JSON: [],
    Keywords: [
      {
        name: 'ALL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'AND',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ANY',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ARRAY',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'AS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ASC',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ASSERT_ROWS_MODIFIED',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'AT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'BETWEEN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'BY',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CASE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CAST',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'COLLATE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CONTAINS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CREATE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CROSS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CUBE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CURRENT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'DEFAULT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'DEFINE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'DESC',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'DISTINCT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ELSE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'END',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ENUM',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ESCAPE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'EXCEPT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'EXCLUDE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'EXISTS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'EXTRACT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'FALSE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'FETCH',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'FOLLOWING',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'FOR',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'FROM',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'FULL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'GROUP',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'GROUPING',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'GROUPS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'HASH',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'HAVING',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'IF',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'IGNORE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'IN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'INNER',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'INTERSECT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'INTERVAL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'INTO',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'IS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'JOIN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LATERAL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LEFT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LIKE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LIMIT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LOOKUP',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'MERGE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NATURAL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NEW',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NO',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NOT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NULL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NULLS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'OF',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ON',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'OR',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ORDER',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'OUTER',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'OVER',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'PARTITION',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'PRECEDING',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'PROTO',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'QUALIFY',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'RANGE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'RECURSIVE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'RESPECT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'RIGHT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ROLLUP',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'ROWS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'SELECT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'SET',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'SOME',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'STRUCT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'TABLESAMPLE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'THEN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'TO',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'TREAT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'TRUE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'UNBOUNDED',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'UNION',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'UNNEST',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'USING',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'WHEN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'WHERE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'WINDOW',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'WITH',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'WITHIN',
        title: '',
        description: '',
        example: ''
      }
    ],
    Math: [
      {
        name: 'ABS',
        title: 'ABS(X)',
        description:
          'Computes absolute value. Returns an error if the argument is an integer and the output value cannot be represented as the same type; this happens only for the largest negative input value, which has no positive representation.'
      },
      {
        name: 'ACOS',
        title: 'ACOS(X)',
        description:
          'Computes the principal value of the inverse cosine of X. The return value is in the range [0,π]. Generates an error if X is a value outside of the range [-1, 1].'
      },
      {
        name: 'ACOSH',
        title: 'ACOSH(X)',
        description: 'Computes the inverse hyperbolic cosine of X. Generates an error if X is a value less than 1.\n\n'
      },
      {
        name: 'ASIN',
        title: 'ASIN(X)',
        description:
          'Computes the principal value of the inverse sine of X. The return value is in the range [-π/2,π/2]. Generates an error if X is outside of the range [-1, 1].'
      },
      {
        name: 'ASINH',
        title: 'ASINH(X)',
        description: 'Computes the inverse hyperbolic sine of X. Does not fail.'
      },
      {
        name: 'ATAN',
        title: 'ATAN(X)',
        description: 'Computes the principal value of the inverse tangent of X. The return value is in the range [-π/2,π/2]. Does not fail.'
      },
      {
        name: 'ATAN2',
        title: 'ATAN2(X, Y)',
        description:
          'Calculates the principal value of the inverse tangent of X/Y using the signs of the two arguments to determine the quadrant. The return value is in the range [-π,π].'
      },
      {
        name: 'ATANH',
        title: 'ATANH(X)',
        description: 'Computes the inverse hyperbolic tangent of X. Generates an error if X is outside of the range (-1, 1).'
      },
      {
        name: 'CBRT',
        title: 'CBRT(X)',
        description: 'Computes the cube root of X. X can be any data type that coerces to FLOAT64. Supports the SAFE. prefix.'
      },
      {
        name: 'CEIL',
        title: 'CEIL(X)',
        description: 'Returns the smallest integral value that is not less than X.'
      },
      {
        name: 'CEILING',
        title: 'CEILING(X)',
        description: 'Synonym of CEIL(X)'
      },
      {
        name: 'COS',
        title: 'COS(X)',
        description: 'Computes the cosine of X where X is specified in radians. Never fails.'
      },
      {
        name: 'COSH',
        title: 'COSH(X)',
        description: 'Computes the hyperbolic cosine of X where X is specified in radians. Generates an error if overflow occurs.'
      },
      {
        name: 'COT',
        title: 'COT(X)',
        description:
          'Computes the cotangent for the angle of X, where X is specified in radians. X can be any data type that coerces to FLOAT64. Supports the SAFE. prefix.'
      },
      {
        name: 'COTH',
        title: 'COTH(X)',
        description:
          'Computes the hyperbolic cotangent for the angle of X, where X is specified in radians. X can be any data type that coerces to FLOAT64. Supports the SAFE. prefix.'
      },
      {
        name: 'CSC',
        title: 'CSC(X)',
        description: 'Computes the cosecant of the input angle, which is in radians. X can be any data type that coerces to FLOAT64. Supports the SAFE. prefix.'
      },
      {
        name: 'CSCH',
        title: 'CSCH(X)',
        description:
          'Computes the hyperbolic cosecant of the input angle, which is in radians. X can be any data type that coerces to FLOAT64. Supports the SAFE. prefix.'
      },
      {
        name: 'DIV',
        title: 'DIV(X, Y)',
        description: 'Returns the result of integer division of X by Y. Division by zero returns an error. Division by -1 may overflow.'
      },
      {
        name: 'EXP',
        title: 'EXP(X)',
        description:
          'Computes e to the power of X, also called the natural exponential function. If the result underflows, this function returns a zero. Generates an error if the result overflows.'
      },
      {
        name: 'FLOOR',
        title: 'FLOOR(X)',
        description: 'Returns the largest integral value that is not greater than X.'
      },
      {
        name: 'GREATEST',
        title: 'GREATEST(X1,...,XN)',
        description:
          'Returns the greatest value among X1,...,XN. If any argument is NULL, returns NULL. Otherwise, in the case of floating-point arguments, if any argument is NaN, returns NaN. In all other cases, returns the value among X1,...,XN that has the greatest value according to the ordering used by the ORDER BY clause. The arguments X1, ..., XN must be coercible to a common supertype, and the supertype must support ordering.'
      },
      {
        name: 'IEEE_DIVIDE',
        title: 'IEEE_DIVIDE(X, Y)',
        description:
          'Divides X by Y; this function never fails. Returns FLOAT64. Unlike the division operator (/), this function does not generate errors for division by zero or overflow.'
      },
      {
        name: 'IS_INF',
        title: 'IS_INF(X)',
        description: 'Returns TRUE if the value is positive or negative infinity.'
      },
      {
        name: 'IS_NAN',
        title: 'IS_NAN(X)',
        description: 'Returns TRUE if the value is a NaN value.'
      },
      {
        name: 'LEAST',
        title: 'LEAST(X1,...,XN)',
        description:
          'Returns the least value among X1,...,XN. If any argument is NULL, returns NULL. Otherwise, in the case of floating-point arguments, if any argument is NaN, returns NaN. In all other cases, returns the value among X1,...,XN that has the least value according to the ordering used by the ORDER BY clause. The arguments X1, ..., XN must be coercible to a common supertype, and the supertype must support ordering.'
      },
      {
        name: 'LN',
        title: 'LN(X)',
        description: 'Computes the natural logarithm of X. Generates an error if X is less than or equal to zero.'
      },
      {
        name: 'LOG',
        title: 'LOG(X [, Y])',
        description: 'If only X is present, LOG is a synonym of LN. If Y is also present, LOG computes the logarithm of X to base Y.'
      },
      {
        name: 'LOG10',
        title: 'LOG10(X)',
        description: 'Similar to LOG, but computes logarithm to base 10.'
      },
      {
        name: 'MOD',
        title: 'MOD(X, Y)',
        description: 'Modulo function: returns the remainder of the division of X by Y. Returned value has the same sign as X. An error is generated if Y is 0.'
      },
      {
        name: 'POW',
        title: 'POW(X, Y)',
        description:
          'Returns the value of X raised to the power of Y. If the result underflows and is not representable, then the function returns a value of zero.'
      },
      {
        name: 'POWER',
        title: 'POWER(X, Y)',
        description: 'Synonym of POW(X, Y).'
      },
      {
        name: 'RAND',
        title: 'RAND()',
        description: 'Generates a pseudo-random value of type FLOAT64 in the range of [0, 1), inclusive of 0 and exclusive of 1.\n\n'
      },
      {
        name: 'RANGE_BUCKET',
        title: 'RANGE_BUCKET(point, boundaries_array)',
        description:
          "RANGE_BUCKET scans through a sorted array and returns the 0-based position of the point's upper bound. This can be useful if you need to group your data to build partitions, histograms, business-defined rules, and more.\nIf the point exists in the array, returns the index of the next larger value.\nIf the point does not exist in the array, but it falls between two values, returns the index of the larger value.\nIf the point is smaller than the first value in the array, returns 0.\nIf the point is greater than or equal to the last value in the array, returns the length of the array.\nIf the array is empty, returns 0.\nIf the point is NULL or NaN, returns NULL.\nThe data type for the point and array must be compatible.\nThe array has a NaN or NULL value in it.\nThe array is not sorted in ascending order."
      },
      {
        name: 'ROUND',
        title: 'ROUND(X [, N [, rounding_mode]])',
        description:
          'If only X is present, rounds X to the nearest integer. If N is present, rounds X to N decimal places after the decimal point. If N is negative, rounds off digits to the left of the decimal point. Rounds halfway cases away from zero. Generates an error if overflow occurs.\n\nIf X is a NUMERIC or BIGNUMERIC type, then you can explicitly set rounding_mode to one of the following:\n\n"ROUND_HALF_AWAY_FROM_ZERO": (Default) Rounds halfway cases away from zero.\n"ROUND_HALF_EVEN": Rounds halfway cases towards the nearest even digit.\nIf you set the rounding_mode and X is not a NUMERIC or BIGNUMERIC type, then the function generates an error.'
      },
      {
        name: 'SAFE_ADD',
        title: 'SAFE_ADD(X, Y)',
        description: 'Equivalent to the addition operator (+), but returns NULL if overflow occurs.'
      },
      {
        name: 'SAFE_DIVIDE',
        title: 'SAFE_DIVIDE(X, Y)',
        description: 'Equivalent to the division operator (X / Y), but returns NULL if an error occurs, such as a division by zero error.'
      },
      {
        name: 'SAFE_MULTIPLY',
        title: 'SAFE_MULTIPLY(X, Y)',
        description: 'Equivalent to the multiplication operator (*), but returns NULL if overflow occurs.'
      },
      {
        name: 'SAFE_NEGATE',
        title: 'SAFE_NEGATE(X)',
        description: 'Equivalent to the unary minus operator (-), but returns NULL if overflow occurs.'
      },
      {
        name: 'SAFE_SUBTRACT',
        title: 'SAFE_SUBTRACT(X, Y)',
        description: 'Returns the result of Y subtracted from X. Equivalent to the subtraction operator (-), but returns NULL if overflow occurs.'
      },
      {
        name: 'SEC',
        title: 'SEC(X)',
        description: 'Computes the secant for the angle of X, where X is specified in radians. X can be any data type that coerces to FLOAT64.'
      },
      {
        name: 'SECH',
        title: 'SECH(X)',
        description:
          'Computes the hyperbolic secant for the angle of X, where X is specified in radians. X can be any data type that coerces to FLOAT64. Never produces an error.'
      },
      {
        name: 'SIGN',
        title: 'SIGN(X)',
        description:
          'Returns -1, 0, or +1 for negative, zero and positive arguments respectively. For floating point arguments, this function does not distinguish between positive and negative zero.'
      },
      {
        name: 'SIN',
        title: 'SIN(X)',
        description: 'Computes the sine of X where X is specified in radians. Never fails.'
      },
      {
        name: 'SINH',
        title: 'SINH(X)',
        description: 'Computes the hyperbolic sine of X where X is specified in radians. Generates an error if overflow occurs.'
      },
      {
        name: 'SQRT',
        title: 'SQRT(X)',
        description: 'Computes the square root of X. Generates an error if X is less than 0.'
      },
      {
        name: 'TAN',
        title: 'TAN(X)',
        description: 'Computes the tangent of X where X is specified in radians. Generates an error if overflow occurs.'
      },
      {
        name: 'TANH',
        title: 'TANH(X)',
        description: 'Computes the hyperbolic tangent of X where X is specified in radians. Does not fail.'
      },
      {
        name: 'TRUNC',
        title: 'TRUNC(X [, N])',
        description:
          'If only X is present, TRUNC rounds X to the nearest integer whose absolute value is not greater than the absolute value of X. If N is also present, TRUNC behaves like ROUND(X, N), but always rounds towards zero and never overflows.'
      }
    ],
    Navigation: [
      {
        name: 'FIRST_VALUE',
        title:
          'FIRST_VALUE (value_expression [{RESPECT | IGNORE} NULLS])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n  [ window_frame_clause ]\n',
        description:
          'Returns the value of the value_expression for the first row in the current window frame.\n\nThis function includes NULL values in the calculation unless IGNORE NULLS is present. If IGNORE NULLS is present, the function excludes NULL values from the calculation.',
        example: 'FROM (\n  SELECT name,\n  finish_time,\n  division,\n  FIRST_VALUE(finish_time)'
      },
      {
        name: 'LAG',
        title:
          'LAG (value_expression[, offset [, default_expression]])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          "Returns the value of the value_expression on a preceding row. Changing the offset value changes which preceding row is returned; the default value is 1, indicating the previous row in the window frame. An error occurs if offset is NULL or a negative value.\n\nThe optional default_expression is used if there isn't a row in the window frame at the specified offset. This expression must be a constant expression and its type must be implicitly coercible to the type of value_expression. If left unspecified, default_expression defaults to NULL.",
        example: 'SELECT name,\n  finish_time,\n  division,\n  LAG(name)'
      },
      {
        name: 'LAST_VALUE',
        title:
          'LAST_VALUE (value_expression [{RESPECT | IGNORE} NULLS])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n  [ window_frame_clause ]\n',
        description:
          'Returns the value of the value_expression for the last row in the current window frame.\n\nThis function includes NULL values in the calculation unless IGNORE NULLS is present. If IGNORE NULLS is present, the function excludes NULL values from the calculation.',
        example: 'FROM (\n  SELECT name,\n  finish_time,\n  division,\n  LAST_VALUE(finish_time)'
      },
      {
        name: 'LEAD',
        title:
          'LEAD (value_expression[, offset [, default_expression]])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          "Returns the value of the value_expression on a subsequent row. Changing the offset value changes which subsequent row is returned; the default value is 1, indicating the next row in the window frame. An error occurs if offset is NULL or a negative value.\n\nThe optional default_expression is used if there isn't a row in the window frame at the specified offset. This expression must be a constant expression and its type must be implicitly coercible to the type of value_expression. If left unspecified, default_expression defaults to NULL.",
        example: 'SELECT name,\n  finish_time,\n  division,\n  LEAD(name)'
      },
      {
        name: 'NTH_VALUE',
        title:
          'NTH_VALUE (value_expression, constant_integer_expression [{RESPECT | IGNORE} NULLS])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n  [ window_frame_clause ]\n',
        description:
          'Returns the value of value_expression at the Nth row of the current window frame, where Nth is defined by constant_integer_expression. Returns NULL if there is no such row.\n\nThis function includes NULL values in the calculation unless IGNORE NULLS is present. If IGNORE NULLS is present, the function excludes NULL values from the calculation.',
        example:
          "SELECT name,\n  FORMAT_TIMESTAMP('%X', finish_time) AS finish_time,\n  division,\n  FORMAT_TIMESTAMP('%X', fastest_time) AS fastest_time,\n  FORMAT_TIMESTAMP('%X', second_fastest) AS second_fastest\nFROM (\n  SELECT name,\n  finish_time,\n  division,finishers,\n  FIRST_VALUE(finish_time)"
      },
      {
        name: 'PERCENTILE_CONT',
        title:
          'PERCENTILE_CONT (value_expression, percentile [{RESPECT | IGNORE} NULLS])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n',
        description:
          'Computes the specified percentile value for the value_expression, with linear interpolation.\n\nThis function ignores NULL values if RESPECT NULLS is absent. If RESPECT NULLS is present:\n\nInterpolation between two NULL values returns NULL.\nInterpolation between a NULL value and a non-NULL value returns the non-NULL value.',
        example:
          'SELECT\n  PERCENTILE_CONT(x, 0) OVER() AS min,\n  PERCENTILE_CONT(x, 0.01) OVER() AS percentile1,\n  PERCENTILE_CONT(x, 0.5) OVER() AS median,'
      },
      {
        name: 'PERCENTILE_DISC',
        title:
          'PERCENTILE_DISC (value_expression, percentile [{RESPECT | IGNORE} NULLS])\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n',
        description:
          'Computes the specified percentile value for a discrete value_expression. The returned value is the first sorted value of value_expression with cumulative distribution greater than or equal to the given percentile value.\n\nThis function ignores NULL values unless RESPECT NULLS is present.',
        example:
          "SELECT\n  x,\n  PERCENTILE_DISC(x, 0) OVER() AS min,\n  PERCENTILE_DISC(x, 0.5) OVER() AS median,\n  PERCENTILE_DISC(x, 1) OVER() AS max\nFROM UNNEST(['c', NULL, 'b', 'a']) AS x;"
      }
    ],
    Numbering: [
      {
        name: 'CUME_DIST',
        title:
          'CUME_DIST()\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          'Return the relative rank of a row defined as NP/NR. NP is defined to be the number of rows that either precede or are peers with the current row. NR is the number of rows in the partition.',
        example: 'SELECT name,\n  finish_time,\n  division,\n  CUME_DIST() OVER (PARTITION BY division ORDER BY finish_time ASC) AS finish_rank'
      },
      {
        name: 'DENSE_RANK',
        title:
          'DENSE_RANK()\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          'Returns the ordinal (1-based) rank of each row within the window partition. All peer rows receive the same rank value, and the subsequent rank value is incremented by one.',
        example: 'SELECT x,\n  DENSE_RANK() OVER (ORDER BY x ASC) AS dense_rank\nFROM Numbers'
      },
      {
        name: 'NTILE',
        title:
          'NTILE(constant_integer_expression)\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          'This function divides the rows into constant_integer_expression buckets based on row ordering and returns the 1-based bucket number that is assigned to each row. The number of rows in the buckets can differ by at most 1. The remainder values (the remainder of number of rows divided by buckets) are distributed one for each bucket, starting with bucket 1. If constant_integer_expression evaluates to NULL, 0 or negative, an error is provided.',
        example: 'SELECT name,\n  finish_time,\n  division,\n  NTILE(3) OVER (PARTITION BY division ORDER BY finish_time ASC) AS finish_rank\nFROM finishers;'
      },
      {
        name: 'PERCENT_RANK',
        title:
          'PERCENT_RANK()\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          'Return the percentile rank of a row defined as (RK-1)/(NR-1), where RK is the RANK of the row and NR is the number of rows in the partition. Returns 0 if NR=1.',
        example:
          'SELECT name,\n  finish_time,\n  division,\n  PERCENT_RANK() OVER (PARTITION BY division ORDER BY finish_time ASC) AS finish_rank\nFROM finishers;'
      },
      {
        name: 'RANK',
        title:
          'RANK()\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  ORDER BY expression [ { ASC | DESC }  ] [, ...]\n',
        description:
          'Returns the ordinal (1-based) rank of each row within the ordered partition. All peer rows receive the same rank value. The next row or set of peer rows receives a rank value which increments by the number of peers with the previous rank value, instead of DENSE_RANK, which always increments by 1.',
        example: 'SELECT x,\n  RANK() OVER (ORDER BY x ASC) AS rank\nFROM Numbers'
      },
      {
        name: 'ROW_NUMBER',
        title:
          'ROW_NUMBER()\nOVER over_clause\n\nover_clause:\n  { named_window | ( [ window_specification ] ) }\n\nwindow_specification:\n  [ named_window ]\n  [ PARTITION BY partition_expression [, ...] ]\n  [ ORDER BY expression [ { ASC | DESC }  ] [, ...] ]\n',
        description:
          'Does not require the ORDER BY clause. Returns the sequential row ordinal (1-based) of each row for each ordered partition. If the ORDER BY clause is unspecified then the result is non-deterministic.',
        example: 'SELECT x,\n  ROW_NUMBER() OVER (ORDER BY x) AS row_num\nFROM Numbers'
      }
    ],
    Operator: [
      {
        name: 'AND',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'BETWEEN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'IN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LIKE',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NOT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'OR',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'IS',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'NULL',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'INTERSECT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'UNION',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'INNER',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'JOIN',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'LEFT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'OUTER',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'RIGHT',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'GLOBAL',
        title: '',
        description: '',
        example: ''
      }
    ],
    Search: [
      {
        name: 'SEARCH',
        title:
          "SEARCH(search_data, search_query[, json_scope=>json_scope_value][, analyzer=>analyzer_name])\n\njson_scope_value:\n  { 'JSON_VALUES' | 'JSON_KEYS' | 'JSON_KEYS_AND_VALUES' }\n\nanalyzer_name:\n  { 'LOG_ANALYZER' | 'NO_OP_ANALYZER' }",
        description:
          "The SEARCH function checks to see whether a BigQuery table or other search data contains a set of search terms. It returns TRUE if all tokens in the search_query appear in the search_data based on the tokenization described in the text analyzer, and FALSE otherwise. If search_query is NULL or doesn't contain any search terms, an error is thrown.\n\nSEARCH is designed to work with search indexes to optimize point lookups. Although the SEARCH function works for columns of a table that are not indexed, its performance will be greatly improved with a search index."
      }
    ],
    String: [
      {
        name: 'ASCII',
        title: 'ASCII(value)',
        description:
          'Returns the ASCII code for the first character or byte in value. Returns 0 if value is empty or the ASCII code is 0 for the first character or byte.',
        example: "SELECT ASCII('abcd') as A, ASCII('a') as B, ASCII('') as C, ASCII(NULL) as D;"
      },
      {
        name: 'BYTE_LENGTH',
        title: 'BYTE_LENGTH(value)',
        description: 'Returns the length of the STRING or BYTES value in BYTES, regardless of whether the type of the value is STRING or BYTES.',
        example:
          "WITH example AS\n  (SELECT 'абвгд' AS characters, b'абвгд' AS bytes)\n\nSELECT\n  characters,\n  BYTE_LENGTH(characters) AS string_example,\n  bytes,\n  BYTE_LENGTH(bytes) AS bytes_example\nFROM example;"
      },
      {
        name: 'CHAR_LENGTH',
        title: 'CHAR_LENGTH(value)',
        description: 'Returns the length of the STRING in characters.',
        example: "WITH example AS\n  (SELECT 'абвгд' AS characters)\n\nSELECT\n  characters,\n  CHAR_LENGTH(characters) AS char_length_example\nFROM example;"
      },
      {
        name: 'CHARACTER_LENGTH',
        title: 'CHARACTER_LENGTH(value)',
        description: 'Synonym for CHAR_LENGTH.\n\n',
        example:
          "WITH example AS\n  (SELECT 'абвгд' AS characters)\n\nSELECT\n  characters,\n  CHARACTER_LENGTH(characters) AS char_length_example\nFROM example;"
      },
      {
        name: 'CHR',
        title: 'CHR(value)',
        description:
          'Takes a Unicode code point and returns the character that matches the code point. Each valid code point should fall within the range of [0, 0xD7FF] and [0xE000, 0x10FFFF]. Returns an empty string if the code point is 0. If an invalid Unicode code point is specified, an error is returned.\n\nTo work with an array of Unicode code points, see CODE_POINTS_TO_STRING',
        example: 'SELECT CHR(65) AS A, CHR(255) AS B, CHR(513) AS C, CHR(1024)  AS D;'
      },
      {
        name: 'CODE_POINTS_TO_BYTES',
        title: 'CODE_POINTS_TO_BYTES(ascii_code_points)',
        description:
          'Takes an array of extended ASCII code points as ARRAY<INT64> and returns BYTES.\n\nTo convert from BYTES to an array of code points, see TO_CODE_POINTS.',
        example: 'SELECT CODE_POINTS_TO_BYTES([65, 98, 67, 100]) AS bytes;'
      },
      {
        name: 'CODE_POINTS_TO_STRING',
        title: 'CODE_POINTS_TO_STRING(unicode_code_points)',
        description:
          'Takes an array of Unicode code points as ARRAY<INT64> and returns a STRING.\n\nTo convert from a string to an array of code points, see TO_CODE_POINTS.',
        example: 'SELECT CODE_POINTS_TO_STRING([65, 255, 513, 1024]) AS string;'
      },
      {
        name: 'COLLATE',
        title: 'COLLATE(value, collate_specification)',
        description:
          'Takes a STRING and a collation specification. Returns a STRING with a collation specification. If collate_specification is empty, returns a value with collation removed from the STRING.\n\nThe collation specification defines how the resulting STRING can be compared and sorted. To learn more, see Working with collation.\n\ncollation_specification must be a string literal, otherwise an error is thrown.\nReturns NULL if value is NULL.',
        example:
          "WITH Words AS (\n  SELECT\n    COLLATE('a', 'und:ci') AS char1,\n    COLLATE('Z', 'und:ci') AS char2\n)\nSELECT ( Words.char1 < Words.char2 ) AS a_less_than_Z\nFROM Words;"
      },
      {
        name: 'CONCAT',
        title: 'CONCAT(value1[, ...])',
        description:
          'Concatenates one or more values into a single result. All values must be BYTES or data types that can be cast to STRING.\n\nThe function returns NULL if any input argument is NULL.',
        example: "SELECT CONCAT('T.P.', ' ', 'Bar') as author;"
      },
      {
        name: 'CONTAINS_SUBSTR',
        title:
          "CONTAINS_SUBSTR(expression, search_value_literal[, json_scope=>json_scope_value])\n\njson_scope_value:\n  { 'JSON_VALUES' | 'JSON_KEYS' | 'JSON_KEYS_AND_VALUES' }",
        description:
          'Performs a normalized, case-insensitive search to see if a value exists as a substring in an expression. Returns TRUE if the value exists, otherwise returns FALSE.\n\nBefore values are compared, they are normalized and case folded with NFKC normalization. Wildcard searches are not supported.',
        example: "SELECT CONTAINS_SUBSTR('the blue house', 'Blue house') AS result;"
      },
      {
        name: 'ENDS_WITH',
        title: 'ENDS_WITH(value, suffix)',
        description: 'Takes two STRING or BYTES values. Returns TRUE if suffix is a suffix of value.',
        example:
          "WITH items AS\n  (SELECT 'apple' as item\n  UNION ALL\n  SELECT 'banana' as item\n  UNION ALL\n  SELECT 'orange' as item)\n\nSELECT\n  ENDS_WITH(item, 'e') as example\nFROM items;"
      },
      {
        name: 'FORMAT',
        title: 'FORMAT(format_string_expression, data_type_expression[, ...])',
        description:
          'FORMAT formats a data type expression as a string.\n\nformat_string_expression: Can contain zero or more format specifiers. Each format specifier is introduced by the % symbol, and must map to one or more of the remaining arguments. In general, this is a one-to-one mapping, except when the * specifier is present. For example, %.*i maps to two arguments—a length argument and a signed integer argument. If the number of arguments related to the format specifiers is not the same as the number of arguments, an error occurs.\ndata_type_expression: The value to format as a string. This can be any GoogleSQL data type.',
        example: "SELECT FORMAT('date: %s!', FORMAT_DATE('%B %d, %Y', date '2015-01-02'));"
      },
      {
        name: 'FROM_BASE32',
        title: 'FROM_BASE32(string_expr)',
        description: 'Converts the base32-encoded input string_expr into BYTES format. To convert BYTES to a base32-encoded STRING, use TO_BASE32.',
        example: "SELECT FROM_BASE32('MFRGGZDF74======') AS byte_data;"
      },
      {
        name: 'FROM_BASE64',
        title: 'FROM_BASE64(string_expr)',
        description:
          'Converts the base64-encoded input string_expr into BYTES format. To convert BYTES to a base64-encoded STRING, use [TO_BASE64][string-link-to-base64].\n\nThere are several base64 encodings in common use that vary in exactly which alphabet of 65 ASCII characters are used to encode the 64 digits and padding. See RFC 4648 for details. This function expects the alphabet [A-Za-z0-9+/=].',
        example: "SELECT FROM_BASE64('/+A=') AS byte_data;"
      },
      {
        name: 'FROM_HEX',
        title: 'FROM_HEX(string)',
        description:
          'Converts a hexadecimal-encoded STRING into BYTES format. Returns an error if the input STRING contains characters outside the range (0..9, A..F, a..f). The lettercase of the characters does not matter. If the input STRING has an odd number of characters, the function acts as if the input has an additional leading 0. To convert BYTES to a hexadecimal-encoded STRING, use TO_HEX.',
        example:
          "WITH Input AS (\n  SELECT '00010203aaeeefff' AS hex_str UNION ALL\n  SELECT '0AF' UNION ALL\n  SELECT '666f6f626172'\n)\nSELECT hex_str, FROM_HEX(hex_str) AS bytes_str\nFROM Input;"
      },
      {
        name: 'INITCAP',
        title: 'INITCAP(value[, delimiters])',
        description:
          'Takes a STRING and returns it with the first character in each word in uppercase and all other characters in lowercase. Non-alphabetic characters remain the same.\n\ndelimiters is an optional string argument that is used to override the default set of characters used to separate words. If delimiters is not specified, it defaults to the following characters:\n<whitespace> [ ] ( ) { } / | \\ < > ! ? @ " ^ # $ & ~ _ , . : ; * % + -\n\nIf value or delimiters is NULL, the function returns NULL.\n\n',
        example:
          "WITH example AS\n(\n  SELECT 'Hello World-everyone!' AS value UNION ALL\n  SELECT 'tHe dog BARKS loudly+friendly' AS value UNION ALL\n  SELECT 'apples&oranges;&pears' AS value UNION ALL\n  SELECT 'καθίσματα ταινιών' AS value\n)\nSELECT value, INITCAP(value) AS initcap_value FROM example"
      },
      {
        name: 'INSTR',
        title: 'INSTR(value, subvalue[, position[, occurrence]])',
        description:
          'Returns the lowest 1-based position of subvalue in value. value and subvalue must be the same type, either STRING or BYTES.\n\nIf position is specified, the search starts at this position in value, otherwise it starts at 1, which is the beginning of value. If position is negative, the function searches backwards from the end of value, with -1 indicating the last character. position is of type INT64 and cannot be 0.\n\nIf occurrence is specified, the search returns the position of a specific instance of subvalue in value. If not specified, occurrence defaults to 1 and returns the position of the first occurrence. For occurrence > 1, the function includes overlapping occurrences. occurrence is of type INT64 and must be positive.',
        example:
          "WITH example AS\n(SELECT 'banana' as value, 'an' as subvalue, 1 as position, 1 as\noccurrence UNION ALL\nSELECT 'banana' as value, 'an' as subvalue, 1 as position, 2 as\noccurrence UNION ALL\nSELECT 'banana' as value, 'an' as subvalue, 1 as position, 3 as\noccurrence UNION ALL\nSELECT 'banana' as value, 'an' as subvalue, 3 as position, 1 as\noccurrence UNION ALL\nSELECT 'banana' as value, 'an' as subvalue, -1 as position, 1 as\noccurrence UNION ALL\nSELECT 'banana' as value, 'an' as subvalue, -3 as position, 1 as\noccurrence UNION ALL\nSELECT 'banana' as value, 'ann' as subvalue, 1 as position, 1 as\noccurrence UNION ALL\nSELECT 'helloooo' as value, 'oo' as subvalue, 1 as position, 1 as\noccurrence UNION ALL\nSELECT 'helloooo' as value, 'oo' as subvalue, 1 as position, 2 as\noccurrence\n)\nSELECT value, subvalue, position, occurrence, INSTR(value,\nsubvalue, position, occurrence) AS instr\nFROM example;"
      },
      {
        name: 'LEFT',
        title: 'LEFT(value, length)',
        description:
          'Returns a STRING or BYTES value that consists of the specified number of leftmost characters or bytes from value. The length is an INT64 that specifies the length of the returned value. If value is of type BYTES, length is the number of leftmost bytes to return. If value is STRING, length is the number of leftmost characters to return.\n\nIf length is 0, an empty STRING or BYTES value will be returned. If length is negative, an error will be returned. If length exceeds the number of characters or bytes from value, the original value will be returned.',
        example:
          "WITH examples AS\n(SELECT 'apple' as example\nUNION ALL\nSELECT 'banana' as example\nUNION ALL\nSELECT 'абвгд' as example\n)\nSELECT example, LEFT(example, 3) AS left_example\nFROM examples;"
      },
      {
        name: 'LENGTH',
        title: 'LENGTH(value)',
        description:
          'Returns the length of the STRING or BYTES value. The returned value is in characters for STRING arguments and in bytes for the BYTES argument.',
        example:
          "WITH example AS\n  (SELECT 'абвгд' AS characters)\n\nSELECT\n  characters,\n  LENGTH(characters) AS string_example,\n  LENGTH(CAST(characters AS BYTES)) AS bytes_example\nFROM example;"
      },
      {
        name: 'LOWER',
        title: 'LOWER(value)',
        description:
          'For STRING arguments, returns the original string with all alphabetic characters in lowercase. Mapping between lowercase and uppercase is done according to the Unicode Character Database without taking into account language-specific mappings.\n\nFor BYTES arguments, the argument is treated as ASCII text, with all bytes greater than 127 left intact.',
        example:
          "WITH items AS\n  (SELECT\n    'FOO' as item\n  UNION ALL\n  SELECT\n    'BAR' as item\n  UNION ALL\n  SELECT\n    'BAZ' as item)\n\nSELECT\n  LOWER(item) AS example\nFROM items;"
      },
      {
        name: 'LPAD',
        title: 'LPAD(original_value, return_length[, pattern])',
        description:
          "Returns a STRING or BYTES value that consists of original_value prepended with pattern. The return_length is an INT64 that specifies the length of the returned value. If original_value is of type BYTES, return_length is the number of bytes. If original_value is of type STRING, return_length is the number of characters.\n\nThe default value of pattern is a blank space.\n\nBoth original_value and pattern must be the same data type.\n\nIf return_length is less than or equal to the original_value length, this function returns the original_value value, truncated to the value of return_length. For example, LPAD('hello world', 7); returns 'hello w'.\n\nIf original_value, return_length, or pattern is NULL, this function returns NULL.\n\nThis function returns an error if:\n\nreturn_length is negative\npattern is empty",
        example: "SELECT t, len, FORMAT('%T', LPAD(t, len)) AS LPAD FROM UNNEST([\n  STRUCT('abc' AS t, 5 AS len),\n  ('abc', 2),\n  ('例子', 4)\n]);"
      },
      {
        name: 'LTRIM',
        title: 'LTRIM(value1[, value2])',
        description: 'Identical to TRIM, but only removes leading characters.',
        example:
          "WITH items AS\n  (SELECT '   apple   ' as item\n  UNION ALL\n  SELECT '   banana   ' as item\n  UNION ALL\n  SELECT '   orange   ' as item)\n\nSELECT\n  CONCAT('#', LTRIM(item), '#') as example\nFROM items;"
      },
      {
        name: 'NORMALIZE_AND_CASEFOLD',
        title: 'NORMALIZE_AND_CASEFOLD(value[, normalization_mode])',
        description:
          'Takes a string value and returns it as a normalized string. If you do not provide a normalization mode, NFC is used.\n\nNormalization is used to ensure that two strings are equivalent. Normalization is often used in situations in which two strings render the same on the screen but have different Unicode code points.\n\nCase folding is used for the caseless comparison of strings. If you need to compare strings and case should not be considered, use NORMALIZE_AND_CASEFOLD, otherwise use NORMALIZE.',
        example:
          "SELECT\n  a, b,\n  NORMALIZE(a) = NORMALIZE(b) as normalized,\n  NORMALIZE_AND_CASEFOLD(a) = NORMALIZE_AND_CASEFOLD(b) as normalized_with_case_folding\nFROM (SELECT 'The red barn' AS a, 'The Red Barn' AS b);"
      },
      {
        name: 'NORMALIZE',
        title: 'NORMALIZE(value[, normalization_mode])',
        description:
          'Takes a string value and returns it as a normalized string. If you do not provide a normalization mode, NFC is used.\n\nNormalization is used to ensure that two strings are equivalent. Normalization is often used in situations in which two strings render the same on the screen but have different Unicode code points.',
        example: "SELECT a, b, a = b as normalized\nFROM (SELECT NORMALIZE('\\u00ea') as a, NORMALIZE('\\u0065\\u0302') as b);"
      },
      {
        name: 'OCTET_LENGTH',
        title: 'OCTET_LENGTH(value)',
        description: 'Alias for BYTE_LENGTH.'
      },
      {
        name: 'REGEXP_CONTAINS',
        title: 'REGEXP_CONTAINS(value, regexp)',
        description:
          'Returns TRUE if value is a partial match for the regular expression, regexp.\n\nIf the regexp argument is invalid, the function returns an error.\n\nYou can search for a full match by using ^ (beginning of text) and $ (end of text). Due to regular expression operator precedence, it is good practice to use parentheses around everything between ^ and $.',
        example:
          "SELECT\n  email,\n  REGEXP_CONTAINS(email, r'@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+') AS is_valid\nFROM\n  (SELECT\n    ['foo@example.com', 'bar@example.org', 'www.example.net']\n    AS addresses),\n  UNNEST(addresses) AS email;"
      },
      {
        name: 'REGEXP_EXTRACT_ALL',
        title: 'REGEXP_EXTRACT_ALL(value, regexp)',
        description:
          'Returns an array of all substrings of value that match the re2 regular expression, regexp. Returns an empty array if there is no match.\n\nIf the regular expression contains a capturing group ((...)), and there is a match for that capturing group, that match is added to the results. If there are multiple matches for a capturing group, the last match is added to the results.\n\nThe REGEXP_EXTRACT_ALL function only returns non-overlapping matches. For example, using this function to extract ana from banana returns only one substring, not two.\n\nReturns an error if:\n\nThe regular expression is invalid\nThe regular expression has more than one capturing group',
        example:
          "WITH code_markdown AS\n  (SELECT 'Try `function(x)` or `function(y)`' as code)\n\nSELECT\n  REGEXP_EXTRACT_ALL(code, '`(.+?)`') AS example\nFROM code_markdown;"
      },
      {
        name: 'REGEXP_EXTRACT',
        title: 'REGEXP_EXTRACT(value, regexp[, position[, occurrence]])',
        description:
          'Returns the substring in value that matches the re2 regular expression, regexp. Returns NULL if there is no match.\n\nIf the regular expression contains a capturing group ((...)), and there is a match for that capturing group, that match is returned. If there are multiple matches for a capturing group, the last match is returned.\n\nIf position is specified, the search starts at this position in value, otherwise it starts at the beginning of value. The position must be a positive integer and cannot be 0. If position is greater than the length of value, NULL is returned.\n\nIf occurrence is specified, the search returns a specific occurrence of the regexp in value, otherwise returns the first match. If occurrence is greater than the number of matches found, NULL is returned. For occurrence > 1, the function searches for additional occurrences beginning with the character following the previous occurrence.\n\nReturns an error if:\n\nThe regular expression is invalid\nThe regular expression has more than one capturing group\nThe position is not a positive integer\nThe occurrence is not a positive integer',
        example:
          "WITH email_addresses AS\n  (SELECT 'foo@example.com' as email\n  UNION ALL\n  SELECT 'bar@example.org' as email\n  UNION ALL\n  SELECT 'baz@example.net' as email)\n\nSELECT\n  REGEXP_EXTRACT(email, r'^[a-zA-Z0-9_.+-]+')\n  AS user_name\nFROM email_addresses;"
      },
      {
        name: 'REGEXP_INSTR',
        title: 'REGEXP_INSTR(source_value, regexp [, position[, occurrence, [occurrence_position]]])',
        description:
          'Returns the lowest 1-based position of a regular expression, regexp, in source_value. source_value and regexp must be the same type, either STRING or BYTES.\n\nIf position is specified, the search starts at this position in source_value, otherwise it starts at 1, which is the beginning of source_value. position is of type INT64 and must be positive.\n\nIf occurrence is specified, the search returns the position of a specific instance of regexp in source_value. If not specified, occurrence defaults to 1 and returns the position of the first occurrence. For occurrence > 1, the function searches for the next, non-overlapping occurrence. occurrence is of type INT64 and must be positive.\n\nYou can optionally use occurrence_position to specify where a position in relation to an occurrence starts. Your choices are:\n\n0: Returns the start position of occurrence.\n1: Returns the end position of occurrence + 1. If the end of the occurrence is at the end of source_value, LENGTH(source_value) + 1 is returned.\nReturns 0 if:\n\nNo match is found.\nIf occurrence is greater than the number of matches found.\nIf position is greater than the length of source_value.\nThe regular expression is empty.\nReturns NULL if:\n\nposition is NULL.\noccurrence is NULL.\nReturns an error if:\n\nposition is 0 or negative.\noccurrence is 0 or negative.\noccurrence_position is neither 0 nor 1.\nThe regular expression is invalid.\nThe regular expression has more than one capturing group.',
        example:
          "WITH example AS (\n  SELECT 'ab@cd-ef' AS source_value, '@[^-]*' AS regexp UNION ALL\n  SELECT 'ab@d-ef', '@[^-]*' UNION ALL\n  SELECT 'abc@cd-ef', '@[^-]*' UNION ALL\n  SELECT 'abc-ef', '@[^-]*')\nSELECT source_value, regexp, REGEXP_INSTR(source_value, regexp) AS instr\nFROM example;\n"
      },
      {
        name: 'REGEXP_REPLACE',
        title: 'REGEXP_REPLACE(value, regexp, replacement)',
        description:
          "Returns a STRING where all substrings of value that match regular expression regexp are replaced with replacement.\n\nYou can use backslashed-escaped digits (\\1 to \\9) within the replacement argument to insert text matching the corresponding parenthesized group in the regexp pattern. Use \\0 to refer to the entire matching text.\n\nTo add a backslash in your regular expression, you must first escape it. For example, SELECT REGEXP_REPLACE('abc', 'b(.)', 'X\\\\1'); returns aXc. You can also use raw strings to remove one layer of escaping, for example SELECT REGEXP_REPLACE('abc', 'b(.)', r'X\\1');.\n\nThe REGEXP_REPLACE function only replaces non-overlapping matches. For example, replacing ana within banana results in only one replacement, not two.\n\nIf the regexp argument is not a valid regular expression, this function returns an error.",
        example:
          "WITH markdown AS\n  (SELECT '# Heading' as heading\n  UNION ALL\n  SELECT '# Another heading' as heading)\n\nSELECT\n  REGEXP_REPLACE(heading, r'^# ([a-zA-Z0-9\\s]+$)', '<h1>\\\\1</h1>')\n  AS html\nFROM markdown;"
      },
      {
        name: 'REGEXP_SUBSTR',
        title: 'REGEXP_SUBSTR(value, regexp[, position[, occurrence]])',
        description: 'Synonym for REGEXP_EXTRACT.',
        example:
          "WITH example AS\n(SELECT 'Hello World Helloo' AS value, 'H?ello+' AS regex, 1 AS position, 1 AS\noccurrence\n)\nSELECT value, regex, position, occurrence, REGEXP_SUBSTR(value, regex,\nposition, occurrence) AS regexp_value FROM example;\n"
      },
      {
        name: 'REPEAT',
        title: 'REPEAT(original_value, repetitions)',
        description:
          'Returns a STRING or BYTES value that consists of original_value, repeated. The repetitions parameter specifies the number of times to repeat original_value. Returns NULL if either original_value or repetitions are NULL.\n\nThis function returns an error if the repetitions value is negative',
        example: "SELECT t, n, REPEAT(t, n) AS REPEAT FROM UNNEST([\n  STRUCT('abc' AS t, 3 AS n),\n  ('例子', 2),\n  ('abc', null),\n  (null, 3)\n]);"
      },
      {
        name: 'REPLACE',
        title: 'REPLACE(original_value, from_value, to_value)',
        description:
          'Replaces all occurrences of from_value with to_value in original_value. If from_value is empty, no replacement is made.\n\nThis function supports specifying collation.',
        example:
          "WITH desserts AS\n  (SELECT 'apple pie' as dessert\n  UNION ALL\n  SELECT 'blackberry pie' as dessert\n  UNION ALL\n  SELECT 'cherry pie' as dessert)\n\nSELECT\n  REPLACE (dessert, 'pie', 'cobbler') as example\nFROM desserts;\n"
      },
      {
        name: 'REVERSE',
        title: 'REVERSE(value)',
        description: 'Returns the reverse of the input STRING or BYTES.',
        example:
          "WITH example AS (\n  SELECT 'foo' AS sample_string, b'bar' AS sample_bytes UNION ALL\n  SELECT 'абвгд' AS sample_string, b'123' AS sample_bytes\n)\nSELECT\n  sample_string,\n  REVERSE(sample_string) AS reverse_string,\n  sample_bytes,\n  REVERSE(sample_bytes) AS reverse_bytes\nFROM example;\n"
      }
    ]
  }
});
