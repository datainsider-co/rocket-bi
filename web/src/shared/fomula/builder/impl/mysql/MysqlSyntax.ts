export const getMysqlSyntax = () => ({
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
      'ACCESSIBLE',
      'ADD',
      'ALL',
      'ALTER',
      'ANALYZE',
      'AND',
      'AS',
      'ASC',
      'ASENSITIVE',
      'BEFORE',
      'BETWEEN',
      'BIGINT',
      'BINARY',
      'BLOB',
      'BOTH',
      'BY',
      'CALL',
      'CASCADE',
      'CASE',
      'CHANGE',
      'CHAR',
      'CHARACTER',
      'CHECK',
      'COLLATE',
      'COLUMN',
      'CONDITION',
      'CONSTRAINT',
      'CONTINUE',
      'CONVERT',
      'CREATE',
      'CROSS',
      'CUBE',
      'CUME_DIST',
      'CURRENT_DATE',
      'CURRENT_TIME',
      'CURRENT_TIMESTAMP',
      'CURRENT_USER',
      'CURSOR',
      'DATABASE',
      'DATABASES',
      'DAY_HOUR',
      'DAY_MICROSECOND',
      'DAY_MINUTE',
      'DAY_SECOND',
      'DEC',
      'DECIMAL',
      'DECLARE',
      'DEFAULT',
      'DELAYED',
      'DELETE',
      'DENSE_RANK',
      'DESC',
      'DESCRIBE',
      'DETERMINISTIC',
      'DISTINCT',
      'DISTINCTROW',
      'DIV',
      'DOUBLE',
      'DROP',
      'DUAL',
      'EACH',
      'ELSE',
      'ELSEIF',
      'EMPTY',
      'ENCLOSED',
      'ESCAPED',
      'EXCEPT',
      'EXISTS',
      'EXIT',
      'EXPLAIN',
      'FALSE',
      'FETCH',
      'FIRST_VALUE',
      'FLOAT',
      'FLOAT4',
      'FLOAT8',
      'FOR',
      'FORCE',
      'FOREIGN',
      'FROM',
      'FULLTEXT',
      'FUNCTION',
      'GENERATED',
      'GET',
      'GRANT',
      'GROUP',
      'GROUPING',
      'GROUPS',
      'HAVING',
      'HIGH_PRIORITY',
      'HOUR_MICROSECOND',
      'HOUR_MINUTE',
      'HOUR_SECOND',
      'IF',
      'IGNORE',
      'IN',
      'INDEX',
      'INFILE',
      'INNER',
      'INOUT',
      'INSENSITIVE',
      'INSERT',
      'INT',
      'INT1',
      'INT2',
      'INT3',
      'INT4',
      'INT8',
      'INTEGER',
      'INTERVAL',
      'INTO',
      'IO_AFTER_GTIDS',
      'IO_BEFORE_GTIDS',
      'IS',
      'ITERATE',
      'JOIN',
      'JSON_TABLE',
      'KEY',
      'KEYS',
      'KILL',
      'LAG',
      'LAST_VALUE',
      'LATERAL',
      'LEAD',
      'LEADING',
      'LEAVE',
      'LEFT',
      'LIKE',
      'LIMIT',
      'LINEAR',
      'LINES',
      'LOAD',
      'LOCALTIME',
      'LOCALTIMESTAMP',
      'LOCK',
      'LONG',
      'LONGBLOB',
      'LONGTEXT',
      'LOOP',
      'LOW_PRIORITY',
      'MASTER_BIND',
      'MASTER_SSL_VERIFY_SERVER_CERT',
      'MATCH',
      'MAXVALUE',
      'MEDIUMBLOB',
      'MEDIUMINT',
      'MEDIUMTEXT',
      'MIDDLEINT',
      'MINUTE_MICROSECOND',
      'MINUTE_SECOND',
      'MOD',
      'MODIFIES',
      'NATURAL',
      'NOT',
      'NO_WRITE_TO_BINLOG',
      'NTH_VALUE',
      'NTILE',
      'NULL',
      'NUMERIC',
      'OF',
      'ON',
      'OPTIMIZE',
      'OPTIMIZER_COSTS',
      'OPTION',
      'OPTIONALLY',
      'OR',
      'ORDER',
      'OUT',
      'OUTER',
      'OUTFILE',
      'OVER',
      'PARTITION',
      'PERCENT_RANK',
      'PRECISION',
      'PRIMARY',
      'PROCEDURE',
      'PURGE',
      'RANGE',
      'RANK',
      'READ',
      'READS',
      'READ_WRITE',
      'REAL',
      'RECURSIVE',
      'REFERENCES',
      'REGEXP',
      'RELEASE',
      'RENAME',
      'REPEAT',
      'REPLACE',
      'REQUIRE',
      'RESIGNAL',
      'RESTRICT',
      'RETURN',
      'REVOKE',
      'RIGHT',
      'RLIKE',
      'ROW',
      'ROWS',
      'ROW_NUMBER',
      'SCHEMA',
      'SCHEMAS',
      'SECOND_MICROSECOND',
      'SELECT',
      'SENSITIVE',
      'SEPARATOR',
      'SET',
      'SHOW',
      'SIGNAL',
      'SMALLINT',
      'SPATIAL',
      'SPECIFIC',
      'SQL',
      'SQLEXCEPTION',
      'SQLSTATE',
      'SQLWARNING',
      'SQL_BIG_RESULT',
      'SQL_CALC_FOUND_ROWS',
      'SQL_SMALL_RESULT',
      'SSL',
      'STARTING',
      'STORED',
      'STRAIGHT_JOIN',
      'SYSTEM',
      'TABLE',
      'TERMINATED',
      'THEN',
      'TINYBLOB',
      'TINYINT',
      'TINYTEXT',
      'TO',
      'TRAILING',
      'TRIGGER',
      'TRUE',
      'UNDO',
      'UNION',
      'UNIQUE',
      'UNLOCK',
      'UNSIGNED',
      'UPDATE',
      'USAGE',
      'USE',
      'USING',
      'UTC_DATE',
      'UTC_TIME',
      'UTC_TIMESTAMP',
      'VALUES',
      'VARBINARY',
      'VARCHAR',
      'VARCHARACTER',
      'VARYING',
      'VIRTUAL',
      'WHEN',
      'WHERE',
      'WHILE',
      'WINDOW',
      'WITH',
      'WRITE',
      'XOR',
      'YEAR_MONTH',
      'ZEROFILL'
    ],
    databases: [],
    tables: [],
    columns: [],
    operators: ['AND', 'BETWEEN', 'IN', 'LIKE', 'NOT', 'OR', 'IS', 'NULL', 'INTERSECT', 'UNION', 'INNER', 'JOIN', 'LEFT', 'OUTER', 'RIGHT'],
    builtinFunctions: [
      'ABS',
      'ACOS',
      'ADDDATE',
      'ADDTIME',
      'AES_DECRYPT',
      'AES_ENCRYPT',
      'ANY_VALUE',
      'Area',
      'AsBinary',
      'AsWKB',
      'ASCII',
      'ASIN',
      'AsText',
      'AsWKT',
      'ASYMMETRIC_DECRYPT',
      'ASYMMETRIC_DERIVE',
      'ASYMMETRIC_ENCRYPT',
      'ASYMMETRIC_SIGN',
      'ASYMMETRIC_VERIFY',
      'ATAN',
      'ATAN2',
      'ATAN',
      'AVG',
      'BENCHMARK',
      'BIN',
      'BIT_AND',
      'BIT_COUNT',
      'BIT_LENGTH',
      'BIT_OR',
      'BIT_XOR',
      'Buffer',
      'CAST',
      'CEIL',
      'CEILING',
      'Centroid',
      'CHAR',
      'CHAR_LENGTH',
      'CHARACTER_LENGTH',
      'CHARSET',
      'COALESCE',
      'COERCIBILITY',
      'COLLATION',
      'COMPRESS',
      'CONCAT',
      'CONCAT_WS',
      'CONNECTION_ID',
      'Contains',
      'CONV',
      'CONVERT',
      'CONVERT_TZ',
      'ConvexHull',
      'COS',
      'COT',
      'COUNT',
      'CRC32',
      'CREATE_ASYMMETRIC_PRIV_KEY',
      'CREATE_ASYMMETRIC_PUB_KEY',
      'CREATE_DH_PARAMETERS',
      'CREATE_DIGEST',
      'Crosses',
      'CUME_DIST',
      'CURDATE',
      'CURRENT_DATE',
      'CURRENT_ROLE',
      'CURRENT_TIME',
      'CURRENT_TIMESTAMP',
      'CURRENT_USER',
      'CURTIME',
      'DATABASE',
      'DATE',
      'DATE_ADD',
      'DATE_FORMAT',
      'DATE_SUB',
      'DATEDIFF',
      'DAY',
      'DAYNAME',
      'DAYOFMONTH',
      'DAYOFWEEK',
      'DAYOFYEAR',
      'DECODE',
      'DEFAULT',
      'DEGREES',
      'DES_DECRYPT',
      'DES_ENCRYPT',
      'DENSE_RANK',
      'Dimension',
      'Disjoint',
      'Distance',
      'ELT',
      'ENCODE',
      'ENCRYPT',
      'EndPoint',
      'Envelope',
      'Equals',
      'EXP',
      'EXPORT_SET',
      'ExteriorRing',
      'EXTRACT',
      'ExtractValue',
      'FIELD',
      'FIND_IN_SET',
      'FIRST_VALUE',
      'FLOOR',
      'FORMAT',
      'FORMAT_BYTES',
      'FORMAT_PICO_TIME',
      'FOUND_ROWS',
      'FROM_BASE64',
      'FROM_DAYS',
      'FROM_UNIXTIME',
      'GEN_RANGE',
      'GEN_RND_EMAIL',
      'GEN_RND_PAN',
      'GEN_RND_SSN',
      'GEN_RND_US_PHONE',
      'GeomCollection',
      'GeomCollFromText',
      'GeometryCollectionFromText',
      'GeomCollFromWKB',
      'GeometryCollectionFromWKB',
      'GeometryCollection',
      'GeometryN',
      'GeometryType',
      'GeomFromText',
      'GeometryFromText',
      'GeomFromWKB',
      'GeometryFromWKB',
      'GET_FORMAT',
      'GET_LOCK',
      'GLength',
      'GREATEST',
      'GROUP_CONCAT',
      'GROUPING',
      'GTID_SUBSET',
      'GTID_SUBTRACT',
      'HEX',
      'HOUR',
      'ICU_VERSION',
      'IF',
      'IFNULL',
      'INET_ATON',
      'INET_NTOA',
      'INET6_ATON',
      'INET6_NTOA',
      'INSERT',
      'INSTR',
      'InteriorRingN',
      'Intersects',
      'INTERVAL',
      'IS_FREE_LOCK',
      'IS_IPV4',
      'IS_IPV4_COMPAT',
      'IS_IPV4_MAPPED',
      'IS_IPV6',
      'IS_USED_LOCK',
      'IS_UUID',
      'IsClosed',
      'IsEmpty',
      'ISNULL',
      'IsSimple',
      'JSON_APPEND',
      'JSON_ARRAY',
      'JSON_ARRAY_APPEND',
      'JSON_ARRAY_INSERT',
      'JSON_ARRAYAGG',
      'JSON_CONTAINS',
      'JSON_CONTAINS_PATH',
      'JSON_DEPTH',
      'JSON_EXTRACT',
      'JSON_INSERT',
      'JSON_KEYS',
      'JSON_LENGTH',
      'JSON_MERGE',
      'JSON_MERGE_PATCH',
      'JSON_MERGE_PRESERVE',
      'JSON_OBJECT',
      'JSON_OBJECTAGG',
      'JSON_OVERLAPS',
      'JSON_PRETTY',
      'JSON_QUOTE',
      'JSON_REMOVE',
      'JSON_REPLACE',
      'JSON_SCHEMA_VALID',
      'JSON_SCHEMA_VALIDATION_REPORT',
      'JSON_SEARCH',
      'JSON_SET',
      'JSON_STORAGE_FREE',
      'JSON_STORAGE_SIZE',
      'JSON_TABLE',
      'JSON_TYPE',
      'JSON_UNQUOTE',
      'JSON_VALID',
      'LAG',
      'LAST_DAY',
      'LAST_INSERT_ID',
      'LAST_VALUE',
      'LCASE',
      'LEAD',
      'LEAST',
      'LEFT',
      'LENGTH',
      'LineFromText',
      'LineStringFromText',
      'LineFromWKB',
      'LineStringFromWKB',
      'LineString',
      'LN',
      'LOAD_FILE',
      'LOCALTIME',
      'LOCALTIMESTAMP',
      'LOCATE',
      'LOG',
      'LOG10',
      'LOG2',
      'LOWER',
      'LPAD',
      'LTRIM',
      'MAKE_SET',
      'MAKEDATE',
      'MAKETIME',
      'MASK_INNER',
      'MASK_OUTER',
      'MASK_PAN',
      'MASK_PAN_RELAXED',
      'MASK_SSN',
      'MASTER_POS_WAIT',
      'MAX',
      'MBRContains',
      'MBRCoveredBy',
      'MBRCovers',
      'MBRDisjoint',
      'MBREqual',
      'MBREquals',
      'MBRIntersects',
      'MBROverlaps',
      'MBRTouches',
      'MBRWithin',
      'MD5',
      'MEMBER OF',
      'MICROSECOND',
      'MID',
      'MIN',
      'MINUTE',
      'MLineFromText',
      'MultiLineStringFromText',
      'MLineFromWKB',
      'MultiLineStringFromWKB',
      'MOD',
      'MONTH',
      'MONTHNAME',
      'MPointFromText',
      'MultiPointFromText',
      'MPointFromWKB',
      'MultiPointFromWKB',
      'MPolyFromText',
      'MultiPolygonFromText',
      'MPolyFromWKB',
      'MultiPolygonFromWKB',
      'MultiLineString',
      'MultiPoint',
      'MultiPolygon',
      'NAME_CONST',
      'NOT IN',
      'NOW',
      'NTH_VALUE',
      'NTILE',
      'NULLIF',
      'NumGeometries',
      'NumInteriorRings',
      'NumPoints',
      'OCT',
      'OCTET_LENGTH',
      'OLD_PASSWORD',
      'ORD',
      'Overlaps',
      'PASSWORD',
      'PERCENT_RANK',
      'PERIOD_ADD',
      'PERIOD_DIFF',
      'PI',
      'Point',
      'PointFromText',
      'PointFromWKB',
      'PointN',
      'PolyFromText',
      'PolygonFromText',
      'PolyFromWKB',
      'PolygonFromWKB',
      'Polygon',
      'POSITION',
      'POW',
      'POWER',
      'PS_CURRENT_THREAD_ID',
      'PS_THREAD_ID',
      'PROCEDURE ANALYSE',
      'QUARTER',
      'QUOTE',
      'RADIANS',
      'RAND',
      'RANDOM_BYTES',
      'RANK',
      'REGEXP_INSTR',
      'REGEXP_LIKE',
      'REGEXP_REPLACE',
      'REGEXP_REPLACE',
      'RELEASE_ALL_LOCKS',
      'RELEASE_LOCK',
      'REPEAT',
      'REPLACE',
      'REVERSE',
      'RIGHT',
      'ROLES_GRAPHML',
      'ROUND',
      'ROW_COUNT',
      'ROW_NUMBER',
      'RPAD',
      'RTRIM',
      'SCHEMA',
      'SEC_TO_TIME',
      'SECOND',
      'SESSION_USER',
      'SHA1',
      'SHA',
      'SHA2',
      'SIGN',
      'SIN',
      'SLEEP',
      'SOUNDEX',
      'SOURCE_POS_WAIT',
      'SPACE',
      'SQRT',
      'SRID',
      'ST_Area',
      'ST_AsBinary',
      'ST_AsWKB',
      'ST_AsGeoJSON',
      'ST_AsText',
      'ST_AsWKT',
      'ST_Buffer',
      'ST_Buffer_Strategy',
      'ST_Centroid',
      'ST_Collect',
      'ST_Contains',
      'ST_ConvexHull',
      'ST_Crosses',
      'ST_Difference',
      'ST_Dimension',
      'ST_Disjoint',
      'ST_Distance',
      'ST_Distance_Sphere',
      'ST_EndPoint',
      'ST_Envelope',
      'ST_Equals',
      'ST_ExteriorRing',
      'ST_FrechetDistance',
      'ST_GeoHash',
      'ST_GeomCollFromText',
      'ST_GeometryCollectionFromText',
      'ST_GeomCollFromTxt',
      'ST_GeomCollFromWKB',
      'ST_GeometryCollectionFromWKB',
      'ST_GeometryN',
      'ST_GeometryType',
      'ST_GeomFromGeoJSON',
      'ST_GeomFromText',
      'ST_GeometryFromText',
      'ST_GeomFromWKB',
      'ST_GeometryFromWKB',
      'ST_HausdorffDistance',
      'ST_InteriorRingN',
      'ST_Intersection',
      'ST_Intersects',
      'ST_IsClosed',
      'ST_IsEmpty',
      'ST_IsSimple',
      'ST_IsValid',
      'ST_LatFromGeoHash',
      'ST_Length',
      'ST_LineFromText',
      'ST_LineStringFromText',
      'ST_LineFromWKB',
      'ST_LineStringFromWKB',
      'ST_LineInterpolatePoint',
      'ST_LineInterpolatePoints',
      'ST_LongFromGeoHash',
      'ST_Longitude',
      'ST_MakeEnvelope',
      'ST_MLineFromText',
      'ST_MultiLineStringFromText',
      'ST_MLineFromWKB',
      'ST_MultiLineStringFromWKB',
      'ST_MPointFromText',
      'ST_MultiPointFromText',
      'ST_MPointFromWKB',
      'ST_MultiPointFromWKB',
      'ST_MPolyFromText',
      'ST_MultiPolygonFromText',
      'ST_MPolyFromWKB',
      'ST_MultiPolygonFromWKB',
      'ST_NumGeometries',
      'ST_NumInteriorRing',
      'ST_NumInteriorRings',
      'ST_NumPoints',
      'ST_Overlaps',
      'ST_PointAtDistance',
      'ST_PointFromGeoHash',
      'ST_PointFromText',
      'ST_PointFromWKB',
      'ST_PointN',
      'ST_PolyFromText',
      'ST_PolygonFromText',
      'ST_PolyFromWKB',
      'ST_PolygonFromWKB',
      'ST_Simplify',
      'ST_SRID',
      'ST_StartPoint',
      'ST_SwapXY',
      'ST_SymDifference',
      'ST_Touches',
      'ST_Transform',
      'ST_Union',
      'ST_Validate',
      'ST_Within',
      'ST_X',
      'ST_Y',
      'StartPoint',
      'STATEMENT_DIGEST',
      'STATEMENT_DIGEST_TEXT',
      'STD',
      'STDDEV',
      'STDDEV_POP',
      'STDDEV_SAMP',
      'STR_TO_DATE',
      'STRCMP',
      'SUBDATE',
      'SUBSTR',
      'SUBSTRING',
      'SUBSTRING_INDEX',
      'SUBTIME',
      'SUM',
      'SYSDATE',
      'SYSTEM_USER',
      'TAN',
      'TIME',
      'TIME_FORMAT',
      'TIME_TO_SEC',
      'TIMEDIFF',
      'TIMESTAMP',
      'TIMESTAMPADD',
      'TIMESTAMPDIFF',
      'TO_BASE64',
      'TO_DAYS',
      'TO_SECONDS',
      'Touches',
      'TRIM',
      'TRUNCATE',
      'UCASE',
      'UNCOMPRESS',
      'UNCOMPRESSED_LENGTH',
      'UNHEX',
      'UNIX_TIMESTAMP',
      'UpdateXML',
      'UPPER',
      'USER',
      'UTC_DATE',
      'UTC_TIME',
      'UTC_TIMESTAMP',
      'UUID',
      'UUID_SHORT',
      'UUID_TO_BIN',
      'VALIDATE_PASSWORD_STRENGTH',
      'VALUES',
      'VAR_POP',
      'VAR_SAMP',
      'VARIANCE',
      'VERSION',
      'WAIT_FOR_EXECUTED_GTID_SET',
      'WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS',
      'WEEK',
      'WEEKDAY',
      'WEEKOFYEAR',
      'WEIGHT_STRING',
      'Within',
      'X',
      'Y',
      'YEAR',
      'YEARWEEK'
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
  name: 'mysql',
  supportedFunction: {
    BuildInFunctions: [
      {
        name: 'ABS',
        title: 'ABS(number)',
        description: 'Return the absolute value of a number:',
        example: 'SELECT ABS(-243.5);'
      },
      {
        name: 'ACOS',
        title: 'ACOS(number)',
        description: 'Return the arc cosine of a number',
        example: 'SELECT ACOS(0.25);'
      },
      {
        name: 'ADDDATE',
        title: 'ADDDATE(date, INTERVAL value addunit)',
        description: 'Add value days to a date and return the date',
        example: 'SELECT ADDDATE("2017-06-15", INTERVAL 10 DAY);'
      },
      {
        name: 'ADDTIME',
        title: 'ADDTIME(datetime, addtime)',
        description: 'Add addtime seconds to a time and return the datetime',
        example: 'SELECT ADDTIME("2017-06-15 09:34:21", "2");'
      },
      {
        name: 'AES_DECRYPT',
        title: 'AES_DECRYPT(crypt_str, key_str);',
        description: 'decrypts an encrypted string using AES algorithm to return the original string. It returns NULL if detects invalid data.',
        example: "SELECT   AES_DECRYPT(AES_ENCRYPT('mytext','mykeystring'),\n'mykeystring');"
      },
      {
        name: 'AES_ENCRYPT',
        title: 'AES_ENCRYPT(str, key_str);',
        description:
          'Encrypts a string using AES algorithm.\n\nAES stands for Advance Encryption Standard. This function encodes the data with 128 bits key length but it can be extended up to 256 bits key length. It encrypts a string and returns a binary string. The return result will be NULL when an argument is NULL.',
        example: "SELECT AES_ENCRYPT('mytext', 'mykeystring');"
      },
      {
        name: 'ANY_VALUE',
        title: 'ANY_VALUE(arg)',
        description: 'Function that allows us to include nonaggregated columns in the SELECT list when using the GROUP BY clause.',
        example: "SELECT \n    District, \n    ANY_VALUE(Name), \n    SUM(Population) FROM City\nWHERE CountryCode = 'AUS'\nGROUP BY District;"
      },
      {
        name: 'ASCII',
        title: 'ASCII(character)',
        description: 'The ASCII() function returns the ASCII value for the specific character.',
        example: 'SELECT ASCII(CustomerName) AS NumCodeOfFirstChar\nFROM Customers;'
      },
      {
        name: 'ASIN',
        title: 'ASIN(number)',
        description:
          'The ASIN() function returns the arc sine of a number.\n\nThe specified number must be between -1 to 1, otherwise this function returns NULL. ',
        example: 'SELECT ASIN(0.25);'
      },
      {
        name: 'ASYMMETRIC_DECRYPT',
        title: 'ASYMMETRIC_DECRYPT(algorithm, crypt_str, key_str)',
        description:
          "Decrypts an encrypted string using the given algorithm and key string, and returns the resulting plaintext as a binary string. If decryption fails, the result is NULL.\n\nkey_str must be a valid key string in PEM format. For successful decryption, it must be the public or private key string corresponding to the private or public key string used with asymmetric_encrypt() to produce the encrypted string. algorithm indicates the encryption algorithm used to create the key.\n\nSupported algorithm values: 'RSA'",
        example: ''
      },
      {
        name: 'ASYMMETRIC_DERIVE',
        title: 'ASYMMETRIC_DERIVE(pub_key_str, priv_key_str)',
        description:
          'Derives a symmetric key using the private key of one party and the public key of another, and returns the resulting key as a binary string. If key derivation fails, the result is NULL.\n\npub_key_str and priv_key_str must be valid key strings in PEM format. They must be created using the DH algorithm.',
        example: ''
      },
      {
        name: 'ASYMMETRIC_ENCRYPT',
        title: 'ASYMMETRIC_ENCRYPT(algorithm, str, key_str)',
        description:
          "Encrypts a string using the given algorithm and key string, and returns the resulting ciphertext as a binary string. If encryption fails, the result is NULL.\n\nThe str length cannot be greater than the key_str length − 11, in bytes\n\nkey_str must be a valid key string in PEM format. algorithm indicates the encryption algorithm used to create the key.\n\nSupported algorithm values: 'RSA'\n\nTo encrypt a string, pass a private or public key string to asymmetric_encrypt(). To recover the original unencrypted string, pass the encrypted string to asymmetric_decrypt(), along with the public or private key string correponding to the private or public key string used for encryption.",
        example: ''
      },
      {
        name: 'ASYMMETRIC_SIGN',
        title: 'ASYMMETRIC_SIGN(algorithm, digest_str, priv_key_str, digest_type)',
        description:
          "Signs a digest string using a private key string, and returns the signature as a binary string. If signing fails, the result is NULL.\n\ndigest_str is the digest string. It can be generated by calling create_digest(). digest_type indicates the digest algorithm used to generate the digest string.\n\npriv_key_str is the private key string to use for signing the digest string. It must be a valid key string in PEM format. algorithm indicates the encryption algorithm used to create the key.\n\nSupported algorithm values: 'RSA', 'DSA'\n\nSupported digest_type values: 'SHA224', 'SHA256', 'SHA384', 'SHA512'\n\n",
        example: ''
      },
      {
        name: 'ASYMMETRIC_VERIFY',
        title: 'ASYMMETRIC_VERIFY(algorithm, digest_str, sig_str, pub_key_str, digest_type)',
        description:
          "Verifies whether the signature string matches the digest string, and returns 1 or 0 to indicate whether verification succeeded or failed.\n\ndigest_str is the digest string. It can be generated by calling create_digest(). digest_type indicates the digest algorithm used to generate the digest string.\n\nsig_str is the signature string. It can be generated by calling asymmetric_sign().\n\npub_key_str is the public key string of the signer. It corresponds to the private key passed to asymmetric_sign() to generate the signature string and must be a valid key string in PEM format. algorithm indicates the encryption algorithm used to create the key.\n\nSupported algorithm values: 'RSA', 'DSA'\n\nSupported digest_type values: 'SHA224', 'SHA256', 'SHA384', 'SHA512'",
        example: ''
      },
      {
        name: 'ATAN',
        title: 'ATAN(a, b)',
        description: 'The ATAN() function returns the arc tangent of one or two numbers.',
        example: 'SELECT ATAN(-0.8, 2);'
      },
      {
        name: 'ATAN2',
        title: 'ATAN2(a, b)',
        description: 'The ATAN2() function returns the arc tangent of two numbers.',
        example: 'SELECT ATAN2(0.50, 1);'
      },
      {
        name: 'ATAN',
        title: 'ATAN(number)',
        description: 'The ATAN() function returns the arc tangent of one or two numbers.',
        example: 'SELECT ATAN(2.5);'
      },
      {
        name: 'AVG',
        title: 'AVG(expression)',
        description: 'The AVG() function returns the average value of an expression.\n\nNote: NULL values are ignored. ',
        example: 'SELECT AVG(Price) AS AveragePrice FROM Products;'
      },
      {
        name: 'BIN',
        title: 'BIN(number)',
        description: 'The BIN() function returns a binary representation of a number, as a string value.',
        example: 'SELECT BIN(15);'
      },
      {
        name: 'BIT_AND',
        title: 'BIT_AND(expr)',
        description:
          'Returns the bitwise AND of all bits in expr. The calculation is performed with 64-bit (BIGINT) precision.\n\nIf there are no matching rows, BIT_AND() returns a neutral value (all bits set to 1).',
        example: ''
      },
      {
        name: 'BIT_COUNT',
        title: 'BIT_COUNT(N)',
        description: 'Returns the number of bits that are set in the argument N as an unsigned 64-bit integer, or NULL if the argument is NULL.',
        example: "SELECT BIT_COUNT(29), BIT_COUNT(b'101010');"
      },
      {
        name: 'BIT_LENGTH',
        title: 'BIT_LENGTH(str)',
        description: 'Returns the length of the string str in bits.',
        example: "SELECT BIT_LENGTH('text');"
      },
      {
        name: 'BIT_OR',
        title: 'BIT_OR(expr)',
        description:
          'Returns the bitwise OR of all bits in expr. The calculation is performed with 64-bit (BIGINT) precision.\n\nIf there are no matching rows, BIT_OR() returns a neutral value (all bits set to 0).',
        example: ''
      },
      {
        name: 'BIT_XOR',
        title: 'BIT_XOR(expr)',
        description:
          'Returns the bitwise XOR of all bits in expr. The calculation is performed with 64-bit (BIGINT) precision.\n\nIf there are no matching rows, BIT_XOR() returns a neutral value (all bits set to 0).',
        example: ''
      },
      {
        name: 'CAST',
        title: 'CAST(value AS datatype)',
        description: 'The CAST() function converts a value (of any type) into the specified datatype.',
        example: 'SELECT CAST("2017-08-29" AS DATE);'
      },
      {
        name: 'CEIL',
        title: 'CEIL(number)',
        description: 'The CEIL() function returns the smallest integer value that is bigger than or equal to a number.',
        example: 'SELECT CEIL(25.75);'
      },
      {
        name: 'CEILING',
        title: 'CEILING(number)',
        description: 'The CEILING() function returns the smallest integer value that is bigger than or equal to a number.',
        example: 'SELECT CEILING(25.75);'
      },
      {
        name: 'Centroid',
        title: 'Centroid({poly|mpoly})',
        description:
          'Returns the mathematical centroid for the Polygon or MultiPolygon argument as a Point. The result is not guaranteed to be on the MultiPolygon. If the argument is NULL or an empty geometry, the return value is NULL.\n\nThis function processes geometry collections by computing the centroid point for components of highest dimension in the collection. Such components are extracted and made into a single MultiPolygon, MultiLineString, or MultiPoint for centroid computation. If the argument is an empty geometry collection, the return value is NULL.',
        example:
          "SET @poly =ST_GeomFromText('POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7,5 5))'); \nSELECT ST_GeometryType(@poly),ST_AsText(ST_Centroid(@poly));"
      },
      {
        name: 'CHAR_LENGTH',
        title: 'CHAR_LENGTH(string)',
        description: 'The CHAR_LENGTH() function return the length of a string (in characters).',
        example: 'SELECT CHAR_LENGTH("SQL Tutorial") AS LengthOfString;'
      },
      {
        name: 'CHARACTER_LENGTH',
        title: 'CHARACTER_LENGTH(string)',
        description: 'The CHARACTER_LENGTH() function return the length of a string (in characters).',
        example: 'SELECT CHARACTER_LENGTH("SQL Tutorial") AS LengthOfString;'
      },
      {
        name: 'CHARSET',
        title: 'CHARSET(str)',
        description: 'Returns the character set of the string argument, or NULL if the argument is NULL.',
        example: "SELECT COERCIBILITY('abc' COLLATE utf8mb4_swedish_ci);"
      },
      {
        name: 'COALESCE',
        title: 'COALESCE(val1, val2, ...., val_n)',
        description: 'The COALESCE() function returns the first non-null value in a list.',
        example: "SELECT COALESCE(NULL, NULL, NULL, 'Datainsider.co', NULL, 'Example.com');"
      },
      {
        name: 'COERCIBILITY',
        title: 'COERCIBILITY(str)',
        description: 'Returns the collation coercibility value of the string argument.',
        example: "SELECT COERCIBILITY('abc' COLLATE utf8mb4_swedish_ci);"
      },
      {
        name: 'COLLATION',
        title: 'COLLATION(str)',
        description: 'Returns the collation of the string argument.',
        example: "SELECT COLLATION('abc');"
      },
      {
        name: 'COMPRESS',
        title: 'COMPRESS(string_to_compress)',
        description:
          'Compresses a string and returns the result as a binary string. This function requires MySQL to have been compiled with a compression library such as zlib. Otherwise, the return value is always NULL. The return value is also NULL if string_to_compress is NULL. The compressed string can be uncompressed with UNCOMPRESS().',
        example: "SELECT LENGTH(COMPRESS(REPEAT('a',1000)));"
      },
      {
        name: 'CONCAT',
        title: 'CONCAT(expression1, expression2, expression3,...)',
        description: 'The CONCAT() function adds two or more expressions together.',
        example: 'SELECT CONCAT("SQL ", "Tutorial ", "is ", "fun!") AS ConcatenatedString;'
      },
      {
        name: 'CONCAT_WS',
        title: 'CONCAT_WS(separator, expression1, expression2, expression3,...)',
        description: 'The CONCAT_WS() function adds two or more expressions together with a separator.',
        example: 'SELECT CONCAT_WS("-", "SQL", "Tutorial", "is", "fun!") AS ConcatenatedString;'
      },
      {
        name: 'CONNECTION_ID',
        title: '',
        description: '',
        example: ''
      },
      {
        name: 'CONV',
        title: 'CONV(number, from_base, to_base)',
        description: 'Convert a number from numeric base system 10 to numeric base system 2:\n\n',
        example: 'SELECT CONV(15, 10, 2);'
      },
      {
        name: 'CONVERT',
        title: 'CONVERT(value, type)',
        description: 'SELECT CONVERT("2017-08-29", DATE);',
        example: 'The CONVERT() function converts a value into the specified datatype or character set.\n\n'
      },
      {
        name: 'CONVERT_TZ',
        title: 'CONVERT_TZ(dt,from_tz,to_tz)',
        description:
          "Converts a datetime value dt from the time zone given by from_tz to the time zone given by to_tz and returns the resulting value. Time zones are specified as described in Section 5.1.15, “MySQL Server Time Zone Support”. This function returns NULL if any of the arguments are invalid, or if any of them are NULL.\n\nOn 32-bit platforms, the supported range of values for this function is the same as for the TIMESTAMP type (see Section 11.2.1, “Date and Time Data Type Syntax”, for range information). On 64-bit platforms, beginning with MySQL 8.0.28, the maximum supported value is '3001-01-18 23:59:59.999999' UTC.\n\nRegardless of platform or MySQL version, if the value falls out of the supported range when converted from from_tz to UTC, no conversion occurs.\n\n",
        example: "SELECT CONVERT_TZ('2004-01-01 12:00:00','GMT','MET');"
      },
      {
        name: 'ConvexHull',
        title: 'ConvexHull',
        description: 'A function that returns the convex hull of a geometry.',
        example: 'SELECT ConvexHull(geometry_column) FROM table_name;'
      },
      {
        name: 'COS',
        title: 'COS',
        description: 'A function that returns the cosine of a number (in radians).',
        example: 'SELECT COS(angle) FROM table_name;'
      },
      {
        name: 'COT',
        title: 'COT',
        description: 'A function that returns the cotangent of a number (in radians).',
        example: 'SELECT COT(angle) FROM table_name;'
      },
      {
        name: 'COUNT',
        title: 'COUNT',
        description: 'An aggregate function that returns the number of rows that match a specified condition.',
        example: 'SELECT COUNT(column_name) FROM table_name WHERE condition;'
      },
      {
        name: 'CRC32',
        title: 'CRC32',
        description: 'A function that calculates the cyclic redundancy check value of a string.',
        example: 'SELECT CRC32(string) FROM table_name;'
      },
      {
        name: 'CREATE_ASYMMETRIC_PRIV_KEY',
        title: 'CREATE_ASYMMETRIC_PRIV_KEY',
        description: 'A function that creates an asymmetric private key.',
        example: 'CREATE_ASYMMETRIC_PRIV_KEY();'
      },
      {
        name: 'CREATE_ASYMMETRIC_PUB_KEY',
        title: 'CREATE_ASYMMETRIC_PUB_KEY',
        description: 'A function that creates an asymmetric public key.',
        example: 'CREATE_ASYMMETRIC_PUB_KEY();'
      },
      {
        name: 'CREATE_DH_PARAMETERS',
        title: 'CREATE_DH_PARAMETERS',
        description: 'A function that creates parameters for the Diffie-Hellman key exchange.',
        example: 'CREATE_DH_PARAMETERS();'
      },
      {
        name: 'CREATE_DIGEST',
        title: 'CREATE_DIGEST',
        description: 'A function that creates a digest hash value.',
        example: 'CREATE_DIGEST(string);'
      },
      {
        name: 'Crosses',
        title: 'Crosses',
        description: 'A spatial relation function that tests if two geometries cross each other.',
        example: 'SELECT * FROM table_name WHERE Crosses(geometry_column1, geometry_column2);'
      },
      {
        name: 'CUME_DIST',
        title: 'CUME_DIST',
        description: 'A window function that calculates the cumulative distribution of a value within a group of rows.',
        example: 'SELECT CUME_DIST() OVER (PARTITION BY column_name ORDER BY value) FROM table_name;'
      },
      {
        name: 'CURDATE',
        title: 'CURDATE',
        description: 'A function that returns the current date.',
        example: 'SELECT CURDATE();'
      },
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE',
        description: 'A function that returns the current date.',
        example: 'SELECT CURRENT_DATE();'
      },
      {
        name: 'CURRENT_ROLE',
        title: 'CURRENT_ROLE',
        description: 'A function that returns the current active role name.',
        example: 'SELECT CURRENT_ROLE();'
      },
      {
        name: 'CURRENT_TIME',
        title: 'CURRENT_TIME',
        description: 'A function that returns the current time.',
        example: 'SELECT CURRENT_TIME();'
      },
      {
        name: 'CURRENT_TIMESTAMP',
        title: 'CURRENT_TIMESTAMP',
        description: 'A function that returns the current date and time.',
        example: 'SELECT CURRENT_TIMESTAMP();'
      },
      {
        name: 'CURRENT_USER',
        title: 'CURRENT_USER',
        description: 'A function that returns the current user name and host.',
        example: 'SELECT CURRENT_USER();'
      },
      {
        name: 'CURTIME',
        title: 'CURTIME',
        description: 'A function that returns the current time.',
        example: 'SELECT CURTIME();'
      },
      {
        name: 'DATABASE',
        title: 'DATABASE',
        description: 'A function that returns the current database name.',
        example: 'SELECT DATABASE();'
      },
      {
        name: 'DATE',
        title: 'DATE',
        description: 'A function that extracts the date part from a datetime expression.',
        example: 'SELECT DATE(datetime_column) FROM table_name;'
      },
      {
        name: 'DATE_ADD',
        title: 'DATE_ADD',
        description: 'A function that adds a specified time interval to a date.',
        example: 'SELECT DATE_ADD(date, INTERVAL 1 DAY) FROM table_name;'
      },
      {
        name: 'DATE_FORMAT',
        title: 'DATE_FORMAT',
        description: 'A function that formats a date as a string.',
        example: "SELECT DATE_FORMAT(date, '%Y-%m-%d') FROM table_name;"
      },
      {
        name: 'DATE_SUB',
        title: 'DATE_SUB',
        description: 'A function that subtracts a specified time interval from a date.',
        example: 'SELECT DATE_SUB(date, INTERVAL 1 MONTH) FROM table_name;'
      },
      {
        name: 'DATEDIFF',
        title: 'DATEDIFF',
        description: 'A function that calculates the number of days between two dates.',
        example: 'SELECT DATEDIFF(end_date, start_date) FROM table_name;'
      },
      {
        name: 'DAY',
        title: 'DAY',
        description: 'A function that extracts the day of the month from a date.',
        example: 'SELECT DAY(date_column) FROM table_name;'
      },
      {
        name: 'DAYNAME',
        title: 'DAYNAME',
        description: 'A function that returns the name of the day of the week.',
        example: 'SELECT DAYNAME(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFMONTH',
        title: 'DAYOFMONTH',
        description: 'A function that returns the day of the month as a number.',
        example: 'SELECT DAYOFMONTH(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFWEEK',
        title: 'DAYOFWEEK',
        description: 'A function that returns the day of the week as a number.',
        example: 'SELECT DAYOFWEEK(date_column) FROM table_name;'
      },
      {
        name: 'DAYOFYEAR',
        title: 'DAYOFYEAR',
        description: 'A function that returns the day of the year as a number.',
        example: 'SELECT DAYOFYEAR(date_column) FROM table_name;'
      },
      {
        name: 'DECODE',
        title: 'DECODE',
        description: 'A function that decodes a string.',
        example: "SELECT DECODE(encoded_string, 'key') FROM table_name;"
      },
      {
        name: 'DEFAULT',
        title: 'DEFAULT',
        description: 'A keyword that sets a column to its default value.',
        example: 'INSERT INTO table_name (column1, column2) VALUES (value1, DEFAULT);'
      },
      {
        name: 'DEGREES',
        title: 'DEGREES',
        description: 'A function that converts radians to degrees.',
        example: 'SELECT DEGREES(radian_value) FROM table_name;'
      },
      {
        name: 'DES_DECRYPT',
        title: 'DES_DECRYPT',
        description: 'A function that decrypts a string using DES algorithm.',
        example: "SELECT DES_DECRYPT(cipher_text, 'key') FROM table_name;"
      },
      {
        name: 'DES_ENCRYPT',
        title: 'DES_ENCRYPT',
        description: 'A function that encrypts a string using DES algorithm.',
        example: "SELECT DES_ENCRYPT(plain_text, 'key') FROM table_name;"
      },
      {
        name: 'DENSE_RANK',
        title: 'DENSE_RANK',
        description: 'A window function that assigns a unique rank to each distinct row within a result set.',
        example: 'SELECT DENSE_RANK() OVER (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'Dimension',
        title: 'Dimension',
        description: 'A function that returns the dimension value of a geometry.',
        example: 'SELECT Dimension(geometry_column) FROM table_name;'
      },
      {
        name: 'Disjoint',
        title: 'Disjoint',
        description: 'A spatial relation function that tests if two geometries are disjoint.',
        example: 'SELECT * FROM table_name WHERE Disjoint(geometry_column1, geometry_column2);'
      },
      {
        name: 'Distance',
        title: 'Distance',
        description: 'A function that returns the distance between two geometries.',
        example: 'SELECT Distance(geometry_column1, geometry_column2) FROM table_name;'
      },
      {
        name: 'ELT',
        title: 'ELT',
        description: 'A function that returns the Nth substring from a comma-separated list of strings.',
        example: "SELECT ELT(N, 'string1,string2,string3,...') FROM table_name;"
      },
      {
        name: 'ENCODE',
        title: 'ENCODE',
        description: 'A function that encodes a string.',
        example: "SELECT ENCODE(plain_string, 'key') FROM table_name;"
      },
      {
        name: 'ENCRYPT',
        title: 'ENCRYPT',
        description: 'A function that encrypts a string.',
        example: "SELECT ENCRYPT(plain_string, 'key') FROM table_name;"
      },
      {
        name: 'EndPoint',
        title: 'EndPoint',
        description: 'A function that returns the last point of a LineString or a Curve.',
        example: 'SELECT EndPoint(geometry_column) FROM table_name;'
      },
      {
        name: 'Envelope',
        title: 'Envelope',
        description: 'A function that returns the minimum bounding box of a geometry.',
        example: 'SELECT Envelope(geometry_column) FROM table_name;'
      },
      {
        name: 'Equals',
        title: 'Equals',
        description: 'A spatial relation function that tests if two geometries are equal.',
        example: 'SELECT * FROM table_name WHERE Equals(geometry_column1, geometry_column2);'
      },
      {
        name: 'EXP',
        title: 'EXP',
        description: 'A function that returns the value of e raised to the power of a specified number.',
        example: 'SELECT EXP(number) FROM table_name;'
      },
      {
        name: 'EXPORT_SET',
        title: 'EXPORT_SET',
        description: 'A function that returns a string containing the set of numeric or string values.',
        example: 'SELECT EXPORT_SET(bits, on, off, separator, width) FROM table_name;'
      },
      {
        name: 'ExteriorRing',
        title: 'ExteriorRing',
        description: 'A function that returns the exterior ring of a Polygon or a CurvePolygon.',
        example: 'SELECT ExteriorRing(geometry_column) FROM table_name;'
      },
      {
        name: 'EXTRACT',
        title: 'EXTRACT',
        description: 'A function that extracts a part from a date or time.',
        example: 'SELECT EXTRACT(unit FROM datetime_expression) FROM table_name;'
      },
      {
        name: 'ExtractValue',
        title: 'ExtractValue',
        description: 'A function that extracts XML value.',
        example: 'SELECT ExtractValue(xml_column, xpath) FROM table_name;'
      },
      {
        name: 'FIELD',
        title: 'FIELD',
        description: 'A function that returns the index (position) of a string in a comma-separated list of strings.',
        example: "SELECT FIELD(string, 'str1,str2,str3,...') FROM table_name;"
      },
      {
        name: 'FIND_IN_SET',
        title: 'FIND_IN_SET',
        description: 'A function that returns the position of a string in a comma-separated list of strings.',
        example: "SELECT FIND_IN_SET(string, 'str1,str2,str3,...') FROM table_name;"
      },
      {
        name: 'FIRST_VALUE',
        title: 'FIRST_VALUE',
        description: 'A window function that returns the first value within a result set.',
        example: 'SELECT FIRST_VALUE(column_name) OVER (ORDER BY order_column) FROM table_name;'
      },
      {
        name: 'FLOOR',
        title: 'FLOOR',
        description: 'A function that rounds a number down to the nearest integer.',
        example: 'SELECT FLOOR(number) FROM table_name;'
      },
      {
        name: 'FORMAT',
        title: 'FORMAT',
        description: 'A function that formats a number with a specific number of decimals and a locale.',
        example: 'SELECT FORMAT(number, decimals, locale) FROM table_name;'
      },
      {
        name: 'FORMAT_BYTES',
        title: 'FORMAT_BYTES',
        description: 'A function that formats a number of bytes in human-readable format.',
        example: 'SELECT FORMAT_BYTES(number) FROM table_name;'
      },
      {
        name: 'FORMAT_PICO_TIME',
        title: 'FORMAT_PICO_TIME',
        description: 'A function that formats a number of picoseconds in human-readable format.',
        example: 'SELECT FORMAT_PICO_TIME(pico_seconds) FROM table_name;'
      },
      {
        name: 'FOUND_ROWS',
        title: 'FOUND_ROWS',
        description: 'A function that returns the number of rows affected by the last INSERT, UPDATE, or DELETE statement.',
        example: 'SELECT FOUND_ROWS() FROM table_name;'
      },
      {
        name: 'FROM_BASE64',
        title: 'FROM_BASE64',
        description: 'A function that decodes a BASE64 encoded string.',
        example: 'SELECT FROM_BASE64(base64_string) FROM table_name;'
      },
      {
        name: 'FROM_DAYS',
        title: 'FROM_DAYS',
        description: 'A function that converts a day number to a date.',
        example: 'SELECT FROM_DAYS(day_number) FROM table_name;'
      },
      {
        name: 'FROM_UNIXTIME',
        title: 'FROM_UNIXTIME',
        description: 'A function that converts a UNIX timestamp to a date.',
        example: 'SELECT FROM_UNIXTIME(unix_timestamp) FROM table_name;'
      },
      {
        name: 'GEN_RANGE',
        title: 'GEN_RANGE',
        description: 'A function that generates a sequence of numbers.',
        example: 'SELECT * FROM GEN_RANGE(start, end, step);'
      },
      {
        name: 'GEN_RND_EMAIL',
        title: 'GEN_RND_EMAIL',
        description: 'A function that generates a random email address.',
        example: 'SELECT GEN_RND_EMAIL() FROM table_name;'
      },
      {
        name: 'GEN_RND_PAN',
        title: 'GEN_RND_PAN',
        description: 'A function that generates a random Primary Account Number (PAN) for credit cards.',
        example: 'SELECT GEN_RND_PAN() FROM table_name;'
      },
      {
        name: 'GEN_RND_SSN',
        title: 'GEN_RND_SSN',
        description: 'A function that generates a random Social Security Number (SSN).',
        example: 'SELECT GEN_RND_SSN() FROM table_name;'
      },
      {
        name: 'GEN_RND_US_PHONE',
        title: 'GEN_RND_US_PHONE',
        description: 'A function that generates a random US phone number.',
        example: 'SELECT GEN_RND_US_PHONE() FROM table_name;'
      },
      {
        name: 'GeomCollection',
        title: 'GeomCollection',
        description: 'A function that returns a geometry collection from a Well-Known Text (WKT) representation.',
        example: 'SELECT GeomCollection(WKT) FROM table_name;'
      },
      {
        name: 'GeomCollFromText',
        title: 'GeomCollFromText',
        description: 'A function that returns a geometry collection from a Well-Known Text (WKT) representation.',
        example: 'SELECT GeomCollFromText(WKT) FROM table_name;'
      },
      {
        name: 'GeometryCollectionFromText',
        title: 'GeometryCollectionFromText',
        description: 'A function that returns a geometry collection from a Well-Known Text (WKT) representation.',
        example: 'SELECT GeometryCollectionFromText(WKT) FROM table_name;'
      },
      {
        name: 'GeomCollFromWKB',
        title: 'GeomCollFromWKB',
        description: 'A function that returns a geometry collection from a Well-Known Binary (WKB) representation.',
        example: 'SELECT GeomCollFromWKB(WKB) FROM table_name;'
      },
      {
        name: 'GeometryCollectionFromWKB',
        title: 'GeometryCollectionFromWKB',
        description: 'A function that returns a geometry collection from a Well-Known Binary (WKB) representation.',
        example: 'SELECT GeometryCollectionFromWKB(WKB) FROM table_name;'
      },
      {
        name: 'GeometryCollection',
        title: 'GeometryCollection',
        description: 'A function that returns a geometry collection from a Well-Known Text (WKT) representation.',
        example: 'SELECT GeometryCollection(WKT) FROM table_name;'
      },
      {
        name: 'GeometryN',
        title: 'GeometryN',
        description: 'A function that returns the Nth geometry from a geometry collection.',
        example: 'SELECT GeometryN(geometry_collection, n) FROM table_name;'
      },
      {
        name: 'GeometryType',
        title: 'GeometryType',
        description: 'A function that returns the geometry type of a geometry.',
        example: 'SELECT GeometryType(geometry_column) FROM table_name;'
      },
      {
        name: 'GeomFromText',
        title: 'GeomFromText',
        description: 'A function that returns a geometry from a Well-Known Text (WKT) representation.',
        example: 'SELECT GeomFromText(WKT) FROM table_name;'
      },
      {
        name: 'GeometryFromText',
        title: 'GeometryFromText',
        description: 'A function that returns a geometry from a Well-Known Text (WKT) representation.',
        example: 'SELECT GeometryFromText(WKT) FROM table_name;'
      },
      {
        name: 'GeomFromWKB',
        title: 'GeomFromWKB',
        description: 'A function that returns a geometry from a Well-Known Binary (WKB) representation.',
        example: 'SELECT GeomFromWKB(WKB) FROM table_name;'
      },
      {
        name: 'GeometryFromWKB',
        title: 'GeometryFromWKB',
        description: 'A function that returns a geometry from a Well-Known Binary (WKB) representation.',
        example: 'SELECT GeometryFromWKB(WKB) FROM table_name;'
      },
      {
        name: 'GET_FORMAT',
        title: 'GET_FORMAT',
        description: 'A function that returns the date format specifier for a given date part.',
        example: 'SELECT GET_FORMAT(date_part, locale) FROM table_name;'
      },
      {
        name: 'GET_LOCK',
        title: 'GET_LOCK',
        description: 'A function that requests a named lock with a timeout.',
        example: "SELECT GET_LOCK('lock_name', timeout) FROM table_name;"
      },
      {
        name: 'GLength',
        title: 'GLength',
        description: 'A function that returns the length of a LineString or a Curve.',
        example: 'SELECT GLength(geometry_column) FROM table_name;'
      },
      {
        name: 'GREATEST',
        title: 'GREATEST',
        description: 'A function that returns the largest (maximum) value from a list of expressions.',
        example: 'SELECT GREATEST(value1, value2, value3, ...) FROM table_name;'
      },
      {
        name: 'GROUP_CONCAT',
        title: 'GROUP_CONCAT',
        description: 'An aggregate function that concatenates strings from a group into a single string.',
        example: 'SELECT GROUP_CONCAT(column_name) FROM table_name GROUP BY group_column;'
      },
      {
        name: 'GROUPING',
        title: 'GROUPING',
        description: 'A function that indicates whether a specified column is aggregated or not.',
        example: 'SELECT column_name, GROUPING(column_name) FROM table_name GROUP BY column_name;'
      },
      {
        name: 'GTID_SUBSET',
        title: 'GTID_SUBSET',
        description: 'A function that tests whether a set of GTIDs is a subset of another set of GTIDs.',
        example: 'SELECT GTID_SUBSET(source_set, target_set);'
      },
      {
        name: 'GTID_SUBTRACT',
        title: 'GTID_SUBTRACT',
        description: 'A function that returns the difference between two sets of GTIDs.',
        example: 'SELECT GTID_SUBTRACT(minuend_set, subtrahend_set);'
      },
      {
        name: 'HEX',
        title: 'HEX',
        description: 'A function that returns a hexadecimal string representation of a number or a string.',
        example: 'SELECT HEX(value) FROM table_name;'
      },
      {
        name: 'HOUR',
        title: 'HOUR',
        description: 'A function that returns the hour from a time or datetime expression.',
        example: 'SELECT HOUR(time_column) FROM table_name;'
      },
      {
        name: 'ICU_VERSION',
        title: 'ICU_VERSION',
        description: 'A function that returns the version of the International Components for Unicode (ICU) library.',
        example: 'SELECT ICU_VERSION() FROM table_name;'
      },
      {
        name: 'IF',
        title: 'IF',
        description: 'A function that returns a value based on a condition.',
        example: 'SELECT IF(condition, true_value, false_value) FROM table_name;'
      },
      {
        name: 'IFNULL',
        title: 'IFNULL',
        description: 'A function that returns the first non-null expression among the arguments.',
        example: 'SELECT IFNULL(column_name, replacement_value) FROM table_name;'
      },
      {
        name: 'INET_ATON',
        title: 'INET_ATON',
        description: 'A function that converts an IPv4 address from its text representation to a numeric value.',
        example: 'SELECT INET_ATON(ipv4_address) FROM table_name;'
      },
      {
        name: 'INET_NTOA',
        title: 'INET_NTOA',
        description: 'A function that converts a numeric IPv4 address to its text representation.',
        example: 'SELECT INET_NTOA(numeric_ipv4_address) FROM table_name;'
      },
      {
        name: 'INET6_ATON',
        title: 'INET6_ATON',
        description: 'A function that converts an IPv6 address from its text representation to a binary value.',
        example: 'SELECT INET6_ATON(ipv6_address) FROM table_name;'
      },
      {
        name: 'INET6_NTOA',
        title: 'INET6_NTOA',
        description: 'A function that converts a binary IPv6 address to its text representation.',
        example: 'SELECT INET6_NTOA(binary_ipv6_address) FROM table_name;'
      },
      {
        name: 'INSERT',
        title: 'INSERT',
        description: 'A function that inserts a substring into a string.',
        example: 'SELECT INSERT(string, start_position, length, new_substring) FROM table_name;'
      },
      {
        name: 'INSTR',
        title: 'INSTR',
        description: 'A function that returns the position of a substring within a string.',
        example: 'SELECT INSTR(string, substring) FROM table_name;'
      },
      {
        name: 'InteriorRingN',
        title: 'InteriorRingN',
        description: 'A function that returns the Nth interior ring of a Polygon or MultiPolygon.',
        example: 'SELECT InteriorRingN(polygon_or_multipolygon, n) FROM table_name;'
      },
      {
        name: 'Intersects',
        title: 'Intersects',
        description: 'A function that tests whether two geometries intersect.',
        example: 'SELECT Intersects(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'INTERVAL',
        title: 'INTERVAL',
        description: 'A function that creates an interval of time.',
        example: 'SELECT INTERVAL value unit FROM table_name;'
      },
      {
        name: 'IS_FREE_LOCK',
        title: 'IS_FREE_LOCK',
        description: 'A function that checks if a named lock is free.',
        example: "SELECT IS_FREE_LOCK('lock_name') FROM table_name;"
      },
      {
        name: 'IS_IPV4',
        title: 'IS_IPV4',
        description: 'A function that tests whether an IPv4 address is valid.',
        example: 'SELECT IS_IPV4(ipv4_address) FROM table_name;'
      },
      {
        name: 'IS_IPV4_COMPAT',
        title: 'IS_IPV4_COMPAT',
        description: 'A function that tests whether an IPv6 address is IPv4-compatible.',
        example: 'SELECT IS_IPV4_COMPAT(ipv6_address) FROM table_name;'
      },
      {
        name: 'IS_IPV4_MAPPED',
        title: 'IS_IPV4_MAPPED',
        description: 'A function that tests whether an IPv6 address is IPv4-mapped.',
        example: 'SELECT IS_IPV4_MAPPED(ipv6_address) FROM table_name;'
      },
      {
        name: 'IS_IPV6',
        title: 'IS_IPV6',
        description: 'A function that tests whether an IPv6 address is valid.',
        example: 'SELECT IS_IPV6(ipv6_address) FROM table_name;'
      },
      {
        name: 'IS_USED_LOCK',
        title: 'IS_USED_LOCK',
        description: 'A function that checks if a named lock is in use.',
        example: "SELECT IS_USED_LOCK('lock_name') FROM table_name;"
      },
      {
        name: 'IS_UUID',
        title: 'IS_UUID',
        description: 'A function that tests whether a string is a valid UUID.',
        example: 'SELECT IS_UUID(uuid_string) FROM table_name;'
      },
      {
        name: 'IsClosed',
        title: 'IsClosed',
        description: 'A function that tests whether a LineString is closed.',
        example: 'SELECT IsClosed(line_string) FROM table_name;'
      },
      {
        name: 'IsEmpty',
        title: 'IsEmpty',
        description: 'A function that tests whether a geometry is an empty geometry.',
        example: 'SELECT IsEmpty(geometry) FROM table_name;'
      },
      {
        name: 'ISNULL',
        title: 'ISNULL',
        description: 'A function that returns the first non-null expression among the arguments.',
        example: 'SELECT ISNULL(column_name, replacement_value) FROM table_name;'
      },
      {
        name: 'IsSimple',
        title: 'IsSimple',
        description: 'A function that tests whether a geometry is simple (non-self-intersecting).',
        example: 'SELECT IsSimple(geometry) FROM table_name;'
      },
      {
        name: 'JSON_APPEND',
        title: 'JSON_APPEND',
        description: 'A function that appends values to a JSON document.',
        example: 'SELECT JSON_APPEND(json_doc, path, value1, value2, ...) FROM table_name;'
      },
      {
        name: 'JSON_ARRAY',
        title: 'JSON_ARRAY',
        description: 'A function that creates a JSON array.',
        example: 'SELECT JSON_ARRAY(value1, value2, ...) FROM table_name;'
      },
      {
        name: 'JSON_ARRAY_APPEND',
        title: 'JSON_ARRAY_APPEND',
        description: 'A function that appends values to a JSON array within a JSON document.',
        example: 'SELECT JSON_ARRAY_APPEND(json_doc, path, value1, value2, ...) FROM table_name;'
      },
      {
        name: 'JSON_ARRAY_INSERT',
        title: 'JSON_ARRAY_INSERT',
        description: 'A function that inserts values into a JSON array within a JSON document.',
        example: 'SELECT JSON_ARRAY_INSERT(json_doc, path, value1, value2, ...) FROM table_name;'
      },
      {
        name: 'JSON_ARRAYAGG',
        title: 'JSON_ARRAYAGG',
        description: 'A function that aggregates values into a JSON array.',
        example: 'SELECT JSON_ARRAYAGG(value) FROM table_name;'
      },
      {
        name: 'JSON_CONTAINS',
        title: 'JSON_CONTAINS',
        description: 'A function that checks if a JSON document contains a specific value or a path exists within it.',
        example: 'SELECT JSON_CONTAINS(json_doc, value_or_path) FROM table_name;'
      },
      {
        name: 'JSON_CONTAINS_PATH',
        title: 'JSON_CONTAINS_PATH',
        description: 'A function that checks if a JSON document contains a specific path.',
        example: 'SELECT JSON_CONTAINS_PATH(json_doc, one_or_all, path) FROM table_name;'
      },
      {
        name: 'JSON_DEPTH',
        title: 'JSON_DEPTH',
        description: 'A function that returns the maximum depth of a JSON document.',
        example: 'SELECT JSON_DEPTH(json_doc) FROM table_name;'
      },
      {
        name: 'JSON_EXTRACT',
        title: 'JSON_EXTRACT',
        description: 'A function that extracts data from a JSON document.',
        example: 'SELECT JSON_EXTRACT(json_doc, path) FROM table_name;'
      },
      {
        name: 'JSON_INSERT',
        title: 'JSON_INSERT',
        description: 'A function that inserts data into a JSON document.',
        example: 'SELECT JSON_INSERT(json_doc, path, value) FROM table_name;'
      },
      {
        name: 'JSON_KEYS',
        title: 'JSON_KEYS',
        description: 'A function that returns the keys from the top-level of a JSON document.',
        example: 'SELECT JSON_KEYS(json_doc) FROM table_name;'
      },
      {
        name: 'JSON_LENGTH',
        title: 'JSON_LENGTH',
        description: 'A function that returns the length of a JSON document.',
        example: 'SELECT JSON_LENGTH(json_doc) FROM table_name;'
      },
      {
        name: 'JSON_MERGE',
        title: 'JSON_MERGE',
        description: 'A function that merges two or more JSON documents.',
        example: 'SELECT JSON_MERGE(json_doc1, json_doc2, ...) FROM table_name;'
      },
      {
        name: 'JSON_MERGE_PATCH',
        title: 'JSON_MERGE_PATCH',
        description: 'A function that applies a JSON document as a patch to another JSON document.',
        example: 'SELECT JSON_MERGE_PATCH(json_doc1, json_doc2) FROM table_name;'
      },
      {
        name: 'JSON_MERGE_PRESERVE',
        title: 'JSON_MERGE_PRESERVE',
        description: 'A function that merges two or more JSON documents, preserving elements of the first document when conflicts occur.',
        example: 'SELECT JSON_MERGE_PRESERVE(json_doc1, json_doc2, ...) FROM table_name;'
      },
      {
        name: 'JSON_OBJECT',
        title: 'JSON_OBJECT',
        description: 'A function that creates a JSON object.',
        example: 'SELECT JSON_OBJECT(key1, value1, key2, value2, ...) FROM table_name;'
      },
      {
        name: 'JSON_OBJECTAGG',
        title: 'JSON_OBJECTAGG',
        description: 'A function that aggregates key/value pairs into a JSON object.',
        example: 'SELECT JSON_OBJECTAGG(key, value) FROM table_name;'
      },
      {
        name: 'JSON_OVERLAPS',
        title: 'JSON_OVERLAPS',
        description: 'A function that checks if two JSON documents have any key-value pairs in common.',
        example: 'SELECT JSON_OVERLAPS(json_doc1, json_doc2) FROM table_name;'
      },
      {
        name: 'JSON_PRETTY',
        title: 'JSON_PRETTY',
        description: 'A function that returns a JSON document formatted for readability.',
        example: 'SELECT JSON_PRETTY(json_doc) FROM table_name;'
      },
      {
        name: 'JSON_QUOTE',
        title: 'JSON_QUOTE',
        description: 'A function that quotes a string as a JSON value.',
        example: 'SELECT JSON_QUOTE(string) FROM table_name;'
      },
      {
        name: 'JSON_REMOVE',
        title: 'JSON_REMOVE',
        description: 'A function that removes data from a JSON document.',
        example: 'SELECT JSON_REMOVE(json_doc, path) FROM table_name;'
      },
      {
        name: 'JSON_REPLACE',
        title: 'JSON_REPLACE',
        description: 'A function that replaces data in a JSON document.',
        example: 'SELECT JSON_REPLACE(json_doc, path, new_value) FROM table_name;'
      },
      {
        name: 'JSON_SCHEMA_VALID',
        title: 'JSON_SCHEMA_VALID',
        description: 'A function that checks if a JSON document is valid against a specified JSON schema.',
        example: 'SELECT JSON_SCHEMA_VALID(json_doc, json_schema) FROM table_name;'
      },
      {
        name: 'JSON_SCHEMA_VALIDATION_REPORT',
        title: 'JSON_SCHEMA_VALIDATION_REPORT',
        description: 'A function that returns the validation report of a JSON document against a specified JSON schema.',
        example: 'SELECT JSON_SCHEMA_VALIDATION_REPORT(json_doc, json_schema) FROM table_name;'
      },
      {
        name: 'JSON_SEARCH',
        title: 'JSON_SEARCH',
        description: 'A function that searches a JSON document for a value and returns the path to that value.',
        example: 'SELECT JSON_SEARCH(json_doc, one_or_all, search_value) FROM table_name;'
      },
      {
        name: 'JSON_SET',
        title: 'JSON_SET',
        description: 'A function that sets data in a JSON document.',
        example: 'SELECT JSON_SET(json_doc, path, new_value) FROM table_name;'
      },
      {
        name: 'JSON_STORAGE_FREE',
        title: 'JSON_STORAGE_FREE',
        description: 'A function that returns the number of bytes that can be reclaimed by running the OPTIMIZE TABLE command on a table with JSON columns.',
        example: 'SELECT JSON_STORAGE_FREE() FROM table_name;'
      },
      {
        name: 'JSON_STORAGE_SIZE',
        title: 'JSON_STORAGE_SIZE',
        description: 'A function that returns the size (in bytes) of the JSON columns in a table.',
        example: 'SELECT JSON_STORAGE_SIZE() FROM table_name;'
      },
      {
        name: 'JSON_TABLE',
        title: 'JSON_TABLE',
        description: 'A function that returns a relational view of a JSON document.',
        example: 'SELECT * FROM JSON_TABLE(json_doc, path_or_expr, columns) AS alias;'
      },
      {
        name: 'JSON_TYPE',
        title: 'JSON_TYPE',
        description: 'A function that returns the type of a JSON value.',
        example: 'SELECT JSON_TYPE(json_value) FROM table_name;'
      },
      {
        name: 'JSON_UNQUOTE',
        title: 'JSON_UNQUOTE',
        description: 'A function that removes quotes from a JSON value and returns it as a string.',
        example: 'SELECT JSON_UNQUOTE(json_value) FROM table_name;'
      },
      {
        name: 'JSON_VALID',
        title: 'JSON_VALID',
        description: 'A function that checks if a JSON document is valid.',
        example: 'SELECT JSON_VALID(json_doc) FROM table_name;'
      },
      {
        name: 'LAG',
        title: 'LAG',
        description: 'A function that provides access to a row at a specified physical offset prior to the current row within the result set.',
        example: 'SELECT LAG(column_name, offset, default_value) OVER (PARTITION BY partition_expr ORDER BY order_expr) FROM table_name;'
      },
      {
        name: 'LAST_DAY',
        title: 'LAST_DAY',
        description: 'A function that returns the last day of the month for a given date.',
        example: 'SELECT LAST_DAY(date) FROM table_name;'
      },
      {
        name: 'LAST_INSERT_ID',
        title: 'LAST_INSERT_ID',
        description: 'A function that returns the last automatically generated ID in the current session.',
        example: 'SELECT LAST_INSERT_ID() FROM table_name;'
      },
      {
        name: 'LAST_VALUE',
        title: 'LAST_VALUE',
        description: 'A function that provides access to a row at a specified physical offset following the current row within the result set.',
        example: 'SELECT LAST_VALUE(column_name) OVER (PARTITION BY partition_expr ORDER BY order_expr) FROM table_name;'
      },
      {
        name: 'LCASE',
        title: 'LCASE',
        description: 'A function that converts a string to lowercase.',
        example: 'SELECT LCASE(string) FROM table_name;'
      },
      {
        name: 'LEAD',
        title: 'LEAD',
        description: 'A function that provides access to a row at a specified physical offset following the current row within the result set.',
        example: 'SELECT LEAD(column_name, offset, default_value) OVER (PARTITION BY partition_expr ORDER BY order_expr) FROM table_name;'
      },
      {
        name: 'LEAST',
        title: 'LEAST',
        description: 'A function that returns the smallest (minimum) value among the arguments.',
        example: 'SELECT LEAST(value1, value2, ...) FROM table_name;'
      },
      {
        name: 'LEFT',
        title: 'LEFT',
        description: 'A function that returns a specified number of characters from the left of a string.',
        example: 'SELECT LEFT(string, length) FROM table_name;'
      },
      {
        name: 'LENGTH',
        title: 'LENGTH',
        description: 'A function that returns the length (number of characters) of a string.',
        example: 'SELECT LENGTH(string) FROM table_name;'
      },
      {
        name: 'LineFromText',
        title: 'LineFromText',
        description: 'A function that creates a LineString from its Well-Known Text (WKT) representation.',
        example: 'SELECT LineFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'LineStringFromText',
        title: 'LineStringFromText',
        description: 'A function that creates a LineString from its Well-Known Text (WKT) representation.',
        example: 'SELECT LineStringFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'LineFromWKB',
        title: 'LineFromWKB',
        description: 'A function that creates a LineString from its Well-Known Binary (WKB) representation.',
        example: 'SELECT LineFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'LineStringFromWKB',
        title: 'LineStringFromWKB',
        description: 'A function that creates a LineString from its Well-Known Binary (WKB) representation.',
        example: 'SELECT LineStringFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'LineString',
        title: 'LineString',
        description: 'A function that creates a LineString from its coordinates.',
        example: 'SELECT LineString(point1, point2, ...) FROM table_name;'
      },
      {
        name: 'LN',
        title: 'LN',
        description: 'A function that returns the natural logarithm of a number.',
        example: 'SELECT LN(number) FROM table_name;'
      },
      {
        name: 'LOAD_FILE',
        title: 'LOAD_FILE',
        description: 'A function that reads the contents of a file and returns it as a string.',
        example: 'SELECT LOAD_FILE(file_path) FROM table_name;'
      },
      {
        name: 'LOCALTIME',
        title: 'LOCALTIME',
        description: 'A function that returns the current time in the local time zone.',
        example: 'SELECT LOCALTIME() FROM table_name;'
      },
      {
        name: 'LOCALTIMESTAMP',
        title: 'LOCALTIMESTAMP',
        description: 'A function that returns the current date and time in the local time zone.',
        example: 'SELECT LOCALTIMESTAMP() FROM table_name;'
      },
      {
        name: 'LOCATE',
        title: 'LOCATE',
        description: 'A function that searches for a substring within a string and returns its position.',
        example: 'SELECT LOCATE(substring, string) FROM table_name;'
      },
      {
        name: 'LOG',
        title: 'LOG',
        description: 'A function that returns the natural logarithm of a number to a specified base.',
        example: 'SELECT LOG(base, number) FROM table_name;'
      },
      {
        name: 'LOG10',
        title: 'LOG10',
        description: 'A function that returns the base-10 logarithm of a number.',
        example: 'SELECT LOG10(number) FROM table_name;'
      },
      {
        name: 'LOG2',
        title: 'LOG2',
        description: 'A function that returns the base-2 logarithm of a number.',
        example: 'SELECT LOG2(number) FROM table_name;'
      },
      {
        name: 'LOWER',
        title: 'LOWER',
        description: 'A function that converts a string to lowercase.',
        example: 'SELECT LOWER(string) FROM table_name;'
      },
      {
        name: 'LPAD',
        title: 'LPAD',
        description: 'A function that pads a string to the left with a specified string to a certain length.',
        example: 'SELECT LPAD(string, length, pad_string) FROM table_name;'
      },
      {
        name: 'LTRIM',
        title: 'LTRIM',
        description: 'A function that removes leading spaces from a string.',
        example: 'SELECT LTRIM(string) FROM table_name;'
      },
      {
        name: 'MAKE_SET',
        title: 'MAKE_SET',
        description: 'A function that returns a set value as a comma-separated string of names.',
        example: 'SELECT MAKE_SET(bits, value1, value2, ...) FROM table_name;'
      },
      {
        name: 'MAKEDATE',
        title: 'MAKEDATE',
        description: 'A function that returns a date from the year and day-of-year values.',
        example: 'SELECT MAKEDATE(year, day_of_year) FROM table_name;'
      },
      {
        name: 'MAKETIME',
        title: 'MAKETIME',
        description: 'A function that returns a time from the hour, minute, and second values.',
        example: 'SELECT MAKETIME(hour, minute, second) FROM table_name;'
      },
      {
        name: 'MASK_INNER',
        title: 'MASK_INNER',
        description: 'A function that masks the inner part of a string, leaving only the first and last characters.',
        example: 'SELECT MASK_INNER(string, mask_character) FROM table_name;'
      },
      {
        name: 'MASK_OUTER',
        title: 'MASK_OUTER',
        description: 'A function that masks the outer part of a string, leaving only the first and last characters.',
        example: 'SELECT MASK_OUTER(string, mask_character) FROM table_name;'
      },
      {
        name: 'MASK_PAN',
        title: 'MASK_PAN',
        description: 'A function that masks all but the last four characters of a credit card number (PAN).',
        example: 'SELECT MASK_PAN(credit_card_number) FROM table_name;'
      },
      {
        name: 'MASK_PAN_RELAXED',
        title: 'MASK_PAN_RELAXED',
        description: 'A function that masks all but the first six and last four characters of a credit card number (PAN).',
        example: 'SELECT MASK_PAN_RELAXED(credit_card_number) FROM table_name;'
      },
      {
        name: 'MASK_SSN',
        title: 'MASK_SSN',
        description: 'A function that masks all but the last four characters of a Social Security Number (SSN).',
        example: 'SELECT MASK_SSN(ssn) FROM table_name;'
      },
      {
        name: 'MASTER_POS_WAIT',
        title: 'MASTER_POS_WAIT',
        description: 'A function that waits until the slave has read and applied all updates up to the specified replication position.',
        example: 'SELECT MASTER_POS_WAIT(master_log_file, master_log_pos, timeout) FROM table_name;'
      },
      {
        name: 'MAX',
        title: 'MAX',
        description: 'A function that returns the maximum value in a set of values.',
        example: 'SELECT MAX(column_name) FROM table_name;'
      },
      {
        name: 'MBRContains',
        title: 'MBRContains',
        description: 'A function that tests whether a MultiPolygon contains a geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRContains(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBRCoveredBy',
        title: 'MBRCoveredBy',
        description: 'A function that tests whether a MultiPolygon is covered by another geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRCoveredBy(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBRCovers',
        title: 'MBRCovers',
        description: 'A function that tests whether a MultiPolygon covers another geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRCovers(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBRDisjoint',
        title: 'MBRDisjoint',
        description: 'A function that tests whether a MultiPolygon and another geometry are disjoint (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRDisjoint(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBREqual',
        title: 'MBREqual',
        description: 'A function that tests whether a MultiPolygon and another geometry are equal (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBREqual(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBREquals',
        title: 'MBREquals',
        description: 'A function that tests whether a MultiPolygon and another geometry are equal (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBREquals(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBRIntersects',
        title: 'MBRIntersects',
        description: 'A function that tests whether a MultiPolygon intersects with another geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRIntersects(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBROverlaps',
        title: 'MBROverlaps',
        description: 'A function that tests whether a MultiPolygon overlaps with another geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBROverlaps(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBRTouches',
        title: 'MBRTouches',
        description: 'A function that tests whether a MultiPolygon touches another geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRTouches(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MBRWithin',
        title: 'MBRWithin',
        description: 'A function that tests whether a MultiPolygon is within another geometry (MBR - Minimum Bounding Rectangle).',
        example: 'SELECT MBRWithin(multipolygon, geometry) FROM table_name;'
      },
      {
        name: 'MD5',
        title: 'MD5',
        description: 'A function that calculates the MD5 hash value of a string.',
        example: 'SELECT MD5(string) FROM table_name;'
      },
      {
        name: 'MEMBER OF',
        title: 'MEMBER OF',
        description: 'A predicate that tests whether a value is a member of a set.',
        example: 'SELECT column_name FROM table_name WHERE value MEMBER OF (value1, value2, ...);'
      },
      {
        name: 'MICROSECOND',
        title: 'MICROSECOND',
        description: 'A function that returns the microseconds from a time or datetime expression.',
        example: 'SELECT MICROSECOND(time_column) FROM table_name;'
      },
      {
        name: 'MID',
        title: 'MID',
        description: 'A function that returns a substring from a string, starting at a specified position and with a specified length.',
        example: 'SELECT MID(string, start_position, length) FROM table_name;'
      },
      {
        name: 'MIN',
        title: 'MIN',
        description: 'A function that returns the minimum value in a set of values.',
        example: 'SELECT MIN(column_name) FROM table_name;'
      },
      {
        name: 'MINUTE',
        title: 'MINUTE',
        description: 'A function that returns the minute from a time or datetime expression.',
        example: 'SELECT MINUTE(time_column) FROM table_name;'
      },
      {
        name: 'MONTH',
        title: 'MONTH',
        description: 'A function that returns the month from a date or datetime expression.',
        example: 'SELECT MONTH(date_column) FROM table_name;'
      },
      {
        name: 'MONTHNAME',
        title: 'MONTHNAME',
        description: 'A function that returns the name of the month from a date or datetime expression.',
        example: 'SELECT MONTHNAME(date_column) FROM table_name;'
      },
      {
        name: 'MPointFromText',
        title: 'MPointFromText',
        description: 'A function that creates a MultiPoint from its Well-Known Text (WKT) representation.',
        example: 'SELECT MPointFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'MultiPointFromText',
        title: 'MultiPointFromText',
        description: 'A function that creates a MultiPoint from its Well-Known Text (WKT) representation.',
        example: 'SELECT MultiPointFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'MPointFromWKB',
        title: 'MPointFromWKB',
        description: 'A function that creates a MultiPoint from its Well-Known Binary (WKB) representation.',
        example: 'SELECT MPointFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'MultiPointFromWKB',
        title: 'MultiPointFromWKB',
        description: 'A function that creates a MultiPoint from its Well-Known Binary (WKB) representation.',
        example: 'SELECT MultiPointFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'MPolyFromText',
        title: 'MPolyFromText',
        description: 'A function that creates a MultiPolygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT MPolyFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'MultiPolygonFromText',
        title: 'MultiPolygonFromText',
        description: 'A function that creates a MultiPolygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT MultiPolygonFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'MPolyFromWKB',
        title: 'MPolyFromWKB',
        description: 'A function that creates a MultiPolygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT MPolyFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'MultiPolygonFromWKB',
        title: 'MultiPolygonFromWKB',
        description: 'A function that creates a MultiPolygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT MultiPolygonFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'MultiLineString',
        title: 'MultiLineString',
        description: 'A function that creates a MultiLineString from its LineString components.',
        example: 'SELECT MultiLineString(LineString1, LineString2, ...) FROM table_name;'
      },
      {
        name: 'MultiPoint',
        title: 'MultiPoint',
        description: 'A function that creates a MultiPoint from its Point components.',
        example: 'SELECT MultiPoint(Point1, Point2, ...) FROM table_name;'
      },
      {
        name: 'MultiPolygon',
        title: 'MultiPolygon',
        description: 'A function that creates a MultiPolygon from its Polygon components.',
        example: 'SELECT MultiPolygon(Polygon1, Polygon2, ...) FROM table_name;'
      },
      {
        name: 'NAME_CONST',
        title: 'NAME_CONST',
        description: 'A function that returns a constant value with a specified name.',
        example: "SELECT NAME_CONST('name', value) FROM table_name;"
      },
      {
        name: 'NOT IN',
        title: 'NOT IN',
        description: 'A predicate that tests whether a value is not in a set of values.',
        example: 'SELECT column_name FROM table_name WHERE value NOT IN (value1, value2, ...);'
      },
      {
        name: 'NOW',
        title: 'NOW',
        description: 'A function that returns the current date and time.',
        example: 'SELECT NOW() FROM table_name;'
      },
      {
        name: 'NTH_VALUE',
        title: 'NTH_VALUE',
        description: 'A function that provides access to a value from a specified physical offset within the result set.',
        example: 'SELECT NTH_VALUE(column_name, n) OVER (PARTITION BY partition_expr ORDER BY order_expr) FROM table_name;'
      },
      {
        name: 'NTILE',
        title: 'NTILE',
        description: 'A function that assigns a bucket number to each row within a result set.',
        example: 'SELECT NTILE(bucket_count) OVER (PARTITION BY partition_expr ORDER BY order_expr) FROM table_name;'
      },
      {
        name: 'NULLIF',
        title: 'NULLIF',
        description: 'A function that returns NULL if two expressions are equal; otherwise, it returns the first expression.',
        example: 'SELECT NULLIF(expression1, expression2) FROM table_name;'
      },
      {
        name: 'NumGeometries',
        title: 'NumGeometries',
        description: 'A function that returns the number of geometries in a geometry collection.',
        example: 'SELECT NumGeometries(geometry_collection) FROM table_name;'
      },
      {
        name: 'NumInteriorRings',
        title: 'NumInteriorRings',
        description: 'A function that returns the number of interior rings in a polygon.',
        example: 'SELECT NumInteriorRings(polygon) FROM table_name;'
      },
      {
        name: 'NumPoints',
        title: 'NumPoints',
        description: 'A function that returns the number of points in a geometry.',
        example: 'SELECT NumPoints(geometry) FROM table_name;'
      },
      {
        name: 'OCT',
        title: 'OCT',
        description: 'A function that converts a number to its octal representation.',
        example: 'SELECT OCT(number) FROM table_name;'
      },
      {
        name: 'OCTET_LENGTH',
        title: 'OCTET_LENGTH',
        description: 'A function that returns the length of a string in bytes.',
        example: 'SELECT OCTET_LENGTH(string) FROM table_name;'
      },
      {
        name: 'OLD_PASSWORD',
        title: 'OLD_PASSWORD',
        description: 'A function that calculates the password hash for pre-4.1 versions of MySQL.',
        example: "SELECT OLD_PASSWORD('password') FROM table_name;"
      },
      {
        name: 'ORD',
        title: 'ORD',
        description: 'A function that returns the Unicode code point value of the leftmost character of a string.',
        example: 'SELECT ORD(string) FROM table_name;'
      },
      {
        name: 'Overlaps',
        title: 'Overlaps',
        description: 'A function that tests whether two geometries overlap.',
        example: 'SELECT Overlaps(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'PASSWORD',
        title: 'PASSWORD',
        description: 'A function that calculates the password hash for MySQL user accounts.',
        example: "SELECT PASSWORD('your_password') FROM mysql.user;"
      },
      {
        name: 'PERCENT_RANK',
        title: 'PERCENT_RANK',
        description: 'A window function that calculates the percent rank of a row within a result set.',
        example: 'SELECT column_name, PERCENT_RANK() OVER (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'PERIOD_ADD',
        title: 'PERIOD_ADD',
        description: 'A function that adds a specified number of months to a period in the format YYMM.',
        example: 'SELECT PERIOD_ADD(period_column, number_of_months) FROM table_name;'
      },
      {
        name: 'PERIOD_DIFF',
        title: 'PERIOD_DIFF',
        description: 'A function that calculates the number of months between two periods in the format YYMM.',
        example: 'SELECT PERIOD_DIFF(period_column1, period_column2) FROM table_name;'
      },
      {
        name: 'PI',
        title: 'PI',
        description: 'A constant that represents the mathematical constant pi (π).',
        example: 'SELECT PI() FROM table_name;'
      },
      {
        name: 'Point',
        title: 'Point',
        description: 'A function that creates a Point from its coordinates.',
        example: 'SELECT Point(x, y) FROM table_name;'
      },
      {
        name: 'PointFromText',
        title: 'PointFromText',
        description: 'A function that creates a Point from its Well-Known Text (WKT) representation.',
        example: 'SELECT PointFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'PointFromWKB',
        title: 'PointFromWKB',
        description: 'A function that creates a Point from its Well-Known Binary (WKB) representation.',
        example: 'SELECT PointFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'PointN',
        title: 'PointN',
        description: 'A function that returns the N-th point from a MultiPoint geometry.',
        example: 'SELECT PointN(multipoint_geometry, n) FROM table_name;'
      },
      {
        name: 'PolyFromText',
        title: 'PolyFromText',
        description: 'A function that creates a Polygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT PolyFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'PolygonFromText',
        title: 'PolygonFromText',
        description: 'A function that creates a Polygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT PolygonFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'PolyFromWKB',
        title: 'PolyFromWKB',
        description: 'A function that creates a Polygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT PolyFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'PolygonFromWKB',
        title: 'PolygonFromWKB',
        description: 'A function that creates a Polygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT PolygonFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'Polygon',
        title: 'Polygon',
        description: 'A function that creates a Polygon from its coordinates.',
        example: 'SELECT Polygon((x1, y1), (x2, y2), ...) FROM table_name;'
      },
      {
        name: 'POSITION',
        title: 'POSITION',
        description: 'A function that returns the position of a substring within a string.',
        example: 'SELECT POSITION(substring IN string) FROM table_name;'
      },
      {
        name: 'POW',
        title: 'POW',
        description: 'A function that raises a number to the power of another number.',
        example: 'SELECT POW(base, exponent) FROM table_name;'
      },
      {
        name: 'POWER',
        title: 'POWER',
        description: 'An alternative name for the POW function that raises a number to the power of another number.',
        example: 'SELECT POWER(base, exponent) FROM table_name;'
      },
      {
        name: 'PS_CURRENT_THREAD_ID',
        title: 'PS_CURRENT_THREAD_ID',
        description: 'A function that returns the ID of the current Performance Schema thread.',
        example: 'SELECT PS_CURRENT_THREAD_ID() FROM table_name;'
      },
      {
        name: 'PS_THREAD_ID',
        title: 'PS_THREAD_ID',
        description: 'A function that returns the ID of a specified thread from the Performance Schema.',
        example: 'SELECT PS_THREAD_ID(thread_name) FROM table_name;'
      },
      {
        name: 'PROCEDURE ANALYSE',
        title: 'PROCEDURE ANALYSE',
        description: 'A function that analyzes the result of a SELECT statement and suggests optimal data types for the columns.',
        example: 'SELECT * FROM table_name PROCEDURE ANALYSE();'
      },
      {
        name: 'QUARTER',
        title: 'QUARTER',
        description: 'A function that returns the quarter (1 to 4) of a date.',
        example: 'SELECT QUARTER(date_column) FROM table_name;'
      },
      {
        name: 'QUOTE',
        title: 'QUOTE',
        description: 'A function that adds quotation marks around a string and escapes special characters.',
        example: 'SELECT QUOTE(string) FROM table_name;'
      },
      {
        name: 'RADIANS',
        title: 'RADIANS',
        description: 'A function that converts degrees to radians.',
        example: 'SELECT RADIANS(degrees) FROM table_name;'
      },
      {
        name: 'RAND',
        title: 'RAND',
        description: 'A function that returns a random floating-point value between 0 and 1.',
        example: 'SELECT RAND() FROM table_name;'
      },
      {
        name: 'RANDOM_BYTES',
        title: 'RANDOM_BYTES',
        description: 'A function that generates random bytes.',
        example: 'SELECT RANDOM_BYTES(num_bytes) FROM table_name;'
      },
      {
        name: 'RANK',
        title: 'RANK',
        description: 'A function that assigns a rank to each row within a result set, with ties receiving the same rank.',
        example: 'SELECT RANK() OVER (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'REGEXP_INSTR',
        title: 'REGEXP_INSTR',
        description: 'A function that searches for a regular expression pattern within a string and returns the position of the first match.',
        example: 'SELECT REGEXP_INSTR(string, pattern) FROM table_name;'
      },
      {
        name: 'REGEXP_LIKE',
        title: 'REGEXP_LIKE',
        description: 'A function that tests whether a string matches a regular expression pattern.',
        example: 'SELECT REGEXP_LIKE(string, pattern) FROM table_name;'
      },
      {
        name: 'REGEXP_REPLACE',
        title: 'REGEXP_REPLACE',
        description: 'A function that searches for a regular expression pattern within a string and replaces it with another string.',
        example: 'SELECT REGEXP_REPLACE(string, pattern, replacement) FROM table_name;'
      },
      {
        name: 'REGEXP_REPLACE',
        title: 'REGEXP_REPLACE',
        description:
          'An alternative name for the REGEXP_REPLACE function that searches for a regular expression pattern within a string and replaces it with another string.',
        example: 'SELECT REGEXP_REPLACE(string, pattern, replacement) FROM table_name;'
      },
      {
        name: 'RELEASE_ALL_LOCKS',
        title: 'RELEASE_ALL_LOCKS',
        description: 'A function that releases all named locks held by the current session.',
        example: 'SELECT RELEASE_ALL_LOCKS() FROM table_name;'
      },
      {
        name: 'RELEASE_LOCK',
        title: 'RELEASE_LOCK',
        description: 'A function that releases a named lock held by the current session.',
        example: "SELECT RELEASE_LOCK('lock_name') FROM table_name;"
      },
      {
        name: 'REPEAT',
        title: 'REPEAT',
        description: 'A function that repeats a string a specified number of times.',
        example: 'SELECT REPEAT(string, num_times) FROM table_name;'
      },
      {
        name: 'REPLACE',
        title: 'REPLACE',
        description: 'A function that replaces all occurrences of a substring in a string with another substring.',
        example: 'SELECT REPLACE(string, search_string, replacement_string) FROM table_name;'
      },
      {
        name: 'REVERSE',
        title: 'REVERSE',
        description: 'A function that reverses the characters in a string.',
        example: 'SELECT REVERSE(string) FROM table_name;'
      },
      {
        name: 'RIGHT',
        title: 'RIGHT',
        description: 'A function that returns the rightmost characters of a string.',
        example: 'SELECT RIGHT(string, num_chars) FROM table_name;'
      },
      {
        name: 'ROLES_GRAPHML',
        title: 'ROLES_GRAPHML',
        description: 'A function that returns role hierarchy in GraphML format.',
        example: 'SELECT ROLES_GRAPHML() FROM table_name;'
      },
      {
        name: 'ROUND',
        title: 'ROUND',
        description: 'A function that rounds a number to a specified number of decimal places.',
        example: 'SELECT ROUND(number, num_decimal_places) FROM table_name;'
      },
      {
        name: 'ROW_COUNT',
        title: 'ROW_COUNT',
        description: 'A function that returns the number of rows affected by the last INSERT, UPDATE, or DELETE statement.',
        example: 'SELECT ROW_COUNT() FROM table_name;'
      },
      {
        name: 'ROW_NUMBER',
        title: 'ROW_NUMBER',
        description: 'A window function that assigns a unique sequential integer to each row within a result set.',
        example: 'SELECT ROW_NUMBER() OVER (ORDER BY column_name) FROM table_name;'
      },
      {
        name: 'RPAD',
        title: 'RPAD',
        description: 'A function that pads a string to a specified length on the right with a specified string.',
        example: 'SELECT RPAD(string, length, pad_string) FROM table_name;'
      },
      {
        name: 'RTRIM',
        title: 'RTRIM',
        description: 'A function that removes trailing spaces from a string.',
        example: 'SELECT RTRIM(string) FROM table_name;'
      },
      {
        name: 'SCHEMA',
        title: 'SCHEMA',
        description: 'A function that returns the default schema (database) name of the current user.',
        example: 'SELECT SCHEMA() FROM table_name;'
      },
      {
        name: 'SEC_TO_TIME',
        title: 'SEC_TO_TIME',
        description: 'A function that converts a number of seconds to a time value in the format HH:MM:SS.',
        example: 'SELECT SEC_TO_TIME(seconds) FROM table_name;'
      },
      {
        name: 'SECOND',
        title: 'SECOND',
        description: 'A function that returns the second (0 to 59) of a time value.',
        example: 'SELECT SECOND(time_column) FROM table_name;'
      },
      {
        name: 'SESSION_USER',
        title: 'SESSION_USER',
        description: 'A function that returns the current user name and host.',
        example: 'SELECT SESSION_USER() FROM table_name;'
      },
      {
        name: 'SHA1',
        title: 'SHA1',
        description: 'A function that calculates the SHA-1 hash of a string.',
        example: 'SELECT SHA1(string) FROM table_name;'
      },
      {
        name: 'SHA',
        title: 'SHA',
        description: 'An alternative name for the SHA1 function that calculates the SHA-1 hash of a string.',
        example: 'SELECT SHA(string) FROM table_name;'
      },
      {
        name: 'SHA2',
        title: 'SHA2',
        description: 'A function that calculates the SHA-2 hash of a string with a specified bit length (224, 256, 384, or 512).',
        example: 'SELECT SHA2(string, bit_length) FROM table_name;'
      },
      {
        name: 'SIGN',
        title: 'SIGN',
        description: 'A function that returns the sign of a number (-1 for negative, 0 for zero, 1 for positive).',
        example: 'SELECT SIGN(number) FROM table_name;'
      },
      {
        name: 'SIN',
        title: 'SIN',
        description: 'A function that returns the sine of an angle in radians.',
        example: 'SELECT SIN(angle) FROM table_name;'
      },
      {
        name: 'SLEEP',
        title: 'SLEEP',
        description: 'A function that causes the current thread to sleep for a specified number of seconds.',
        example: 'SELECT SLEEP(seconds) FROM table_name;'
      },
      {
        name: 'SOUNDEX',
        title: 'SOUNDEX',
        description: 'A function that calculates the Soundex code of a string.',
        example: 'SELECT SOUNDEX(string) FROM table_name;'
      },
      {
        name: 'SOURCE_POS_WAIT',
        title: 'SOURCE_POS_WAIT',
        description: 'A function that waits for the replication source to reach a specified position.',
        example: 'SELECT SOURCE_POS_WAIT(source, log_name, log_position, timeout) FROM table_name;'
      },
      {
        name: 'SPACE',
        title: 'SPACE',
        description: 'A function that returns a string consisting of a specified number of space characters.',
        example: 'SELECT SPACE(number_of_spaces) FROM table_name;'
      },
      {
        name: 'SQRT',
        title: 'SQRT',
        description: 'A function that returns the square root of a non-negative number.',
        example: 'SELECT SQRT(number) FROM table_name;'
      },
      {
        name: 'SRID',
        title: 'SRID',
        description: 'A function that returns the Spatial Reference ID (SRID) of a geometry.',
        example: 'SELECT SRID(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Area',
        title: 'ST_Area',
        description: 'A function that returns the area of a geometry.',
        example: 'SELECT ST_Area(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_AsBinary',
        title: 'ST_AsBinary',
        description: 'A function that converts a geometry to its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_AsBinary(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_AsWKB',
        title: 'ST_AsWKB',
        description: 'A function that converts a geometry to its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_AsWKB(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_AsGeoJSON',
        title: 'ST_AsGeoJSON',
        description: 'A function that converts a geometry to its GeoJSON representation.',
        example: 'SELECT ST_AsGeoJSON(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_AsText',
        title: 'ST_AsText',
        description: 'A function that converts a geometry to its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_AsText(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_AsWKT',
        title: 'ST_AsWKT',
        description: 'A function that converts a geometry to its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_AsWKT(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Buffer',
        title: 'ST_Buffer',
        description: 'A function that returns a geometry that represents a buffer zone around a geometry.',
        example: 'SELECT ST_Buffer(geometry_column, buffer_distance) FROM table_name;'
      },
      {
        name: 'ST_Buffer_Strategy',
        title: 'ST_Buffer_Strategy',
        description: 'A function that returns a geometry that represents a buffer zone around a geometry using a specified buffer strategy.',
        example: 'SELECT ST_Buffer_Strategy(geometry_column, buffer_distance, buffer_strategy) FROM table_name;'
      },
      {
        name: 'ST_Centroid',
        title: 'ST_Centroid',
        description: 'A function that returns the centroid of a geometry.',
        example: 'SELECT ST_Centroid(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Collect',
        title: 'ST_Collect',
        description: 'A function that aggregates geometries into a single GeometryCollection.',
        example: 'SELECT ST_Collect(geometry_column) FROM table_name GROUP BY group_column;'
      },
      {
        name: 'ST_Contains',
        title: 'ST_Contains',
        description: 'A function that tests whether one geometry contains another geometry.',
        example: 'SELECT ST_Contains(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_ConvexHull',
        title: 'ST_ConvexHull',
        description: 'A function that returns the convex hull of a geometry.',
        example: 'SELECT ST_ConvexHull(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Crosses',
        title: 'ST_Crosses',
        description: 'A function that tests whether two geometries cross each other.',
        example: 'SELECT ST_Crosses(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Difference',
        title: 'ST_Difference',
        description: 'A function that returns a geometry that represents the difference between two geometries.',
        example: 'SELECT ST_Difference(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Dimension',
        title: 'ST_Dimension',
        description: 'A function that returns the topological dimension of a geometry (0 for points, 1 for curves, 2 for surfaces).',
        example: 'SELECT ST_Dimension(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Disjoint',
        title: 'ST_Disjoint',
        description: 'A function that tests whether two geometries are disjoint (have no points in common).',
        example: 'SELECT ST_Disjoint(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Distance',
        title: 'ST_Distance',
        description: 'A function that returns the distance between two geometries.',
        example: 'SELECT ST_Distance(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Distance_Sphere',
        title: 'ST_Distance_Sphere',
        description: 'A function that returns the distance between two geometries on a sphere using the Haversine formula.',
        example: 'SELECT ST_Distance_Sphere(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_EndPoint',
        title: 'ST_EndPoint',
        description: 'A function that returns the last point of a LineString or CircularString.',
        example: 'SELECT ST_EndPoint(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Envelope',
        title: 'ST_Envelope',
        description: 'A function that returns the minimum bounding rectangle (envelope) of a geometry.',
        example: 'SELECT ST_Envelope(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Equals',
        title: 'ST_Equals',
        description: 'A function that tests whether two geometries are equal (have the same shape and coordinates).',
        example: 'SELECT ST_Equals(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_ExteriorRing',
        title: 'ST_ExteriorRing',
        description: 'A function that returns the exterior ring of a Polygon or CircularString.',
        example: 'SELECT ST_ExteriorRing(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_FrechetDistance',
        title: 'ST_FrechetDistance',
        description: 'A function that returns the Frechet distance between two geometries.',
        example: 'SELECT ST_FrechetDistance(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_GeoHash',
        title: 'ST_GeoHash',
        description: 'A function that returns the GeoHash representation of a geometry.',
        example: 'SELECT ST_GeoHash(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_GeomCollFromText',
        title: 'ST_GeomCollFromText',
        description: 'A function that creates a GeometryCollection from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_GeomCollFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_GeometryCollectionFromText',
        title: 'ST_GeometryCollectionFromText',
        description: 'A function that creates a GeometryCollection from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_GeometryCollectionFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_GeomCollFromTxt',
        title: 'ST_GeomCollFromTxt',
        description:
          'An alternative name for the ST_GeomCollFromText function that creates a GeometryCollection from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_GeomCollFromTxt(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_GeomCollFromWKB',
        title: 'ST_GeomCollFromWKB',
        description: 'A function that creates a GeometryCollection from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_GeomCollFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_GeometryCollectionFromWKB',
        title: 'ST_GeometryCollectionFromWKB',
        description: 'A function that creates a GeometryCollection from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_GeometryCollectionFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_GeometryN',
        title: 'ST_GeometryN',
        description: 'A function that returns the N-th geometry from a GeometryCollection.',
        example: 'SELECT ST_GeometryN(geometry_collection, n) FROM table_name;'
      },
      {
        name: 'ST_GeometryType',
        title: 'ST_GeometryType',
        description: "A function that returns the type of a geometry as a string (e.g., 'POINT', 'LINESTRING', 'POLYGON').",
        example: 'SELECT ST_GeometryType(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_GeomFromGeoJSON',
        title: 'ST_GeomFromGeoJSON',
        description: 'A function that creates a geometry from its GeoJSON representation.',
        example: 'SELECT ST_GeomFromGeoJSON(geojson_string) FROM table_name;'
      },
      {
        name: 'ST_GeomFromText',
        title: 'ST_GeomFromText',
        description: 'A function that creates a geometry from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_GeomFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_GeometryFromText',
        title: 'ST_GeometryFromText',
        description: 'A function that creates a geometry from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_GeometryFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_GeomFromWKB',
        title: 'ST_GeomFromWKB',
        description: 'A function that creates a geometry from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_GeomFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_GeometryFromWKB',
        title: 'ST_GeometryFromWKB',
        description: 'A function that creates a geometry from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_GeometryFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_HausdorffDistance',
        title: 'ST_HausdorffDistance',
        description: 'A function that returns the Hausdorff distance between two geometries.',
        example: 'SELECT ST_HausdorffDistance(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_InteriorRingN',
        title: 'ST_InteriorRingN',
        description: 'A function that returns the N-th interior ring of a Polygon.',
        example: 'SELECT ST_InteriorRingN(polygon_geometry, n) FROM table_name;'
      },
      {
        name: 'ST_Intersection',
        title: 'ST_Intersection',
        description: 'A function that returns the intersection of two geometries.',
        example: 'SELECT ST_Intersection(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Intersects',
        title: 'ST_Intersects',
        description: 'A function that tests whether two geometries intersect.',
        example: 'SELECT ST_Intersects(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_IsClosed',
        title: 'ST_IsClosed',
        description: 'A function that tests whether a LineString or CircularString is closed (starts and ends at the same point).',
        example: 'SELECT ST_IsClosed(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_IsEmpty',
        title: 'ST_IsEmpty',
        description: 'A function that tests whether a geometry is empty (has no points).',
        example: 'SELECT ST_IsEmpty(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_IsSimple',
        title: 'ST_IsSimple',
        description: 'A function that tests whether a geometry is simple (has no self-intersections).',
        example: 'SELECT ST_IsSimple(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_IsValid',
        title: 'ST_IsValid',
        description: 'A function that tests whether a geometry is valid according to its type.',
        example: 'SELECT ST_IsValid(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_LatFromGeoHash',
        title: 'ST_LatFromGeoHash',
        description: 'A function that returns the latitude of a GeoHash.',
        example: 'SELECT ST_LatFromGeoHash(geohash) FROM table_name;'
      },
      {
        name: 'ST_Length',
        title: 'ST_Length',
        description: 'A function that returns the length of a LineString or CircularString.',
        example: 'SELECT ST_Length(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_LineFromText',
        title: 'ST_LineFromText',
        description: 'A function that creates a LineString from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_LineFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_LineStringFromText',
        title: 'ST_LineStringFromText',
        description: 'A function that creates a LineString from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_LineStringFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_LineFromWKB',
        title: 'ST_LineFromWKB',
        description: 'A function that creates a LineString from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_LineFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_LineStringFromWKB',
        title: 'ST_LineStringFromWKB',
        description: 'A function that creates a LineString from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_LineStringFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_LineInterpolatePoint',
        title: 'ST_LineInterpolatePoint',
        description: 'A function that returns a point on a LineString or CircularString at a given fraction of its total length.',
        example: 'SELECT ST_LineInterpolatePoint(geometry_column, fraction) FROM table_name;'
      },
      {
        name: 'ST_LineInterpolatePoints',
        title: 'ST_LineInterpolatePoints',
        description: 'A function that returns multiple points on a LineString or CircularString at given fractions of its total length.',
        example: 'SELECT ST_LineInterpolatePoints(geometry_column, fractions_array) FROM table_name;'
      },
      {
        name: 'ST_LongFromGeoHash',
        title: 'ST_LongFromGeoHash',
        description: 'A function that returns the longitude of a GeoHash.',
        example: 'SELECT ST_LongFromGeoHash(geohash) FROM table_name;'
      },
      {
        name: 'ST_Longitude',
        title: 'ST_Longitude',
        description: 'A function that returns the longitude of a Point.',
        example: 'SELECT ST_Longitude(point_geometry) FROM table_name;'
      },
      {
        name: 'ST_MakeEnvelope',
        title: 'ST_MakeEnvelope',
        description: 'A function that creates a Polygon in the form of an axis-aligned bounding box.',
        example: 'SELECT ST_MakeEnvelope(min_x, min_y, max_x, max_y, srid) FROM table_name;'
      },
      {
        name: 'ST_MLineFromText',
        title: 'ST_MLineFromText',
        description: 'A function that creates a MultiLineString from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_MLineFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_MultiLineStringFromText',
        title: 'ST_MultiLineStringFromText',
        description: 'A function that creates a MultiLineString from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_MultiLineStringFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_MLineFromWKB',
        title: 'ST_MLineFromWKB',
        description: 'A function that creates a MultiLineString from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_MLineFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_MultiLineStringFromWKB',
        title: 'ST_MultiLineStringFromWKB',
        description: 'A function that creates a MultiLineString from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_MultiLineStringFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_MPointFromText',
        title: 'ST_MPointFromText',
        description: 'A function that creates a MultiPoint from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_MPointFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_MultiPointFromText',
        title: 'ST_MultiPointFromText',
        description: 'A function that creates a MultiPoint from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_MultiPointFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_MPointFromWKB',
        title: 'ST_MPointFromWKB',
        description: 'A function that creates a MultiPoint from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_MPointFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_MultiPointFromWKB',
        title: 'ST_MultiPointFromWKB',
        description: 'A function that creates a MultiPoint from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_MultiPointFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_MPolyFromText',
        title: 'ST_MPolyFromText',
        description: 'A function that creates a MultiPolygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_MPolyFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_MultiPolygonFromText',
        title: 'ST_MultiPolygonFromText',
        description: 'A function that creates a MultiPolygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_MultiPolygonFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_MPolyFromWKB',
        title: 'ST_MPolyFromWKB',
        description: 'A function that creates a MultiPolygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_MPolyFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_MultiPolygonFromWKB',
        title: 'ST_MultiPolygonFromWKB',
        description: 'A function that creates a MultiPolygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_MultiPolygonFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_NumGeometries',
        title: 'ST_NumGeometries',
        description: 'A function that returns the number of geometries in a GeometryCollection.',
        example: 'SELECT ST_NumGeometries(geometry_collection) FROM table_name;'
      },
      {
        name: 'ST_NumInteriorRing',
        title: 'ST_NumInteriorRing',
        description: 'A function that returns the number of interior rings in a Polygon.',
        example: 'SELECT ST_NumInteriorRing(polygon_geometry) FROM table_name;'
      },
      {
        name: 'ST_NumInteriorRings',
        title: 'ST_NumInteriorRings',
        description: 'An alternative name for the ST_NumInteriorRing function that returns the number of interior rings in a Polygon.',
        example: 'SELECT ST_NumInteriorRings(polygon_geometry) FROM table_name;'
      },
      {
        name: 'ST_NumPoints',
        title: 'ST_NumPoints',
        description: 'A function that returns the number of points in a geometry.',
        example: 'SELECT ST_NumPoints(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Overlaps',
        title: 'ST_Overlaps',
        description: 'A function that tests whether two geometries spatially overlap.',
        example: 'SELECT ST_Overlaps(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_PointAtDistance',
        title: 'ST_PointAtDistance',
        description: 'A function that returns a point at a specified distance and bearing from a reference point.',
        example: 'SELECT ST_PointAtDistance(reference_point, distance, bearing) FROM table_name;'
      },
      {
        name: 'ST_PointFromGeoHash',
        title: 'ST_PointFromGeoHash',
        description: 'A function that creates a Point from its GeoHash representation.',
        example: 'SELECT ST_PointFromGeoHash(geohash) FROM table_name;'
      },
      {
        name: 'ST_PointFromText',
        title: 'ST_PointFromText',
        description: 'A function that creates a Point from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_PointFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_PointFromWKB',
        title: 'ST_PointFromWKB',
        description: 'A function that creates a Point from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_PointFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_PointN',
        title: 'ST_PointN',
        description: 'A function that returns the N-th point in a LineString or CircularString.',
        example: 'SELECT ST_PointN(geometry_column, n) FROM table_name;'
      },
      {
        name: 'ST_PolyFromText',
        title: 'ST_PolyFromText',
        description: 'A function that creates a Polygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_PolyFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_PolygonFromText',
        title: 'ST_PolygonFromText',
        description: 'A function that creates a Polygon from its Well-Known Text (WKT) representation.',
        example: 'SELECT ST_PolygonFromText(wkt_string) FROM table_name;'
      },
      {
        name: 'ST_PolyFromWKB',
        title: 'ST_PolyFromWKB',
        description: 'A function that creates a Polygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_PolyFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_PolygonFromWKB',
        title: 'ST_PolygonFromWKB',
        description: 'A function that creates a Polygon from its Well-Known Binary (WKB) representation.',
        example: 'SELECT ST_PolygonFromWKB(wkb_data) FROM table_name;'
      },
      {
        name: 'ST_Simplify',
        title: 'ST_Simplify',
        description: 'A function that reduces the number of vertices in a geometry while preserving its shape.',
        example: 'SELECT ST_Simplify(geometry_column, tolerance) FROM table_name;'
      },
      {
        name: 'ST_SRID',
        title: 'ST_SRID',
        description: 'A function that returns the Spatial Reference ID (SRID) of a geometry.',
        example: 'SELECT ST_SRID(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_StartPoint',
        title: 'ST_StartPoint',
        description: 'A function that returns the first point of a LineString or CircularString.',
        example: 'SELECT ST_StartPoint(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_SwapXY',
        title: 'ST_SwapXY',
        description: 'A function that swaps the X and Y coordinates of a geometry.',
        example: 'SELECT ST_SwapXY(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_SymDifference',
        title: 'ST_SymDifference',
        description: 'A function that returns a geometry that represents the symmetric difference between two geometries.',
        example: 'SELECT ST_SymDifference(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Touches',
        title: 'ST_Touches',
        description: 'A function that tests whether two geometries touch each other.',
        example: 'SELECT ST_Touches(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Transform',
        title: 'ST_Transform',
        description: 'A function that transforms a geometry to a different Spatial Reference System (SRS) using the specified SRID.',
        example: 'SELECT ST_Transform(geometry_column, target_srid) FROM table_name;'
      },
      {
        name: 'ST_Union',
        title: 'ST_Union',
        description: 'A function that returns the union of two geometries.',
        example: 'SELECT ST_Union(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_Validate',
        title: 'ST_Validate',
        description: 'A function that tests the validity of a geometry and returns the reason if it is invalid.',
        example: 'SELECT ST_Validate(geometry_column) FROM table_name;'
      },
      {
        name: 'ST_Within',
        title: 'ST_Within',
        description: 'A function that tests whether one geometry is within another geometry.',
        example: 'SELECT ST_Within(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'ST_X',
        title: 'ST_X',
        description: 'A function that returns the X (longitude) coordinate of a Point.',
        example: 'SELECT ST_X(point_geometry) FROM table_name;'
      },
      {
        name: 'ST_Y',
        title: 'ST_Y',
        description: 'A function that returns the Y (latitude) coordinate of a Point.',
        example: 'SELECT ST_Y(point_geometry) FROM table_name;'
      },
      {
        name: 'StartPoint',
        title: 'StartPoint',
        description: 'An alternative name for the ST_StartPoint function that returns the first point of a LineString or CircularString.',
        example: 'SELECT StartPoint(geometry_column) FROM table_name;'
      },
      {
        name: 'STATEMENT_DIGEST',
        title: 'STATEMENT_DIGEST',
        description: 'A function that returns the statement digest (hash) for a SQL statement.',
        example: 'SELECT STATEMENT_DIGEST(sql_statement) FROM table_name;'
      },
      {
        name: 'STATEMENT_DIGEST_TEXT',
        title: 'STATEMENT_DIGEST_TEXT',
        description: 'A function that returns the statement digest text for a SQL statement.',
        example: 'SELECT STATEMENT_DIGEST_TEXT(sql_statement) FROM table_name;'
      },
      {
        name: 'STD',
        title: 'STD',
        description: 'A function that returns the standard deviation of a set of numbers.',
        example: 'SELECT STD(value_column) FROM table_name;'
      },
      {
        name: 'STDDEV',
        title: 'STDDEV',
        description: 'A function that returns the standard deviation of a set of numbers.',
        example: 'SELECT STDDEV(value_column) FROM table_name;'
      },
      {
        name: 'STDDEV_POP',
        title: 'STDDEV_POP',
        description: 'A function that returns the population standard deviation of a set of numbers.',
        example: 'SELECT STDDEV_POP(value_column) FROM table_name;'
      },
      {
        name: 'STDDEV_SAMP',
        title: 'STDDEV_SAMP',
        description: 'A function that returns the sample standard deviation of a set of numbers.',
        example: 'SELECT STDDEV_SAMP(value_column) FROM table_name;'
      },
      {
        name: 'STR_TO_DATE',
        title: 'STR_TO_DATE',
        description: 'A function that converts a string to a date using a specified format.',
        example: 'SELECT STR_TO_DATE(date_string, format_string) FROM table_name;'
      },
      {
        name: 'STRCMP',
        title: 'STRCMP',
        description: 'A function that compares two strings and returns a value indicating their relationship.',
        example: 'SELECT STRCMP(string1, string2) FROM table_name;'
      },
      {
        name: 'SUBDATE',
        title: 'SUBDATE',
        description: 'A function that subtracts a specified number of days from a date.',
        example: 'SELECT SUBDATE(date_column, days_to_subtract) FROM table_name;'
      },
      {
        name: 'SUBSTR',
        title: 'SUBSTR',
        description: 'A function that returns a substring from a string starting at a specified position.',
        example: 'SELECT SUBSTR(string_column, start_position) FROM table_name;'
      },
      {
        name: 'SUBSTRING',
        title: 'SUBSTRING',
        description: 'A function that returns a substring from a string starting at a specified position.',
        example: 'SELECT SUBSTRING(string_column, start_position) FROM table_name;'
      },
      {
        name: 'SUBSTRING_INDEX',
        title: 'SUBSTRING_INDEX',
        description: 'A function that returns a substring from a string before a specified number of occurrences of a delimiter.',
        example: 'SELECT SUBSTRING_INDEX(string_column, delimiter, count) FROM table_name;'
      },
      {
        name: 'SUBTIME',
        title: 'SUBTIME',
        description: 'A function that subtracts a time value from a datetime or time value.',
        example: 'SELECT SUBTIME(datetime_column, time_value) FROM table_name;'
      },
      {
        name: 'SUM',
        title: 'SUM',
        description: 'A function that returns the sum of a set of values.',
        example: 'SELECT SUM(value_column) FROM table_name;'
      },
      {
        name: 'SYSDATE',
        title: 'SYSDATE',
        description: 'A function that returns the current date and time.',
        example: 'SELECT SYSDATE() FROM table_name;'
      },
      {
        name: 'SYSTEM_USER',
        title: 'SYSTEM_USER',
        description: 'A function that returns the current user name and host.',
        example: 'SELECT SYSTEM_USER() FROM table_name;'
      },
      {
        name: 'TAN',
        title: 'TAN',
        description: 'A function that returns the tangent of an angle.',
        example: 'SELECT TAN(angle) FROM table_name;'
      },
      {
        name: 'TIME',
        title: 'TIME',
        description: 'A function that represents a time value.',
        example: 'SELECT TIME(hour, minute, second) FROM table_name;'
      },
      {
        name: 'TIME_FORMAT',
        title: 'TIME_FORMAT',
        description: 'A function that formats a time value according to a specified format.',
        example: 'SELECT TIME_FORMAT(time_value, format) FROM table_name;'
      },
      {
        name: 'TIME_TO_SEC',
        title: 'TIME_TO_SEC',
        description: 'A function that converts a time value to seconds.',
        example: 'SELECT TIME_TO_SEC(time_value) FROM table_name;'
      },
      {
        name: 'TIMEDIFF',
        title: 'TIMEDIFF',
        description: 'A function that returns the difference between two time values.',
        example: 'SELECT TIMEDIFF(time1, time2) FROM table_name;'
      },
      {
        name: 'TIMESTAMP',
        title: 'TIMESTAMP',
        description: 'A function that represents a datetime value.',
        example: 'SELECT TIMESTAMP(year, month, day, hour, minute, second) FROM table_name;'
      },
      {
        name: 'TIMESTAMPADD',
        title: 'TIMESTAMPADD',
        description: 'A function that adds an interval to a datetime value.',
        example: 'SELECT TIMESTAMPADD(interval, count, datetime_value) FROM table_name;'
      },
      {
        name: 'TIMESTAMPDIFF',
        title: 'TIMESTAMPDIFF',
        description: 'A function that returns the difference between two datetime values in a specified unit.',
        example: 'SELECT TIMESTAMPDIFF(unit, datetime1, datetime2) FROM table_name;'
      },
      {
        name: 'TO_BASE64',
        title: 'TO_BASE64',
        description: 'A function that converts a string to its Base64 representation.',
        example: 'SELECT TO_BASE64(string_value) FROM table_name;'
      },
      {
        name: 'TO_DAYS',
        title: 'TO_DAYS',
        description: 'A function that converts a date to the number of days since year 0.',
        example: 'SELECT TO_DAYS(date_value) FROM table_name;'
      },
      {
        name: 'TO_SECONDS',
        title: 'TO_SECONDS',
        description: 'A function that converts a datetime to the number of seconds since year 0.',
        example: 'SELECT TO_SECONDS(datetime_value) FROM table_name;'
      },
      {
        name: 'Touches',
        title: 'Touches',
        description: 'A function that tests whether two geometries touch each other.',
        example: 'SELECT Touches(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'TRIM',
        title: 'TRIM',
        description: 'A function that removes leading and trailing spaces or specified characters from a string.',
        example: "SELECT TRIM(both ' ' from string_value) FROM table_name;"
      },
      {
        name: 'TRUNCATE',
        title: 'TRUNCATE',
        description: 'A function that truncates a number to a specified number of decimal places.',
        example: 'SELECT TRUNCATE(number, decimal_places) FROM table_name;'
      },
      {
        name: 'UCASE',
        title: 'UCASE',
        description: 'A function that converts a string to uppercase.',
        example: 'SELECT UCASE(string_value) FROM table_name;'
      },
      {
        name: 'UNCOMPRESS',
        title: 'UNCOMPRESS',
        description: 'A function that decompresses a compressed string.',
        example: 'SELECT UNCOMPRESS(compressed_string) FROM table_name;'
      },
      {
        name: 'UNCOMPRESSED_LENGTH',
        title: 'UNCOMPRESSED_LENGTH',
        description: 'A function that returns the length of a compressed string.',
        example: 'SELECT UNCOMPRESSED_LENGTH(compressed_string) FROM table_name;'
      },
      {
        name: 'UNHEX',
        title: 'UNHEX',
        description: 'A function that converts a hexadecimal string to its binary representation.',
        example: 'SELECT UNHEX(hex_string) FROM table_name;'
      },
      {
        name: 'UNIX_TIMESTAMP',
        title: 'UNIX_TIMESTAMP',
        description: 'A function that returns the number of seconds since the Unix epoch (1970-01-01 00:00:00).',
        example: 'SELECT UNIX_TIMESTAMP() FROM table_name;'
      },
      {
        name: 'UpdateXML',
        title: 'UpdateXML',
        description: 'A function that modifies an XML document and returns the updated document.',
        example: 'SELECT UpdateXML(xml_document, xpath_expression, new_value) FROM table_name;'
      },
      {
        name: 'UPPER',
        title: 'UPPER',
        description: 'A function that converts a string to uppercase.',
        example: 'SELECT UPPER(string_value) FROM table_name;'
      },
      {
        name: 'USER',
        title: 'USER',
        description: 'A function that returns the current MySQL user name and host.',
        example: 'SELECT USER() FROM table_name;'
      },
      {
        name: 'UTC_DATE',
        title: 'UTC_DATE',
        description: 'A function that returns the current UTC date.',
        example: 'SELECT UTC_DATE() FROM table_name;'
      },
      {
        name: 'UTC_TIME',
        title: 'UTC_TIME',
        description: 'A function that returns the current UTC time.',
        example: 'SELECT UTC_TIME() FROM table_name;'
      },
      {
        name: 'UTC_TIMESTAMP',
        title: 'UTC_TIMESTAMP',
        description: 'A function that returns the current UTC date and time.',
        example: 'SELECT UTC_TIMESTAMP() FROM table_name;'
      },
      {
        name: 'UUID',
        title: 'UUID',
        description: 'A function that returns a Universally Unique Identifier (UUID).',
        example: 'SELECT UUID() FROM table_name;'
      },
      {
        name: 'UUID_SHORT',
        title: 'UUID_SHORT',
        description: 'A function that returns a 64-bit UUID.',
        example: 'SELECT UUID_SHORT() FROM table_name;'
      },
      {
        name: 'UUID_TO_BIN',
        title: 'UUID_TO_BIN',
        description: 'A function that converts a UUID to a binary format.',
        example: 'SELECT UUID_TO_BIN(uuid_string) FROM table_name;'
      },
      {
        name: 'VALIDATE_PASSWORD_STRENGTH',
        title: 'VALIDATE_PASSWORD_STRENGTH',
        description: 'A function that validates the strength of a password.',
        example: 'SELECT VALIDATE_PASSWORD_STRENGTH(password) FROM table_name;'
      },
      {
        name: 'VALUES',
        title: 'VALUES',
        description: 'A function that specifies the values to be inserted into a table.',
        example: 'INSERT INTO table_name (column1, column2) VALUES (value1, value2);'
      },
      {
        name: 'VAR_POP',
        title: 'VAR_POP',
        description: 'A function that returns the population variance of a set of values.',
        example: 'SELECT VAR_POP(value_column) FROM table_name;'
      },
      {
        name: 'VAR_SAMP',
        title: 'VAR_SAMP',
        description: 'A function that returns the sample variance of a set of values.',
        example: 'SELECT VAR_SAMP(value_column) FROM table_name;'
      },
      {
        name: 'VARIANCE',
        title: 'VARIANCE',
        description: 'A function that returns the variance of a set of values.',
        example: 'SELECT VARIANCE(value_column) FROM table_name;'
      },
      {
        name: 'VERSION',
        title: 'VERSION',
        description: 'A function that returns the MySQL server version.',
        example: 'SELECT VERSION() FROM table_name;'
      },
      {
        name: 'WAIT_FOR_EXECUTED_GTID_SET',
        title: 'WAIT_FOR_EXECUTED_GTID_SET',
        description: 'A function that waits until all transactions with a given GTID set are executed.',
        example: "WAIT_FOR_EXECUTED_GTID_SET('gtid_set', timeout);"
      },
      {
        name: 'WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS',
        title: 'WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS',
        description: 'A function that waits until the SQL thread has applied the given GTID set.',
        example: "WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('gtid_set', timeout);"
      },
      {
        name: 'WEEK',
        title: 'WEEK',
        description: 'A function that returns the week number for a given date.',
        example: 'SELECT WEEK(date_value) FROM table_name;'
      },
      {
        name: 'WEEKDAY',
        title: 'WEEKDAY',
        description: 'A function that returns the weekday index for a given date.',
        example: 'SELECT WEEKDAY(date_value) FROM table_name;'
      },
      {
        name: 'WEEKOFYEAR',
        title: 'WEEKOFYEAR',
        description: 'A function that returns the week number for a given date.',
        example: 'SELECT WEEKOFYEAR(date_value) FROM table_name;'
      },
      {
        name: 'WEIGHT_STRING',
        title: 'WEIGHT_STRING',
        description: 'A function that returns the weight string for a given string.',
        example: 'SELECT WEIGHT_STRING(string_value) FROM table_name;'
      },
      {
        name: 'Within',
        title: 'Within',
        description: 'A function that tests whether one geometry is within another geometry.',
        example: 'SELECT Within(geometry1, geometry2) FROM table_name;'
      },
      {
        name: 'X',
        title: 'X',
        description: 'A function that returns the X-coordinate of a point.',
        example: 'SELECT X(point_geometry) FROM table_name;'
      },
      {
        name: 'Y',
        title: 'Y',
        description: 'A function that returns the Y-coordinate of a point.',
        example: 'SELECT Y(point_geometry) FROM table_name;'
      },
      {
        name: 'YEAR',
        title: 'YEAR',
        description: 'A function that returns the year part of a date or datetime value.',
        example: 'SELECT YEAR(date_value) FROM table_name;'
      },
      {
        name: 'YEARWEEK',
        title: 'YEARWEEK',
        description: 'A function that returns the year and week for a given date.',
        example: 'SELECT YEARWEEK(date_value) FROM table_name;'
      }
    ],
    Keyword: [
      {
        name: 'SELECT',
        title: 'SELECT',
        description: 'Retrieves data from one or more tables.',
        example: 'SELECT * FROM products;'
      },
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
        name: 'FROM',
        title: 'FROM',
        description: 'Specifies the table from which data is queried.',
        example: 'SELECT * FROM employees;'
      },
      {
        name: 'ACCESSIBLE',
        description: 'Specifies that the user must have the privilege to access the table or column.',
        formula: 'N/A',
        example: 'GRANT SELECT ON table_name TO user_name;'
      },
      {
        name: 'ADD',
        description: 'Adds new columns to an existing table.',
        formula: 'ALTER TABLE table_name ADD column_name datatype;',
        example: 'ALTER TABLE employees ADD hire_date DATE;'
      },
      {
        name: 'ALL',
        description: 'Used in subqueries to allow comparison with all values in the result set.',
        formula: 'expr comparison_operator ALL (subquery)',
        example: 'SELECT product_name FROM products WHERE price > ALL (SELECT price FROM products WHERE category_id = 1);'
      },
      {
        name: 'ALTER',
        description: 'Modifies an existing database object such as a table or view.',
        formula: 'ALTER object_type object_name parameters;',
        example: 'ALTER TABLE employees RENAME COLUMN old_column_name TO new_column_name;'
      },
      {
        name: 'ANALYZE',
        description: 'Collects statistics and stores them in the data dictionary.',
        formula: 'ANALYZE table_name;',
        example: 'ANALYZE sales_data;'
      }
    ],
    Operators: [
      {
        name: 'AND',
        title: 'AND',
        description: 'A logical operator that returns true if both operands are true.',
        example: 'SELECT column1, column2 FROM table_name WHERE column1 > 10 AND column2 < 5;'
      },
      {
        name: 'BETWEEN',
        title: 'BETWEEN',
        description: 'A keyword used to filter rows based on a range of values.',
        example: 'SELECT * FROM table_name WHERE column1 BETWEEN 10 AND 50;'
      },
      {
        name: 'IN',
        title: 'IN',
        description: 'A keyword used to compare a value against a list of values.',
        example: 'SELECT * FROM table_name WHERE column1 IN (value1, value2, value3);'
      },
      {
        name: 'LIKE',
        title: 'LIKE',
        description: 'A keyword used to perform pattern matching.',
        example: "SELECT * FROM table_name WHERE column1 LIKE 'abc%';"
      },
      {
        name: 'NOT',
        title: 'NOT',
        description: 'A logical operator that negates the following condition.',
        example: "SELECT * FROM table_name WHERE NOT column1 = 'value';"
      },
      {
        name: 'OR',
        title: 'OR',
        description: 'A logical operator that returns true if at least one operand is true.',
        example: 'SELECT column1, column2 FROM table_name WHERE column1 > 10 OR column2 < 5;'
      },
      {
        name: 'IS',
        title: 'IS',
        description: 'A keyword used to compare a value against NULL.',
        example: 'SELECT * FROM table_name WHERE column1 IS NULL;'
      },
      {
        name: 'NULL',
        title: 'NULL',
        description: "A special value representing 'no value' or 'unknown'.",
        example: 'SELECT * FROM table_name WHERE column1 IS NULL;'
      },
      {
        name: 'INTERSECT',
        title: 'INTERSECT',
        description: 'A set operator used to combine the results of two or more SELECT statements, returning only the common rows.',
        example: 'SELECT column1 FROM table1 INTERSECT SELECT column1 FROM table2;'
      },
      {
        name: 'UNION',
        title: 'UNION',
        description: 'A set operator used to combine the results of two or more SELECT statements, returning all rows without duplicates.',
        example: 'SELECT column1 FROM table1 UNION SELECT column1 FROM table2;'
      },
      {
        name: 'INNER',
        title: 'INNER',
        description: 'A keyword used in a JOIN clause to specify that only matching rows are returned.',
        example: 'SELECT * FROM table1 INNER JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'JOIN',
        title: 'JOIN',
        description: 'A keyword used to combine rows from two or more tables based on a related column.',
        example: 'SELECT * FROM table1 JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'LEFT',
        title: 'LEFT',
        description: 'A keyword used in a JOIN clause to specify that all rows from the left table are returned along with matching rows from the right table.',
        example: 'SELECT * FROM table1 LEFT JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'OUTER',
        title: 'OUTER',
        description: 'A keyword used in a JOIN clause to specify that all rows from both tables are returned, with NULL values in non-matching rows.',
        example: 'SELECT * FROM table1 FULL OUTER JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'RIGHT',
        title: 'RIGHT',
        description: 'A keyword used in a JOIN clause to specify that all rows from the right table are returned along with matching rows from the left table.',
        example: 'SELECT * FROM table1 RIGHT JOIN table2 ON table1.column = table2.column;'
      }
    ]
  }
});
