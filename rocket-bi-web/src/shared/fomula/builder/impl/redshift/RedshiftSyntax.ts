export const getRedshiftSyntax = () => ({
  name: 'redshift',
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
  supportedFunction: {
    'Aggregate functions': [
      {
        name: 'ANY_VALUE',
        title: 'ANY_VALUE ( [ DISTINCT | ALL ] expression )',
        description:
          "The ANY_VALUE function returns any value from the input expression values nondeterministically. This function can return NULL if the input expression doesn't result in any rows being returned. Returns the same data type as expression.",
        example: "select any_value(dateid) as dateid, eventname from event where eventname ='Eagles' group by eventname"
      },
      {
        name: 'APPROXIMATE PERCENTILE_DISC',
        title: 'APPROXIMATE  PERCENTILE_DISC ( percentile )',
        description:
          'APPROXIMATE PERCENTILE_DISC is an inverse distribution function that assumes a discrete distribution model. It takes a percentile value and a sort specification and returns an element from the given set. Approximation enables the function to run much faster, with a low relative error of around 0.5 percent.The same data type as the ORDER BY expression in the WITHIN GROUP clause.',
        example:
          'select top 10 date.caldate,\ncount(totalprice), sum(totalprice),\napproximate percentile_disc(0.5) \nwithin group (order by totalprice)\nfrom listing\njoin date on listing.dateid = date.dateid\ngroup by date.caldate\norder by 3 desc'
      },
      {
        name: 'AVG',
        title: 'AVG ( [ DISTINCT | ALL ] expression )',
        description:
          'The AVG function returns the average (arithmetic mean) of the input expression values. The AVG function works with numeric values and ignores NULL values. ',
        example: 'select avg(qtysold)from sales'
      },
      {
        name: 'COUNT',
        title: 'COUNT( * | expression )',
        description: 'The target column or expression that the function operates on. The COUNT function supports all argument data types.',
        example: "select count(*) from users where state='FL'"
      },
      {
        name: 'APPROXIMATE COUNT',
        title: 'APPROXIMATE COUNT ( DISTINCT expression )',
        description:
          'When used with APPROXIMATE, a COUNT DISTINCT function uses a HyperLogLog algorithm to approximate the number of distinct non-NULL values in a column or expression. Queries that use the APPROXIMATE keyword run much faster, with a low relative error of around 2%. Approximation is warranted for queries that return a large number of distinct values, in the millions or more per query, or per group, if there is a group by clause. For smaller sets of distinct values, in the thousands, approximation might be slower than a precise count. APPROXIMATE can only be used with COUNT DISTINCT.',
        example: 'select approximate count(distinct pricepaid) from sales'
      },
      {
        name: 'LISTAGG',
        title: "LISTAGG( [DISTINCT] aggregate_expression [, 'delimiter' ] )",
        description:
          "For each group in a query, the LISTAGG aggregate function orders the rows for that group according to the ORDER BY expression, then concatenates the values into a single string.\n\nLISTAGG is a compute-node only function. The function returns an error if the query doesn't reference a user-defined table or Amazon Redshift system table. Return VARCHAR(MAX). If the result set is larger than the maximum VARCHAR size (64K – 1, or 65535), then LISTAGG returns the following error: Invalid operation: Result size exceeds LISTAGG limit.",
        example:
          'select listagg(sellerid) \nwithin group (order by dateid) as sellers,\nlistagg(dateid) \nwithin group (order by sellerid) as dates\nfrom winsales'
      },
      {
        name: 'MAX',
        title: 'MAX ( [ DISTINCT | ALL ] expression )',
        description: 'The MAX function returns the maximum value in a set of rows. DISTINCT or ALL might be used but do not affect the result.',
        example: 'select max(pricepaid) from sales'
      },
      {
        name: 'MEDIAN',
        title: 'MEDIAN ( median_expression )',
        description:
          "Calculates the median value for the range of values. NULL values in the range are ignored.\n\nMEDIAN is an inverse distribution function that assumes a continuous distribution model.\n\nMEDIAN is a special case of PERCENTILE_CONT(.5).\n\nMEDIAN is a compute-node only function. The function returns an error if the query doesn't reference a user-defined table or Amazon Redshift system table.",
        example:
          'select top 10 salesid, sum(pricepaid), \npercentile_cont(0.6) within group (order by salesid),\nmedian (salesid)\nfrom sales group by salesid, pricepaid'
      },
      {
        name: 'MIN',
        title: 'MIN ( [ DISTINCT | ALL ] expression )',
        description: 'The MIN function returns the minimum value in a set of rows. DISTINCT or ALL might be used but do not affect the result.',
        example: 'select min(pricepaid) from sales'
      },
      {
        name: 'PERCENTILE_CONT',
        title: 'PERCENTILE_CONT ( percentile )',
        description:
          'PERCENTILE_CONT is an inverse distribution function that assumes a continuous distribution model. It takes a percentile value and a sort specification, and returns an interpolated value that would fall into the given percentile value with respect to the sort specification.The return type is determined by the data type of the ORDER BY expression in the WITHIN GROUP clause.',
        example:
          'select top 10 salesid, sum(pricepaid), \npercentile_cont(0.6) within group (order by salesid),\nmedian (salesid)\nfrom sales group by salesid, pricepaid'
      },
      {
        name: 'STDDEV_SAMP',
        title: 'STDDEV_SAMP ( [ DISTINCT | ALL ] expression)',
        description:
          'The STDDEV_SAMP function return the sample standard deviation of a set of numeric values (integer, decimal, or floating-point). The result of the STDDEV_SAMP function is equivalent to the square root of the sample variance of the same set of values.',
        example: 'select cast(STDDEV_SAMP(commission) as dec(18,10))\nfrom sales '
      },
      {
        name: 'STDDEV',
        title: 'STDDEV ( [ DISTINCT | ALL ] expression)',
        description:
          'The STDDEV function return the sample standard deviation of a set of numeric values (integer, decimal, or floating-point). The result of the STDDEV_SAMP function is equivalent to the square root of the sample variance of the same set of values.',
        example: 'select cast(stddev(commission) as dec(18,10))\nfrom sales '
      },
      {
        name: 'STDDEV_POP',
        title: 'STDDEV_POP ( [ DISTINCT | ALL ] expression)',
        description:
          'The STDDEV_POP function return the population standard deviation of a set of numeric values (integer, decimal, or floating-point). The result of the STDDEV_SAMP function is equivalent to the square root of the sample variance of the same set of values.',
        example: 'select cast(stddev_pop(commission) as dec(18,10))\nfrom sales '
      },
      {
        name: 'SUM',
        title: 'SUM ( [ DISTINCT | ALL ] expression )',
        description:
          'The SUM function returns the sum of the input column or expression values. The SUM function works with numeric values and ignores NULL values.',
        example: 'select sum(commission) from sales'
      },
      {
        name: 'VAR_SAMP',
        title: 'VAR_SAMP ( [ DISTINCT | ALL ] expression)',
        description:
          'The VAR_SAMP functions return the sample variance of a set of numeric values (integer, decimal, or floating-point). The result of the VAR_SAMP function is equivalent to the squared sample standard deviation of the same set of values.',
        example: 'select avg(numtickets),\nround(var_samp(numtickets)) varsamp,\nround(var_pop(numtickets)) varpop\nfrom listing;'
      },
      {
        name: 'VARIANCE',
        title: 'VARIANCE ( [ DISTINCT | ALL ] expression)',
        description:
          'The VARIANCE functions return the sample variance of a set of numeric values (integer, decimal, or floating-point). The result of the VAR_SAMP function is equivalent to the squared sample standard deviation of the same set of values.',
        example: 'select avg(numtickets),\nround(variance(numtickets)) varsamp,\nround(var_pop(numtickets)) varpop\nfrom listing;'
      },
      {
        name: 'VAR_POP',
        title: 'VAR_POP ( [ DISTINCT | ALL ] expression)',
        description:
          'The VAR_POP functions return the population variance of a set of numeric values (integer, decimal, or floating-point). The result of the VAR_SAMP function is equivalent to the squared sample standard deviation of the same set of values.',
        example: 'select avg(numtickets),\nround(variance(numtickets)) varsamp,\nround(var_pop(numtickets)) varpop\nfrom listing;'
      }
    ],
    Array: [
      {
        name: 'ARRAY',
        title: 'ARRAY( [ expr1 ] [ , expr2 [ , ... ] ] )',
        description: 'Creates an array of the SUPER data type.',
        example: "select array(1,'abc',true,3.14)"
      },
      {
        name: 'array_concat',
        title: 'array_concat( super_expr1,  super_expr2 )',
        description:
          'The array_concat function concatenates two arrays to create an array that contains all the elements in the first array followed by all the elements in the second array. The two arguments must be valid arrays.The array_concat function returns a SUPER data value.',
        example: 'SELECT ARRAY_CONCAT(ARRAY(10001,10002),ARRAY(10003,10004))'
      },
      {
        name: 'array_concat',
        title: 'array_flatten( super_expr1,super_expr2,.. )',
        description: 'Merges multiple arrays into a single array of SUPER type. The array_flatten function returns a SUPER data value.',
        example: 'SELECT ARRAY_FLATTEN(ARRAY(ARRAY(1,2,3,4),ARRAY(5,6,7,8),ARRAY(9,10)))'
      },
      {
        name: 'get_array_length',
        title: 'get_array_length( super_expr )',
        description:
          'Returns the length of the specified array. The GET_ARRAY_LENGTH function returns the length of a SUPER array given an object or array path.',
        example: 'SELECT GET_ARRAY_LENGTH(ARRAY(1,2,3,4,5,6,7,8,9,10))'
      },
      {
        name: 'split_to_array',
        title: 'split_to_array( string,delimiter )',
        description:
          'Uses a delimiter as an optional parameter. If no delimiter is present, then the default is a comma. The split_to_array function returns a SUPER data value.',
        example: "SELECT SPLIT_TO_ARRAY('12|345|6789', '|')"
      },
      {
        name: 'SUBARRAY',
        title: 'SUBARRAY( super_expr, start_position, length )',
        description: 'Manipulates arrays to return a subset of the input arrays.',
        example: "SELECT SUBARRAY(ARRAY('a', 'b', 'c', 'd', 'e', 'f'), 2, 3)"
      }
    ],
    'Condition expressions': [
      {
        name: 'CASE',
        title: 'CASE expression',
        description:
          'The CASE expression is a conditional expression, similar to if/then/else statements found in other languages. CASE is used to specify a result when there are multiple conditions. Use CASE where a SQL expression is valid, such as in a SELECT command.',
        example: "select venuecity,\n  case venuecity\n    when 'New York City'\n    then 'Big Apple' else 'other'\n  end \nfrom venue\norder by venueid desc"
      },
      {
        name: 'DECODE',
        title: 'DECODE ( expression, search, result [, search, result ]... [ ,default ] )',
        description:
          'A DECODE expression replaces a specific value with either another specific value or a default value, depending on the result of an equality condition. This operation is equivalent to the operation of a simple CASE expression or an IF-THEN-ELSE statement.',
        example: "select decode(caldate, '2008-06-01', 'June 1st, 2008')\nfrom datetable where month='JUN' order by caldate"
      },
      {
        name: 'GREATEST',
        title: 'GREATEST (value [, ...])',
        description: 'Returns the largest value from a list of any number of expressions.',
        example: 'select firstname, lastname, greatest(firstname,lastname) from users\nwhere userid < 10\norder by 3'
      },
      {
        name: 'LEAST',
        title: 'LEAST (value [, ...])',
        description: 'Returns the least value from a list of any number of expressions.',
        example: 'select firstname, lastname, least(firstname,lastname) from users\nwhere userid < 10\norder by 3'
      },
      {
        name: 'NVL',
        title: 'NVL( expression, expression, ... )',
        description:
          "Returns the value of the first expression that isn't null in a series of expressions. When a non-null value is found, the remaining expressions in the list aren't evaluated.",
        example: 'SELECT NVL(NULL, 12, NULL)'
      },
      {
        name: 'COALESCE',
        title: 'COALESCE( expression, expression, ... )',
        description:
          "Returns the value of the first expression that isn't null in a series of expressions. When a non-null value is found, the remaining expressions in the list aren't evaluated.",
        example: 'SELECT COALESCE(NULL, 12, NULL)'
      },
      {
        name: 'NVL2',
        title: 'NVL2 ( expression, not_null_return_value, null_return_value )',
        description: 'Returns one of two values based on whether a specified expression evaluates to NULL or NOT NULL.',
        example: "select nvl2(column1, '2345', 1234)"
      },
      {
        name: 'NULLIF',
        title: 'NULLIF ( expression1, expression2 )',
        description:
          'The NULLIF expression compares two arguments and returns null if the arguments are equal. If they are not equal, the first argument is returned. This expression is the inverse of the NVL or COALESCE expression.',
        example: "SELECT NULLIF('first', 'second')"
      }
    ],
    'Data Types': [],
    'Data type formatting functions': [
      {
        name: 'CAST',
        title: 'CAST ( expression AS type )',
        description:
          "The CAST function converts one data type to another compatible data type. For instance, you can convert a string to a date, or a numeric type to a string. CAST performs a runtime conversion, which means that the conversion doesn't change a value's data type in a source table. It's changed only in the context of the query.",
        example: 'select cast(pricepaid as integer)\nfrom sales where salesid=100 \nOR \nselect pricepaid::integer\nfrom sales where salesid=100'
      },
      {
        name: 'CONVERT',
        title: 'CONVERT ( type, expression )',
        description:
          "Like the CAST function, the CONVERT function converts one data type to another compatible data type. For instance, you can convert a string to a date, or a numeric type to a string. CONVERT performs a runtime conversion, which means that the conversion doesn't change a value's data type in a source table. It's changed only in the context of the query.",
        example: 'SELECT CONVERT(decimal(2,1), 123.456)'
      },
      {
        name: 'TO_CHAR',
        title: "TO_CHAR (timestamp_expression | numeric_expression , 'format')",
        description: 'TO_CHAR converts a timestamp or numeric expression to a character-string data format.',
        example: "select to_char(timestamp '2009-12-31 23:15:59', 'DDD') => 365"
      },
      {
        name: 'TO_DATE',
        title: 'TO_DATE(string, format)',
        description: 'TO_DATE converts a date represented by a character string to a DATE data type.',
        example: "select to_date('02 Oct 2001', 'DD Mon YYYY')"
      },
      {
        name: 'TO_DATE',
        title: 'TO_DATE(string, format, is_strict)',
        description:
          'TO_DATE converts a date represented by a character string to a DATE data type. When is_strict is set to TRUE, an error is returned if there is an out of range value. When is_strict is set to FALSE, which is the default, then overflow values are accepted',
        example: "select to_date('02 Oct 2001', 'DD Mon YYYY')"
      },
      {
        name: 'to_number',
        title: 'to_number(string, format)',
        description: 'TO_NUMBER converts a string to a numeric (decimal) value',
        example: "select to_number('$ 2,012,454.88', 'L 9,999,999.99')"
      },
      {
        name: 'TEXT_TO_INT_ALT',
        title: "TEXT_TO_INT_ALT (expression [ , 'format'])",
        description: 'TEXT_TO_INT_ALT converts a character string to an integer using Teradata-style formatting. Fraction digits in the result are truncated.',
        example: "select text_to_int_alt('123-')"
      },
      {
        name: 'TEXT_TO_NUMERIC_ALT',
        title: "TEXT_TO_NUMERIC_ALT (expression [, 'format'] [, precision, scale])",
        description: 'TEXT_TO_NUMERIC_ALT performs a Teradata-style cast operation to convert a character string to a numeric data format.',
        example: "select text_to_numeric_alt('1.5') => 2"
      }
    ],
    'Date and time functions': [
      {
        name: 'ADD_MONTHS',
        title: 'ADD_MONTHS( {date | timestamp}, integer)',
        description:
          'ADD_MONTHS adds the specified number of months to a date or timestamp value or expression. The DATEADD function provides similar functionality.',
        example: "select add_months('2008-03-31',1) => 2008-04-30 00:00:00"
      },
      {
        name: 'AT TIME ZONE',
        title: "AT TIME ZONE 'timezone'",
        description: 'CONVERT_TIMEZONE converts a timestamp from one time zone to another. The function automatically adjusts for Daylight saving time.',
        example: "SELECT TIMESTAMP '2001-02-16 20:38:40' AT TIME ZONE 'MST' => 2001-02-16 18:38:40"
      },
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE',
        description: 'CURRENT_DATE returns a date in the current session time zone (UTC by default) in the default format: YYYY-MM-DD',
        example: 'select current_date'
      },
      {
        name: 'DATE_CMP',
        title: 'DATE_CMP(date1, date2)',
        description: 'DATE_CMP compares two dates. The function returns 0 if the dates are identical, 1 if date1 is greater, and -1 if date2 is greater.',
        example: "select caldate, '2008-01-04',\ndate_cmp(caldate,'2008-01-04')\nfrom date\norder by dateid\nlimit 10"
      },
      {
        name: 'DATE_CMP_TIMESTAMP',
        title: 'DATE_CMP_TIMESTAMP(date, timestamp)',
        description:
          'Compares a date to a timestamp and returns 0 if the values are identical, 1 if date is greater alphabetically and -1 if timestamp is greater.',
        example: "select listid, '2008-06-18', listtime,\ndate_cmp_timestamp('2008-06-18', listtime)\nfrom listing\norder by 1, 2, 3, 4\nlimit 10"
      },
      {
        name: 'DATE_CMP_TIMESTAMPTZ',
        title: 'DATE_CMP_TIMESTAMPTZ(date, timestamptz)',
        description:
          'DATE_CMP_TIMESTAMPTZ compares a date to a timestamp with time zone. If the date and timestamp values are identical, the function returns 0. If the date is greater alphabetically, the function returns 1. If the timestamp is greater, the function returns –1.\n\n',
        example: ''
      },
      {
        name: 'DATEADD',
        title: 'DATEADD( datepart, interval, {date|time|timetz|timestamp} )',
        description: 'Increments a DATE, TIME, TIMETZ, or TIMESTAMP value by a specified interval.',
        example: "select dateadd(month,18,'2008-02-28') => 2009-08-28 00:00:00"
      },
      {
        name: 'DATEDIFF',
        title: 'DATEDIFF ( datepart, {date|time|timetz|timestamp}, {date|time|timetz|timestamp} )',
        description: 'DATEDIFF returns the difference between the date parts of two date or time expressions.',
        example: "select datediff(week,'2009-01-01','2009-12-31') as numweeks => 52"
      },
      {
        name: 'DATE_PART',
        title: 'DATE_PART(datepart, {date|timestamp})',
        description:
          'DATE_PART extracts date part values from an expression. DATE_PART is a synonym of the PGDATE_PART function. The function returns a DOUBLE value.',
        example: "SELECT DATE_PART(week, timestamp '20220502 04:05:06.789') => 18"
      },
      {
        name: 'DATE_PART_YEAR',
        title: 'DATE_PART_YEAR(date)',
        description: 'The DATE_PART_YEAR function extracts the year from a date. The function return a integer value',
        example: "SELECT DATE_PART_YEAR(date '20220502 04:05:06.789') => 2022"
      },
      {
        name: 'DATE_TRUNC',
        title: "DATE_TRUNC('datepart', timestamp)",
        description:
          'The DATE_TRUNC function truncates a timestamp expression or literal based on the date part that you specify, such as hour, day, or month.',
        example: "SELECT DATE_TRUNC('second', TIMESTAMP '20200430 04:05:06.789') => 2020-04-30 04:05:06"
      },
      {
        name: 'EXTRACT',
        title: 'EXTRACT(datepart FROM source)',
        description:
          'The EXTRACT function returns a date or time part from a TIMESTAMP, TIMESTAMPTZ, TIME, or TIMETZ value. Examples include a day, month, year, hour, minute, second, millisecond, or microsecond from a timestamp.',
        example: "select extract(ms from timestamp '2009-09-09 12:08:43.101')"
      },
      {
        name: 'GETDATE',
        title: 'GETDATE()',
        description:
          'GETDATE returns the current date and time in the current session time zone (UTC by default). It returns the start date or time of the current statement, even when it is within a transaction block.',
        example: 'select getdate()'
      },
      {
        name: 'INTERVAL_CMP',
        title: 'INTERVAL_CMP(interval1, interval2)',
        description:
          'INTERVAL_CMP compares two intervals and returns 1 if the first interval is greater, -1 if the second interval is greater, and 0 if the intervals are equal. For more information, see Interval literals.',
        example: "select interval_cmp('3 days','1 year') => -1"
      },
      {
        name: 'LAST_DAY',
        title: 'LAST_DAY ( { date | timestamp } )',
        description:
          'LAST_DAY returns the date of the last day of the month that contains date. The return type is always DATE, regardless of the data type of the date argument.\n\nFor more information about retrieving specific date parts, see DATE_TRUNC function.',
        example: 'select last_day(sysdate)'
      },
      {
        name: 'MONTHS_BETWEEN',
        title: 'MONTHS_BETWEEN ( date1, date2 )',
        description:
          'MONTHS_BETWEEN determines the number of months between two dates.\n\nIf the first date is later than the second date, the result is positive; otherwise, the result is negative.\n\nIf either argument is null, the result is NULL.',
        example: "select months_between('1969-01-18', '1969-03-18')\nas months"
      },
      {
        name: 'NEXT_DAY',
        title: 'NEXT_DAY ( { date | timestamp }, day )',
        description:
          'NEXT_DAY returns the date of the first instance of the specified day that is later than the given date.\n\nIf the day value is the same day of the week as given_date, the next occurrence of that day is returned.',
        example: "select next_day('2014-08-20','Tuesday') => 2014-08-26"
      },
      {
        name: 'SYSDATE',
        title: 'SYSDATE',
        description: 'SYSDATE returns the current date and time in the current session time zone (UTC by default).',
        example: 'select sysdate'
      },
      {
        name: 'TIMEOFDAY',
        title: 'TIMEOFDAY()',
        description:
          'TIMEOFDAY is a special alias used to return the weekday, date, and time as a string value. It returns the time of day string for the current statement, even when it is within a transaction block.',
        example: 'select timeofday()'
      },
      {
        name: 'TIMESTAMP_CMP',
        title: 'TIMESTAMP_CMP(timestamp1, timestamp2)',
        description:
          'Compares the value of two timestamps and returns an integer. If the timestamps are identical, the function returns 0. If the first timestamp is greater, the function returns 1. If the second timestamp is greater, the function returns –1.',
        example:
          "SELECT TIMESTAMP_CMP('2008-01-24 06:43:29', '2008-01-24 06:43:29'), TIMESTAMP_CMP('2008-01-24 06:43:29', '2008-02-18 02:36:48'), TIMESTAMP_CMP('2008-02-18 02:36:48', '2008-01-24 06:43:29')"
      },
      {
        name: 'TIMESTAMP_CMP_DATE',
        title: 'TIMESTAMP_CMP_DATE(timestamp, date)',
        description:
          'TIMESTAMP_CMP_DATE compares the value of a timestamp and a date. If the timestamp and date values are identical, the function returns 0. If the timestamp is greater alphabetically, the function returns 1. If the date is greater, the function returns –1.',
        example: "select listid, listtime,\ntimestamp_cmp_date(listtime, '2008-06-18')\nfrom listing\norder by 1, 2, 3\nlimit 10"
      },
      {
        name: 'TIMESTAMP_CMP_TIMESTAMPTZ',
        title: 'TIMESTAMP_CMP_TIMESTAMPTZ(timestamp, timestamptz)',
        description:
          'TIMESTAMP_CMP_TIMESTAMPTZ compares the value of a timestamp expression with a timestamp with time zone expression. If the timestamp and timestamp with time zone values are identical, the function returns 0. If the timestamp is greater alphabetically, the function returns 1. If the timestamp with time zone is greater, the function returns –1.\n\n',
        example: ''
      },
      {
        name: 'TIMESTAMPTZ_CMP',
        title: 'TIMESTAMPTZ_CMP(timestamptz1, timestamptz2)',
        description:
          'TIMESTAMPTZ_CMP compares the value of two timestamp with time zone values and returns an integer. If the timestamps are identical, the function returns 0. If the first timestamp is greater alphabetically, the function returns 1. If the second timestamp is greater, the function returns –1.',
        example: ''
      },
      {
        name: 'TIMESTAMPTZ_CMP_DATE',
        title: 'TIMESTAMPTZ_CMP_DATE(timestamptz, date)',
        description:
          'TIMESTAMPTZ_CMP_DATE compares the value of a timestamp and a date. If the timestamp and date values are identical, the function returns 0. If the timestamp is greater alphabetically, the function returns 1. If the date is greater, the function returns –1.',
        example: ''
      },
      {
        name: 'TIMESTAMPTZ_CMP_TIMESTAMP',
        title: 'TIMESTAMPTZ_CMP_TIMESTAMP(timestamptz, timestamp)',
        description:
          'TIMESTAMPTZ_CMP_TIMESTAMP compares the value of a timestamp with time zone expression with a timestamp expression. If the timestamp with time zone and timestamp values are identical, the function returns 0. If the timestamp with time zone is greater alphabetically, the function returns 1. If the timestamp is greater, the function returns –1.',
        example: ''
      },
      {
        name: 'TIMEZONE',
        title: "TIMEZONE ('timezone', { timestamp | timestamptz )",
        description:
          'TIMEZONE returns a timestamp for the specified time zone and timestamp value.\n\nFor information and examples about how to set time zone, see timezone.\n\nFor information and examples about how to convert time zone, see CONVERT_TIMEZONE.',
        example: ''
      },
      {
        name: 'to_timestamp',
        title: 'to_timestamp (timestamp, format)',
        description:
          'TO_TIMESTAMP converts a TIMESTAMP string to TIMESTAMPTZ. For a list of additional date and time functions for Amazon Redshift, see Date and time functions.',
        example: "SELECT TO_TIMESTAMP('2017','YYYY')"
      },
      {
        name: 'to_timestamp',
        title: 'to_timestamp (timestamp, format, is_strict)',
        description:
          'TO_TIMESTAMP converts a TIMESTAMP string to TIMESTAMPTZ. For a list of additional date and time functions for Amazon Redshift, see Date and time functions. When is_strict is set to TRUE, an error is returned if there is an out of range value. When is_strict is set to FALSE, which is the default, then overflow values are accepted.',
        example: "SELECT TO_TIMESTAMP('2017','YYYY')"
      },
      {
        name: 'TRUNC',
        title: 'TRUNC(timestamp)',
        description: 'Truncates a timestamp and returns a date.',
        example: 'select trunc(sysdate) => 2011-07-21'
      }
    ],
    Keyword: [
      {
        name: 'AES128',
        title: 'AES128',
        description: 'Amazon Redshift encryption algorithm AES128.',
        example: "CREATE TABLE encrypted_table (data VARBINARY ENCRYPT USING 'AES128');"
      },
      {
        name: 'AES256',
        title: 'AES256',
        description: 'Amazon Redshift encryption algorithm AES256.',
        example: "CREATE TABLE encrypted_table (data VARBINARY ENCRYPT USING 'AES256');"
      },
      {
        name: 'ALL',
        title: 'ALL',
        description: 'Amazon Redshift keyword used to specify comparison to all values in a subquery or list.',
        example: 'SELECT * FROM orders WHERE order_amount > ALL (SELECT order_amount FROM large_orders);'
      },
      {
        name: 'ALLOWOVERWRITE',
        title: 'ALLOWOVERWRITE',
        description: 'Amazon Redshift COPY option that allows overwriting existing data.',
        example: "COPY events FROM 's3://mybucket/data' CREDENTIALS 'aws_access_key_id=...;aws_secret_access_key=...' ALLOWOVERWRITE;"
      },
      {
        name: 'ANALYSE',
        title: 'ANALYSE',
        description: 'Amazon Redshift deprecated keyword for analyzing query execution plans. Use ANALYZE instead.',
        example: 'ANALYZE sales;'
      },
      {
        name: 'ANALYZE',
        title: 'ANALYZE',
        description: 'Amazon Redshift keyword used to update optimizer statistics for a table.',
        example: 'ANALYZE sales;'
      },
      {
        name: 'AND',
        title: 'AND',
        description: 'Amazon Redshift logical operator used to combine multiple conditions.',
        example: 'SELECT * FROM employees WHERE age > 30 AND salary > 50000;'
      },
      {
        name: 'ANY',
        title: 'ANY',
        description: 'Amazon Redshift keyword used to compare a value to any value in a subquery or list.',
        example: 'SELECT * FROM products WHERE price > ANY (SELECT price FROM competitors);'
      },
      {
        name: 'ARRAY',
        title: 'ARRAY',
        description: 'Amazon Redshift keyword used to create an array value.',
        example: 'SELECT ARRAY[1, 2, 3] AS numbers;'
      },
      {
        name: 'AS',
        title: 'AS',
        description: 'Amazon Redshift keyword used to assign an alias to a column or table.',
        example: 'SELECT first_name AS fname, last_name AS lname FROM employees;'
      },
      {
        name: 'ASC',
        title: 'ASC',
        description: 'Amazon Redshift keyword used to specify ascending order in ORDER BY clause.',
        example: 'SELECT * FROM products ORDER BY price ASC;'
      },
      {
        name: 'AUTHORIZATION',
        title: 'AUTHORIZATION',
        description: 'Amazon Redshift keyword used to specify the owner of an object.',
        example: 'CREATE SCHEMA my_schema AUTHORIZATION my_user;'
      },
      {
        name: 'AZ64',
        title: 'AZ64',
        description: 'Amazon Redshift encoding type AZ64.',
        example: 'CREATE TABLE encoded_table (data VARCHAR ENCODE AZ64);'
      },
      {
        name: 'BACKUP',
        title: 'BACKUP',
        description: 'Amazon Redshift keyword used in managing backups of the cluster.',
        example: "BACKUP my_cluster TO 's3://mybucket/backup' CREDENTIALS 'aws_access_key_id=...;aws_secret_access_key=...';"
      },
      {
        name: 'BETWEEN',
        title: 'BETWEEN',
        description: 'Amazon Redshift comparison operator used to specify a range of values.',
        example: "SELECT * FROM sales WHERE order_date BETWEEN '2021-01-01' AND '2021-12-31';"
      },
      {
        name: 'BINARY',
        title: 'BINARY',
        description: 'Amazon Redshift encoding type BINARY.',
        example: 'CREATE TABLE encoded_table (data VARCHAR ENCODE BINARY);'
      },
      {
        name: 'BLANKSASNULL',
        title: 'BLANKSASNULL',
        description: 'Amazon Redshift option used to treat blank strings as NULL values during COPY.',
        example: "COPY my_table FROM 's3://mybucket/data' BLANKSASNULL;"
      },
      {
        name: 'BOTH',
        title: 'BOTH',
        description: 'Amazon Redshift keyword used to specify comparison to values on both sides of a range.',
        example: 'SELECT * FROM employees WHERE age BETWEEN 30 AND 40;'
      },
      {
        name: 'BYTEDICT',
        title: 'BYTEDICT',
        description: 'Amazon Redshift encoding type BYTEDICT.',
        example: 'CREATE TABLE encoded_table (data VARCHAR ENCODE BYTEDICT);'
      },
      {
        name: 'BZIP2',
        title: 'BZIP2',
        description: 'Amazon Redshift compression type BZIP2.',
        example: 'CREATE TABLE compressed_table (data VARCHAR COMPRESSION BZIP2);'
      },
      {
        name: 'CASE',
        title: 'CASE',
        description: 'Amazon Redshift conditional expression CASE used for conditional logic.',
        example: "SELECT first_name, last_name, CASE WHEN salary > 50000 THEN 'High' ELSE 'Low' END AS income_level FROM employees;"
      },
      {
        name: 'CAST',
        title: 'CAST',
        description: 'Amazon Redshift function CAST used to convert data types.',
        example: "SELECT CAST('123' AS INTEGER) AS number;"
      },
      {
        name: 'CHECK',
        title: 'CHECK',
        description: 'Amazon Redshift constraint CHECK used to enforce conditions on column values.',
        example: 'CREATE TABLE products (product_id INTEGER, price DECIMAL CHECK (price > 0));'
      },
      {
        name: 'COLLATE',
        title: 'COLLATE',
        description: 'Amazon Redshift keyword used to specify collation for character data.',
        example: 'SELECT * FROM names ORDER BY last_name COLLATE "C";'
      },
      {
        name: 'COLUMN',
        title: 'COLUMN',
        description: 'Amazon Redshift keyword used in column-level operations and constraints.',
        example: 'ALTER TABLE my_table ADD COLUMN new_column INTEGER;'
      },
      {
        name: 'CONNECT',
        title: 'CONNECT',
        description: 'Amazon Redshift keyword used for connection privileges.',
        example: 'GRANT CONNECT ON DATABASE my_db TO my_user;'
      },
      {
        name: 'CONSTRAINT',
        title: 'CONSTRAINT',
        description: 'Amazon Redshift keyword used to define constraints on a table.',
        example:
          'CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id));'
      },
      {
        name: 'CREATE',
        title: 'CREATE',
        description: 'Amazon Redshift keyword used to create database objects.',
        example: 'CREATE TABLE employees (employee_id INTEGER, first_name VARCHAR(50));'
      },
      {
        name: 'CREDENTIALS',
        title: 'CREDENTIALS',
        description: 'Amazon Redshift keyword used to specify credentials for accessing external data.',
        example: "COPY my_table FROM 's3://mybucket/data' CREDENTIALS 'aws_access_key_id=...;aws_secret_access_key=...';"
      },
      {
        name: 'CROSS',
        title: 'CROSS',
        description: 'Amazon Redshift keyword used to create a Cartesian product of two or more tables.',
        example: 'SELECT * FROM customers CROSS JOIN orders;'
      },
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE',
        description: 'Amazon Redshift function CURRENT_DATE returns the current date.',
        example: 'SELECT CURRENT_DATE;'
      },
      {
        name: 'CURRENT_TIME',
        title: 'CURRENT_TIME',
        description: 'Amazon Redshift function CURRENT_TIME returns the current time.',
        example: 'SELECT CURRENT_TIME;'
      },
      {
        name: 'CURRENT_TIMESTAMP',
        title: 'CURRENT_TIMESTAMP',
        description: 'The current timestamp of the session execution.',
        example: 'SELECT CURRENT_TIMESTAMP;'
      },
      {
        name: 'CURRENT_USER',
        title: 'CURRENT_USER',
        description: 'The name of the user executing the current session.',
        example: 'SELECT CURRENT_USER;'
      },
      {
        name: 'CURRENT_USER_ID',
        title: 'CURRENT_USER_ID',
        description: 'The unique identifier of the user executing the current session.',
        example: 'SELECT CURRENT_USER_ID;'
      },
      {
        name: 'DEFAULT',
        title: 'DEFAULT',
        description: 'Specifies the default value for a column when no value is explicitly provided.',
        example: 'CREATE TABLE table_name (column_name data_type DEFAULT default_value);'
      },
      {
        name: 'DEFERRABLE',
        title: 'DEFERRABLE',
        description: 'Specifies that a foreign key constraint can be checked at the end of the transaction.',
        example: 'CREATE TABLE table_name (column_name data_type REFERENCES other_table);'
      },
      {
        name: 'DEFLATE',
        title: 'DEFLATE',
        description: 'An option used in compression to specify the DEFLATE compression algorithm.',
        example: 'CREATE TABLE table_name (column_name data_type ENCODE DEFLATE);'
      },
      {
        name: 'DEFRAG',
        title: 'DEFRAG',
        description: 'A command used to defragment tables or columns.',
        example: 'VACUUM DELETE ONLY table_name;'
      },
      {
        name: 'DELTA',
        title: 'DELTA',
        description: 'An option used in compression to specify the DELTA compression algorithm.',
        example: 'CREATE TABLE table_name (column_name data_type ENCODE DELTA);'
      },
      {
        name: 'DELTA32K',
        title: 'DELTA32K',
        description: 'An option used in compression to specify the DELTA32K compression algorithm.',
        example: 'CREATE TABLE table_name (column_name data_type ENCODE DELTA32K);'
      },
      {
        name: 'DESC',
        title: 'DESC',
        description: 'Used to specify the descending order in an ORDER BY clause.',
        example: 'SELECT column_name FROM table_name ORDER BY column_name DESC;'
      },
      {
        name: 'DISABLE',
        title: 'DISABLE',
        description: 'Used to disable a constraint or an index.',
        example: 'ALTER TABLE table_name DISABLE CONSTRAINT constraint_name;'
      },
      {
        name: 'DISTINCT',
        title: 'DISTINCT',
        description: 'Used to retrieve unique values from a query result.',
        example: 'SELECT DISTINCT column_name FROM table_name;'
      },
      {
        name: 'DO',
        title: 'DO',
        description: 'Executes a block of code without needing to create a function or procedure.',
        example: 'DO $$ BEGIN -- Code here END $$;'
      },
      {
        name: 'ELSE',
        title: 'ELSE',
        description: 'Used in control structures to specify an alternative action if a condition is not met.',
        example: 'IF condition THEN -- Code here ELSE -- Code here END IF;'
      },
      {
        name: 'EMPTYASNULL',
        title: 'EMPTYASNULL',
        description: 'Specifies that empty strings should be treated as NULL values.',
        example: 'SET EMPTYASNULL ON;'
      },
      {
        name: 'ENABLE',
        title: 'ENABLE',
        description: 'Used to enable a previously disabled constraint or an index.',
        example: 'ALTER TABLE table_name ENABLE CONSTRAINT constraint_name;'
      },
      {
        name: 'ENCODE',
        title: 'ENCODE',
        description: 'An option used in compression to specify the compression algorithm.',
        example: 'CREATE TABLE table_name (column_name data_type ENCODE compression_algorithm);'
      },
      {
        name: 'ENCRYPT',
        title: 'ENCRYPT',
        description: 'An option used to specify encryption for columns or data.',
        example: 'CREATE TABLE table_name (column_name data_type ENCRYPT);'
      },
      {
        name: 'ENCRYPTION',
        title: 'ENCRYPTION',
        description: 'An option used to specify encryption for columns or data.',
        example: 'CREATE TABLE table_name (column_name data_type ENCRYPTION);'
      },
      {
        name: 'END',
        title: 'END',
        description: 'Used to mark the end of a block of code or a loop.',
        example: 'IF condition THEN -- Code here END IF;'
      },
      {
        name: 'EXCEPT',
        title: 'EXCEPT',
        description: 'Used to retrieve distinct rows from the result of one query that are not present in the result of another query.',
        example: 'SELECT column_name FROM table_name1 EXCEPT SELECT column_name FROM table_name2;'
      },
      {
        name: 'EXPLICIT',
        title: 'EXPLICIT',
        description: 'Used in queries to specify the desired join type explicitly.',
        example: 'SELECT column_name FROM table1 INNER JOIN table2 ON table1.column_name = table2.column_name;'
      },
      {
        name: 'FALSE',
        title: 'FALSE',
        description: "A boolean constant representing the value 'false'.",
        example: 'SELECT * FROM table_name WHERE column_name = FALSE;'
      },
      {
        name: 'FOR',
        title: 'FOR',
        description: 'Used in control structures to specify a loop or iteration.',
        example: 'FOR counter IN 1..10 LOOP -- Code here END LOOP;'
      },
      {
        name: 'FOREIGN',
        title: 'FOREIGN',
        description: 'Used in table definitions to define a foreign key constraint.',
        example: 'CREATE TABLE table_name (column_name data_type REFERENCES other_table);'
      },
      {
        name: 'FREEZE',
        title: 'FREEZE',
        description: 'A command used to optimize storage by compacting and removing unnecessary space.',
        example: 'VACUUM FREEZE table_name;'
      },
      {
        name: 'FROM',
        title: 'FROM',
        description: 'Used in queries to specify the data source or tables.',
        example: 'SELECT column_name FROM table_name;'
      },
      {
        name: 'FULL',
        title: 'FULL',
        description: 'Used in join clauses to specify a full outer join.',
        example: 'SELECT * FROM table1 FULL JOIN table2 ON table1.column_name = table2.column_name;'
      },
      {
        name: 'GLOBALDICT256',
        title: 'GLOBALDICT256',
        description: 'An option used in column encoding to specify a global 256-level dictionary encoding.',
        example: 'CREATE TABLE table_name (column_name data_type ENCODE GLOBALDICT256);'
      },
      {
        name: 'GLOBALDICT64K',
        title: 'GLOBALDICT64K',
        description: 'An option used in column encoding to specify a global 64K-level dictionary encoding.',
        example: 'CREATE TABLE table_name (column_name data_type ENCODE GLOBALDICT64K);'
      },
      {
        name: 'GRANT',
        title: 'GRANT',
        description: 'Used to grant specific privileges to a user or a group in Amazon Redshift.',
        example: 'GRANT SELECT ON table TO user;'
      },
      {
        name: 'GROUP',
        title: 'GROUP',
        description: 'Used to group rows that have the same values in specified columns.',
        example: 'SELECT column1, SUM(column2) FROM table GROUP BY column1;'
      },
      {
        name: 'GZIP',
        title: 'GZIP',
        description: 'A compression algorithm used in Redshift to reduce data storage size.',
        example: "COPY table FROM 's3://bucket/file.gz' CREDENTIALS 'aws_access_key_id=YOUR_KEY;aws_secret_access_key=YOUR_SECRET' GZIP;"
      },
      {
        name: 'HAVING',
        title: 'HAVING',
        description: 'Used to filter the results of a query based on aggregate functions.',
        example: 'SELECT column1, AVG(column2) FROM table GROUP BY column1 HAVING AVG(column2) > 10;'
      },
      {
        name: 'IDENTITY',
        title: 'IDENTITY',
        description: 'Used to define an automatically incrementing column in a table.',
        example: 'CREATE TABLE table (id INT IDENTITY(1,1) PRIMARY KEY, name VARCHAR);'
      },
      {
        name: 'IGNORE',
        title: 'IGNORE',
        description: 'This keyword might be used in different contexts to indicate that certain errors or conditions should be ignored.',
        example: 'INSERT IGNORE INTO table (column1) VALUES (value);'
      },
      {
        name: 'ILIKE',
        title: 'ILIKE',
        description: 'A case-insensitive version of the LIKE operator for pattern matching.',
        example: "SELECT * FROM table WHERE column1 ILIKE '%pattern%';"
      },
      {
        name: 'IN',
        title: 'IN',
        description: 'Used to specify a list of values to be matched in a query.',
        example: 'SELECT * FROM table WHERE column1 IN (value1, value2, value3);'
      },
      {
        name: 'INITIALLY',
        title: 'INITIALLY',
        description: 'This keyword might be used in different contexts to indicate initial states or settings.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) INITIALLY IMMEDIATE;'
      },
      {
        name: 'INNER',
        title: 'INNER',
        description: 'Used to specify an inner join between two or more tables.',
        example: 'SELECT * FROM table1 INNER JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'INTERSECT',
        title: 'INTERSECT',
        description: 'Used to combine the results of two or more SELECT statements, only returning common rows.',
        example: 'SELECT column1 FROM table1 INTERSECT SELECT column1 FROM table2;'
      },
      {
        name: 'INTERVAL',
        title: 'INTERVAL',
        description: 'A data type used to represent a time interval or duration.',
        example: "SELECT NOW() + INTERVAL '1 day';"
      },
      {
        name: 'INTO',
        title: 'INTO',
        description: 'Used to specify a target table when inserting data from a SELECT statement.',
        example: 'INSERT INTO target_table SELECT * FROM source_table;'
      },
      {
        name: 'IS',
        title: 'IS',
        description: 'Used in various contexts to perform comparisons, such as NULL checks.',
        example: 'SELECT * FROM table WHERE column1 IS NULL;'
      },
      {
        name: 'ISNULL',
        title: 'ISNULL',
        description: 'A function used to test whether a value is NULL.',
        example: 'SELECT column1, ISNULL(column2, 0) FROM table;'
      },
      {
        name: 'JOIN',
        title: 'JOIN',
        description: 'Used to combine rows from two or more tables based on a related column.',
        example: 'SELECT * FROM table1 JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'LANGUAGE',
        title: 'LANGUAGE',
        description: 'Used in the context of user-defined functions or procedures to specify the language of the code.',
        example: 'CREATE FUNCTION function_name() RETURNS VOID LANGUAGE plpgsql AS $$ BEGIN ... END; $$;'
      },
      {
        name: 'LEADING',
        title: 'LEADING',
        description: 'Used in conjunction with the JOIN clause to indicate that the specified table is the primary table in the join.',
        example: 'SELECT * FROM table1 LEADING table2 ON table1.column = table2.column;'
      },
      {
        name: 'LEFT',
        title: 'LEFT',
        description: 'Used to specify a left join between two or more tables.',
        example: 'SELECT * FROM table1 LEFT JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'LIKE',
        title: 'LIKE',
        description: 'Used to search for a specified pattern in a column.',
        example: "SELECT * FROM table WHERE column1 LIKE '%pattern%';"
      },
      {
        name: 'LIMIT',
        title: 'LIMIT',
        description: 'Used to limit the number of rows returned by a query.',
        example: 'SELECT * FROM table LIMIT 10;'
      },
      {
        name: 'LOCALTIME',
        title: 'LOCALTIME',
        description: 'A function that returns the current local time.',
        example: 'SELECT LOCALTIME;'
      },
      {
        name: 'LOCALTIMESTAMP',
        title: 'LOCALTIMESTAMP',
        description: 'A function that returns the current local timestamp.',
        example: 'SELECT LOCALTIMESTAMP;'
      },
      {
        name: 'LUN',
        title: 'LUN',
        description: 'This keyword might be used in the context of storage and disk management.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) DISTSTYLE KEY DISTKEY (lun);'
      },
      {
        name: 'LUNS',
        title: 'LUNS',
        description: 'This keyword might be used in the context of storage and disk management.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) DISTSTYLE KEY DISTKEY (luns);'
      },
      {
        name: 'LZO',
        title: 'LZO',
        description: 'A compression algorithm used in Redshift to reduce data storage size.',
        example: "COPY table FROM 's3://bucket/file.lzo' CREDENTIALS 'aws_access_key_id=YOUR_KEY;aws_secret_access_key=YOUR_SECRET' LZOP;"
      },
      {
        name: 'LZOP',
        title: 'LZOP',
        description: 'A compression algorithm used in Redshift to reduce data storage size.',
        example: "COPY table FROM 's3://bucket/file.lzo' CREDENTIALS 'aws_access_key_id=YOUR_KEY;aws_secret_access_key=YOUR_SECRET' LZOP;"
      },
      {
        name: 'MINUS',
        title: 'MINUS',
        description: 'This keyword might be used in the context of set operations to indicate the subtraction of sets.',
        example: 'SELECT column1 FROM table1 MINUS SELECT column1 FROM table2;'
      },
      {
        name: 'MOSTLY16',
        title: 'MOSTLY16',
        description: 'This keyword might be used in the context of storage and disk management.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) DISTSTYLE KEY DISTKEY (mostly16);'
      },
      {
        name: 'MOSTLY32',
        title: 'MOSTLY32',
        description: 'This keyword might be used in the context of storage and disk management.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) DISTSTYLE KEY DISTKEY (mostly32);'
      },
      {
        name: 'MOSTLY8',
        title: 'MOSTLY8',
        description: 'This keyword might be used in the context of storage and disk management.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) DISTSTYLE KEY DISTKEY (mostly8);'
      },
      {
        name: 'NATURAL',
        title: 'NATURAL',
        description: 'Used in the context of joins to perform a natural join between two or more tables.',
        example: 'SELECT * FROM table1 NATURAL JOIN table2;'
      },
      {
        name: 'NEW',
        title: 'NEW',
        description: 'This keyword might be used in different contexts to indicate new or recently added elements.',
        example: 'CREATE TRIGGER trigger_name AFTER INSERT ON table FOR EACH ROW EXECUTE PROCEDURE function_name();'
      },
      {
        name: 'NOT',
        title: 'NOT',
        description: 'Used to negate a condition in a WHERE clause or other logical expressions.',
        example: 'SELECT * FROM table WHERE NOT column1 = value;'
      },
      {
        name: 'NOTNULL',
        title: 'NOTNULL',
        description: 'A function used to test whether a value is not NULL.',
        example: 'SELECT column1, NOTNULL(column2) FROM table;'
      },
      {
        name: 'NULL',
        title: 'NULL',
        description: 'A special value representing the absence of data.',
        example: 'SELECT * FROM table WHERE column1 IS NULL;'
      },
      {
        name: 'NULLS',
        title: 'NULLS',
        description: 'This keyword might be used in the context of ordering to specify whether NULL values should come first or last.',
        example: 'SELECT * FROM table ORDER BY column1 ASC NULLS FIRST;'
      },
      {
        name: 'OFF',
        title: 'OFF',
        description: 'This keyword might be used in different contexts to indicate that something is turned off or disabled.',
        example: 'ALTER TABLE table ALTER COLUMN column SET STATISTICS OFF;'
      },
      {
        name: 'OFFLINE',
        title: 'OFFLINE',
        description: 'This keyword might be used in different contexts to indicate that something is in an offline state.',
        example: 'ALTER TABLE table SET OFFLINE;'
      },
      {
        name: 'OFFSET',
        title: 'OFFSET',
        description: 'Used to skip a specified number of rows before returning the result set.',
        example: 'SELECT * FROM table OFFSET 10;'
      },
      {
        name: 'OID',
        title: 'OID',
        description: 'This keyword might be used in the context of storage and disk management.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR) WITH OIDS;'
      },
      {
        name: 'OLD',
        title: 'OLD',
        description: 'This keyword might be used in the context of triggers to refer to the old value of a column.',
        example: 'CREATE TRIGGER trigger_name BEFORE UPDATE ON table FOR EACH ROW EXECUTE PROCEDURE function_name();'
      },
      {
        name: 'ON',
        title: 'ON',
        description: 'Used to specify conditions for joining tables or trigger events.',
        example: 'CREATE TRIGGER trigger_name BEFORE INSERT ON table FOR EACH ROW EXECUTE PROCEDURE function_name();'
      },
      {
        name: 'ONLY',
        title: 'ONLY',
        description: 'Used in the context of DELETE or UPDATE statements to specify that only the specified table should be affected.',
        example: 'DELETE FROM table ONLY WHERE column1 = value;'
      },
      {
        name: 'OPEN',
        title: 'OPEN',
        description: 'This keyword might be used in different contexts to indicate that something is open or accessible.',
        example: 'OPEN cursor_name;'
      },
      {
        name: 'OR',
        title: 'OR',
        description: "Used to combine multiple conditions in a WHERE clause with an 'OR' logical operator.",
        example: 'SELECT * FROM table WHERE column1 = value OR column2 = value;'
      },
      {
        name: 'ORDER',
        title: 'ORDER',
        description: 'Used to specify the order in which rows are returned by a query.',
        example: 'SELECT * FROM table ORDER BY column1 ASC, column2 DESC;'
      },
      {
        name: 'OUTER',
        title: 'OUTER',
        description: 'Used to specify an outer join between two or more tables.',
        example: 'SELECT * FROM table1 LEFT OUTER JOIN table2 ON table1.column = table2.column;'
      },
      {
        name: 'OVERLAPS',
        title: 'OVERLAPS',
        description: 'Used to compare two time intervals to determine if they overlap.',
        example: 'SELECT * FROM table WHERE interval1 OVERLAPS interval2;'
      },
      {
        name: 'PARALLEL',
        title: 'PARALLEL',
        description: 'This keyword might be used in the context of query optimization to indicate parallel processing.',
        example: 'SELECT /*+ PARALLEL(8) */ * FROM table;'
      },
      {
        name: 'PARTITION',
        title: 'PARTITION',
        description: 'This keyword might be used in the context of partitioning data in a table.',
        example: 'CREATE TABLE table (id INT, name VARCHAR) PARTITION BY LIST (id);'
      },
      {
        name: 'PERCENT',
        title: 'PERCENT',
        description: 'Used in the context of an ANALYZE statement to specify that statistics should be gathered for a percentage of rows.',
        example: 'ANALYZE table PERCENT 10;'
      },
      {
        name: 'PERMISSIONS',
        title: 'PERMISSIONS',
        description: 'This keyword might be used in different contexts to indicate permissions or access rights.',
        example: 'GRANT SELECT ON table TO user;'
      },
      {
        name: 'PIVOT',
        title: 'PIVOT',
        description: 'This keyword might be used in different contexts to indicate pivoting data or transforming rows into columns.',
        example: 'SELECT * FROM table PIVOT (SUM(column) FOR column_name IN (value1, value2, value3));'
      },
      {
        name: 'PLACING',
        title: 'PLACING',
        description: 'Used in the context of a SELECT statement with aggregate functions to specify the order of results.',
        example: 'SELECT AVG(column1) FROM table GROUP BY column2 PLACING AVG(column1) DESC;'
      },
      {
        name: 'PRIMARY',
        title: 'PRIMARY',
        description: 'Used to define a primary key constraint on one or more columns in a table.',
        example: 'CREATE TABLE table (id INT PRIMARY KEY, name VARCHAR);'
      },
      {
        name: 'RAW',
        title: 'RAW',
        description: 'This keyword might be used in the context of raw data storage or processing.',
        example: "COPY table FROM 's3://bucket/file.raw' CREDENTIALS 'aws_access_key_id=YOUR_KEY;aws_secret_access_key=YOUR_SECRET' RAW;"
      },
      {
        name: 'READRATIO',
        title: 'READRATIO',
        description: 'This keyword might be used in the context of query optimization to indicate a preferred read-to-write ratio.',
        example: 'SELECT /*+ READRATIO(0.8) */ * FROM table;'
      },
      {
        name: 'RECOVER',
        title: 'RECOVER',
        description: 'This keyword might be used in the context of disaster recovery or data restoration.',
        example: 'RECOVER table;'
      },
      {
        name: 'REFERENCES',
        title: 'REFERENCES',
        description: 'Indicates a reference to another table or column.',
        example: 'CREATE TABLE my_table (id INT REFERENCES other_table(id))'
      },
      {
        name: 'REJECTLOG',
        title: 'REJECTLOG',
        description: 'Specifies that rejected rows should be logged in the reject file.',
        example: "COPY my_table FROM 's3://bucket/data.csv' CREDENTIALS 'aws_access_key_id=xxx;aws_secret_access_key=yyy' REJECTLOG 's3://bucket/rejects/'"
      },
      {
        name: 'RESORT',
        title: 'RESORT',
        description: 'Used to define or change the sort key for a table.',
        example: 'CREATE TABLE my_table (id INT SORTKEY)'
      },
      {
        name: 'RESPECT',
        title: 'RESPECT',
        description: 'Placeholder description for RESPECT.',
        example: 'RESPECT'
      },
      {
        name: 'RESTORE',
        title: 'RESTORE',
        description: 'Used to restore data from a snapshot or backup.',
        example: "RESTORE my_table FROM 's3://bucket/snapshot'"
      },
      {
        name: 'RIGHT',
        title: 'RIGHT',
        description: 'Placeholder description for RIGHT.',
        example: 'RIGHT'
      },
      {
        name: 'SELECT',
        title: 'SELECT',
        description: 'Used to query data from one or more tables.',
        example: 'SELECT * FROM my_table'
      },
      {
        name: 'SESSION_USER',
        title: 'SESSION_USER',
        description: 'Returns the name of the current user.',
        example: 'SELECT SESSION_USER'
      },
      {
        name: 'SIMILAR',
        title: 'SIMILAR',
        description: 'Placeholder description for SIMILAR.',
        example: 'SIMILAR'
      },
      {
        name: 'SNAPSHOT',
        title: 'SNAPSHOT',
        description: 'Used to create a snapshot of a table.',
        example: 'CREATE SNAPSHOT my_snapshot AS SELECT * FROM my_table'
      },
      {
        name: 'SOME',
        title: 'SOME',
        description: 'Placeholder description for SOME.',
        example: 'SOME'
      },
      {
        name: 'SYSDATE',
        title: 'SYSDATE',
        description: 'Returns the current date and time.',
        example: 'SELECT SYSDATE'
      },
      {
        name: 'SYSTEM',
        title: 'SYSTEM',
        description: 'Placeholder description for SYSTEM.',
        example: 'SYSTEM'
      },
      {
        name: 'START',
        title: 'START',
        description: 'Placeholder description for START.',
        example: 'START'
      },
      {
        name: 'TABLE',
        title: 'TABLE',
        description: 'Used to define a new table or query an existing table.',
        example: 'CREATE TABLE my_table (id INT)'
      },
      {
        name: 'TAG',
        title: 'TAG',
        description: 'Placeholder description for TAG.',
        example: 'TAG'
      },
      {
        name: 'TDES',
        title: 'TDES',
        description: 'Placeholder description for TDES.',
        example: 'TDES'
      },
      {
        name: 'TEXT255',
        title: 'TEXT255',
        description: 'Placeholder description for TEXT255.',
        example: 'TEXT255'
      },
      {
        name: 'TEXT32K',
        title: 'TEXT32K',
        description: 'Placeholder description for TEXT32K.',
        example: 'TEXT32K'
      },
      {
        name: 'THEN',
        title: 'THEN',
        description: 'Placeholder description for THEN.',
        example: 'THEN'
      },
      {
        name: 'TIMESTAMP',
        title: 'TIMESTAMP',
        description: 'Placeholder description for TIMESTAMP.',
        example: 'TIMESTAMP'
      },
      {
        name: 'TO',
        title: 'TO',
        description: 'Placeholder description for TO.',
        example: 'TO'
      },
      {
        name: 'TOP',
        title: 'TOP',
        description: 'Placeholder description for TOP.',
        example: 'TOP'
      },
      {
        name: 'TRAILING',
        title: 'TRAILING',
        description: 'Placeholder description for TRAILING.',
        example: 'TRAILING'
      },
      {
        name: 'TRUE',
        title: 'TRUE',
        description: 'Placeholder description for TRUE.',
        example: 'TRUE'
      },
      {
        name: 'TRUNCATECOLUMNS',
        title: 'TRUNCATECOLUMNS',
        description: 'Placeholder description for TRUNCATECOLUMNS.',
        example: 'TRUNCATECOLUMNS'
      },
      {
        name: 'UNION',
        title: 'UNION',
        description: 'Used to combine the result sets of two or more SELECT queries.',
        example: 'SELECT * FROM table1 UNION SELECT * FROM table2'
      },
      {
        name: 'UNIQUE',
        title: 'UNIQUE',
        description: 'Indicates that a column or combination of columns must have unique values.',
        example: 'CREATE TABLE my_table (id INT UNIQUE)'
      },
      {
        name: 'UNNEST',
        title: 'UNNEST',
        description: 'Used to transform an array into a table.',
        example: 'SELECT * FROM UNNEST(array_column) AS x'
      },
      {
        name: 'UNPIVOT',
        title: 'UNPIVOT',
        description: 'Placeholder description for UNPIVOT.',
        example: 'UNPIVOT'
      },
      {
        name: 'USER',
        title: 'USER',
        description: 'Returns the name of the current user.',
        example: 'SELECT USER'
      },
      {
        name: 'USING',
        title: 'USING',
        description: 'Used to specify a join method or table source.',
        example: 'SELECT * FROM table1 JOIN table2 USING (column)'
      },
      {
        name: 'VERBOSE',
        title: 'VERBOSE',
        description: 'Placeholder description for VERBOSE.',
        example: 'VERBOSE'
      },
      {
        name: 'WALLET',
        title: 'WALLET',
        description: 'Placeholder description for WALLET.',
        example: 'WALLET'
      },
      {
        name: 'WHEN',
        title: 'WHEN',
        description: 'Used in CASE expressions to specify conditions.',
        example: "CASE WHEN column > 10 THEN 'Large' ELSE 'Small' END"
      },
      {
        name: 'WHERE',
        title: 'WHERE',
        description: 'Used to filter rows in a SELECT statement.',
        example: 'SELECT * FROM my_table WHERE column = 1'
      },
      {
        name: 'WITH',
        title: 'WITH',
        description: 'Used to specify common table expressions (CTEs) or subqueries.',
        example: 'WITH cte AS (SELECT * FROM my_table) SELECT * FROM cte'
      },
      {
        name: 'WITHOUT',
        title: 'WITHOUT',
        description: 'Placeholder description for WITHOUT.',
        example: 'WITHOUT'
      },
      {
        name: 'APPROXIMATE',
        title: 'APPROXIMATE',
        description: '',
        example: 'APPROXIMATE'
      }
    ],
    'Math functions': [
      {
        name: 'ABS',
        title: 'ABS (number)',
        description: 'ABS calculates the absolute value of a number, where that number can be a literal or an expression that evaluates to a number.',
        example: 'select abs (-38) => 38'
      },
      {
        name: 'ACOS',
        title: 'ACOS(number)',
        description: 'ACOS is a trigonometric function that returns the arc cosine of a number. The return value is in radians and is between 0 and PI.',
        example: 'select acos(-1) => 3.14159265358979'
      },
      {
        name: 'ASIN',
        title: 'ASIN(number)',
        description: 'ASIN is a trigonometric function that returns the arc sine of a number. The return value is in radians and is between PI/2 and -PI/2.',
        example: 'select asin(1)*2 as pi => 3.14159265358979'
      },
      {
        name: 'ATAN',
        title: 'ATAN(number)',
        description: 'ATAN is a trigonometric function that returns the arc tangent of a number. The return value is in radians and is between -PI and PI.',
        example: 'select atan(1) * 4 as pi => 3.14159265358979'
      },
      {
        name: 'ATAN2',
        title: 'ATAN2(number1, number2)',
        description:
          'ATAN2 is a trigonometric function that returns the arc tangent of a one number divided by another number. The return value is in radians and is between PI/2 and -PI/2.',
        example: 'select atan2(2,2) * 4 as pi => 3.14159265358979'
      },
      {
        name: 'CBRT',
        title: 'CBRT (number)',
        description: 'The CBRT function is a mathematical function that calculates the cube root of a number.\n\n',
        example: 'select cbrt(commission) from sales where salesid=10000'
      },
      {
        name: 'CEILING',
        title: 'CEILING(number)',
        description:
          'The CEILING or CEIL function is used to round a number up to the next whole number. (The FLOOR function rounds a number down to the next whole number.)\n\n',
        example: 'select ceiling(commission) from sales\nwhere salesid=10000'
      },
      {
        name: 'CEIL',
        title: 'CEIL(number)',
        description:
          'The CEILING or CEIL function is used to round a number up to the next whole number. (The FLOOR function rounds a number down to the next whole number.)\n\n',
        example: 'select ceil(commission) from sales\nwhere salesid=10000'
      },
      {
        name: 'COS',
        title: 'COS(double_precision)',
        description: 'COS is a trigonometric function that returns the cosine of a number. The return value is in radians and is between -1 and 1, inclusive.',
        example: 'select cos(0) => 1'
      },
      {
        name: 'COT',
        title: 'COT(number)',
        description: 'COT is a trigonometric function that returns the cotangent of a number. The input parameter must be nonzero.',
        example: 'select cot(1) => 0.642092615934331'
      },
      {
        name: 'DEGREES',
        title: 'DEGREES(number)',
        description: 'Converts an angle in radians to its equivalent in degrees.\n\n',
        example: 'select degrees(.5) => 28.6478897565412'
      },
      {
        name: 'DEXP',
        title: 'DEXP(number)',
        description:
          'The DEXP function returns the exponential value in scientific notation for a double precision number. The only difference between the DEXP and EXP functions is that the parameter for DEXP must be a double precision.',
        example: 'select (select sum(qtysold) from sales, date\nwhere sales.dateid=date.dateid\nand year=2008) * dexp((7::float/100)*10) qty2010'
      },
      {
        name: 'DLOG1',
        title: 'DLOG1(number)',
        description: 'The DLOG1 function returns the natural logarithm of the input parameter. Synonym for the LN function.',
        example: 'select DLOG1(25) => 3.2188758248682'
      },
      {
        name: 'DLOG10',
        title: 'DLOG10(number)',
        description: 'The DLOG10 returns the base 10 logarithm of the input parameter. Synonym of the LOG function.',
        example: 'select dlog10(100) => 2'
      },
      {
        name: 'EXP',
        title: 'EXP (expression)',
        description:
          'The EXP function implements the exponential function for a numeric expression, or the base of the natural logarithm, e, raised to the power of expression. The EXP function is the inverse of LN function.',
        example: 'select (select sum(qtysold) from sales, date\nwhere sales.dateid=date.dateid\nand year=2008) * exp((7::float/100)*10) qty2018'
      },
      {
        name: 'FLOOR',
        title: 'FLOOR (number)',
        description: 'The FLOOR function rounds a number down to the next whole number.\n\n',
        example: 'select floor(commission) from sales\nwhere salesid=10000'
      },
      {
        name: 'LN',
        title: 'LN(expression)',
        description: 'Returns the natural logarithm of the input parameter. Synonym of the DLOG1 function.',
        example: 'select ln(2.718281828)  => 0.9999999998311267'
      },
      {
        name: 'LOG',
        title: 'LOG(number)',
        description: 'Returns the base 10 logarithm of a number.',
        example: 'select log(100)  => 2'
      },
      {
        name: 'MOD',
        title: 'MOD(number1, number2)',
        description:
          'Returns the remainder of two numbers, otherwise known as a modulo operation. To calculate the result, the first parameter is divided by the second.',
        example: 'SELECT MOD(10, 4) => 2'
      },
      {
        name: 'PI',
        title: 'PI()',
        description: 'The PI function returns the value of PI to 14 decimal places.',
        example: 'select pi() => 3.14159265358979'
      },
      {
        name: 'POWER',
        title: 'POWER (expression1, expression2)',
        description: 'The POWER function is an exponential function that raises a numeric expression to the power of a second numeric expression.',
        example: 'select power(2,3) => 8'
      },
      {
        name: 'POW',
        title: 'POW (expression1, expression2)',
        description: 'The POW function is an exponential function that raises a numeric expression to the power of a second numeric expression.',
        example: 'select pow(2,3) => 8'
      },
      {
        name: 'RADIANS',
        title: 'RADIANS(number)',
        description: 'Converts an angle in degrees to its equivalent in radians.\n\n',
        example: 'select radians(180) => 3.14159265358979'
      },
      {
        name: 'RANDOM',
        title: 'RANDOM()',
        description: 'The RANDOM function generates a random value between 0.0 (inclusive) and 1.0 (exclusive).',
        example: 'select cast (random() * 100)'
      },
      {
        name: 'ROUND',
        title: 'ROUND (number [ , integer ] )',
        description:
          "The ROUND function rounds numbers to the nearest integer or decimal.\n\nThe ROUND function can optionally include a second argument as an integer to indicate the number of decimal places for rounding, in either direction. When you don't provide the second argument, the function rounds to the nearest whole number. When the second argument >n is specified, the function rounds to the nearest number with n decimal places of precision.",
        example: 'select commission, round(commission, 1)\nfrom sales where salesid=10000'
      },
      {
        name: 'SIN',
        title: 'SIN(number)',
        description: 'SIN is a trigonometric function that returns the sine of a number. The return value is between -1 and 1.\n\n',
        example: 'select sin(-pi()) => -1.22464679914735e-16'
      },
      {
        name: 'SIGN',
        title: 'SIGN(number)',
        description:
          'The SIGN function returns the sign (positive or negative) of a number. The result of the SIGN function is 1, -1, or 0 indicating the sign of the argument.',
        example: 'select commission, sign (commission)\nfrom sales where salesid=10000'
      },
      {
        name: 'SQRT',
        title: 'SQRT (expression)',
        description: 'The SQRT function returns the square root of a numeric value. The square root is a number multiplied by itself to get the given value.',
        example: 'select sqrt(16) => 4'
      },
      {
        name: 'TAN',
        title: 'TAN(number)',
        description: 'TAN is a trigonometric function that returns the tangent of a number. The input parameter must be a non-zero number (in radians).\n\n',
        example: 'select tan(0) => 0'
      },
      {
        name: 'TRUNC',
        title: 'TRUNC (number [ , integer ])',
        description:
          "The TRUNC function truncates numbers to the previous integer or decimal.\n\nThe TRUNC function can optionally include a second argument as an integer to indicate the number of decimal places for rounding, in either direction. When you don't provide the second argument, the function rounds to the nearest whole number. When the second argument >nis specified, the function rounds to the nearest number with >n decimal places of precision. This function also truncates a timestamp and returns a date.\n\n",
        example: 'select commission, trunc(commission,1)\nfrom sales where salesid=784'
      }
    ],
    'Object functions': [
      {
        name: 'OBJECT',
        title: 'OBJECT ( [ key1, value1 ] [, key2, value2 ...] )',
        description: 'Creates an object of the SUPER data type.',
        example: ' select object(\'a\', 1, \'b\', true, \'c\', 3.14) =>   {"a":1,"b":true,"c":3.14}'
      }
    ],
    Operators: [],
    'String functions': [
      {
        name: 'ASCII',
        title: 'ASCII(string)',
        description: 'The ASCII function returns the ASCII code, or the Unicode code-point, of the first character in the string that you specify.',
        example: "select ascii('amazon') => 97"
      },
      {
        name: 'BTRIM',
        title: 'BTRIM(string [, trim_chars ] )',
        description:
          'The BTRIM function trims a string by removing leading and trailing blanks or by removing leading and trailing characters that match an optional specified string.',
        example: 'select userid, firstname, lastname,\nbpcharcmp(firstname, lastname)\nfrom users\norder by 1, 2, 3, 4\nlimit 10'
      },
      {
        name: 'BPCHARCMP',
        title: 'BPCHARCMP(string1, string2)',
        description:
          'Compares the value of two strings and returns an integer. If the strings are identical, returns 0. If the first string is "greater" alphabetically, returns 1. If the second string is "greater", returns -1.\n\n',
        example: "select 'xyzaxyzbxyzcxyz' as untrim,\nbtrim('xyzaxyzbxyzcxyz', 'xyz') as trim"
      },
      {
        name: 'BTTEXT_PATTERN_CMP',
        title: 'BTTEXT_PATTERN_CMP(string1, string2)',
        description:
          'Compares the value of two strings and returns an integer. If the strings are identical, returns 0. If the first string is "greater" alphabetically, returns 1. If the second string is "greater", returns -1.',
        example: 'select userid, firstname, lastname,\nbpcharcmp(firstname, lastname)\nfrom users\norder by 1, 2, 3, 4\nlimit 10'
      },
      {
        name: 'CHAR_LENGTH',
        title: 'CHAR_LENGTH(string)',
        description: 'Returns the length of the specified string as the number of characters.',
        example: "select CHAR_LENGTH('français') => 8"
      },
      {
        name: 'TEXTLEN',
        title: 'TEXTLEN(string)',
        description: 'Returns the length of the specified string as the number of characters.',
        example: "select TEXTLEN('français') => 8"
      },
      {
        name: 'LEN',
        title: 'LEN(string)',
        description: 'Returns the length of the specified string as the number of characters.',
        example: "select len('français') => 8"
      },
      {
        name: 'LENGTH',
        title: 'LENGTH(string)',
        description: 'Returns the length of the specified string as the number of characters.',
        example: "select LENGTH('français') => 8"
      },
      {
        name: 'CHARACTER_LENGTH',
        title: 'CHARACTER_LENGTH(string)',
        description: 'Returns the length of the specified string as the number of characters.',
        example: "select CHARACTER_LENGTH('français') => 8"
      },
      {
        name: 'CHARINDEX',
        title: 'CHARINDEX( substring, string )',
        description: 'Returns the location of the specified substring within a string.',
        example: "select charindex('dog', 'fish') => 0"
      },
      {
        name: 'CHR',
        title: 'CHR(number)',
        description: 'The CHR function returns the character that matches the ASCII code point value specified by of the input parameter.\n\n',
        example: 'select distinct eventname from event\nwhere substring(eventname, 1, 1)=chr(65)'
      },
      {
        name: 'CONCAT',
        title: 'CONCAT ( expression1, expression2 )',
        description:
          'The CONCAT function concatenates two expressions and returns the resulting expression. To concatenate more than two expressions, use nested CONCAT functions. The concatenation operator (||) between two expressions produces the same results as the CONCAT function.',
        example: "select concat('December 25, ', '2008') => December 25, 2008"
      },
      {
        name: 'CRC32',
        title: 'CRC32(string)',
        description:
          'CRC32 is an error-detecting function that uses a CRC32 algorithm to detect changes between source and target data. The CRC32 function converts a variable-length string into an 8-character string that is a text representation of the hexadecimal value of a 32 bit-binary sequence.',
        example: "select crc32('Amazon Redshift') => f2726906"
      },
      {
        name: 'DIFFERENCE',
        title: 'DIFFERENCE(string1, string2)',
        description:
          'The DIFFERENCE function compares two strings by converting the strings to American Soundex codes and returning an INTEGER to indicate the difference between the codes.',
        example: "select difference('Amazon', '+-*/%') => 0"
      },
      {
        name: 'INITCAP',
        title: 'INITCAP(string)',
        description:
          'Capitalizes the first letter of each word in a specified string. INITCAP supports UTF-8 multibyte characters, up to a maximum of four bytes per character.',
        example: 'select initcap(catname)\nfrom category\norder by catname'
      },
      {
        name: 'LEFT',
        title: 'LEFT ( string,  integer )',
        description: 'These functions return the specified number of leftmost characters from a character string.',
        example:
          'select eventid, eventname,\nleft(eventname,5) as left_5,\nright(eventname,5) as right_5\nfrom event\nwhere eventid between 1000 and 1005\norder by 1'
      },
      {
        name: 'RIGHT',
        title: 'RIGHT ( string,  integer )',
        description: 'These functions return the specified number of rightmost characters from a character string.',
        example:
          'select eventid, eventname,\nleft(eventname,5) as left_5,\nright(eventname,5) as right_5\nfrom event\nwhere eventid between 1000 and 1005\norder by 1'
      },
      {
        name: 'LOWER',
        title: 'LOWER(string)',
        description: 'Converts a string to lowercase. LOWER supports UTF-8 multibyte characters, up to a maximum of four bytes per character.\n\n',
        example: 'select catname, lower(catname) from category order by 1,2'
      },
      {
        name: 'LPAD',
        title: 'LPAD (string1, length, [ string2 ])',
        description: 'These functions prepend characters to a string, based on a specified length.',
        example: 'select lpad(eventname,20) from event\nwhere eventid between 1 and 5 order by 1'
      },
      {
        name: 'RPAD',
        title: 'RPAD (string1, length, [ string2 ])',
        description: 'These functions append characters to a string, based on a specified length.',
        example: "select rpad(eventname,20,'0123456789') from event\nwhere eventid between 1 and 5 order by 1"
      },
      {
        name: 'LTRIM',
        title: 'LTRIM( string [, trim_chars] )',
        description:
          'Trims characters from the beginning of a string. Removes the longest string containing only characters in the trim characters list. Trimming is complete when a trim character does not appear in the input string.',
        example: "select ltrim('  2008-01-24 06:43:29') => 2008-01-24 06:43:29"
      },
      {
        name: 'OCTETINDEX',
        title: 'OCTETINDEX(substring, string)',
        description: 'The OCTETINDEX function returns the location of a substring within a string as a number of bytes.\n\n',
        example: "select octetindex('AWS', 'Amazon AWS') => 8"
      },
      {
        name: 'OCTET_LENGTH',
        title: 'OCTET_LENGTH(expression)',
        description: 'Returns the length of the specified string as the number of bytes.',
        example: "select octet_length('français') => 9"
      },
      {
        name: 'POSITION',
        title: 'POSITION(substring IN string )',
        description: 'Returns the location of the specified substring within a string.',
        example: "select position('dog' in 'fish') => 0"
      },
      {
        name: 'POSITION',
        title: 'POSITION(substring IN string )',
        description: 'Returns the location of the specified substring within a string.',
        example: "select position('dog' in 'fish') => 0"
      },
      {
        name: 'QUOTE_IDENT',
        title: 'QUOTE_IDENT(string)',
        description:
          'The QUOTE_IDENT function returns the specified string as a string in double quotation marks so that it can be used as an identifier in a SQL statement. Appropriately doubles any embedded double quotation marks.\n\n',
        example: 'select catid, quote_ident(catname)\nfrom category\norder by 1,2'
      },
      {
        name: 'QUOTE_LITERAL',
        title: 'QUOTE_LITERAL(string)',
        description:
          'The QUOTE_LITERAL function returns the specified string as a quoted string so that it can be used as a string literal in a SQL statement. If the input parameter is a number, QUOTE_LITERAL treats it as a string. Appropriately doubles any embedded single quotation marks and backslashes.',
        example: 'select quote_literal(catid), catname\nfrom category\norder by 1,2'
      },
      {
        name: 'REGEXP_COUNT',
        title: 'REGEXP_COUNT ( source_string, pattern [, position [, parameters ] ] )',
        description:
          'Searches a string for a regular expression pattern and returns an integer that indicates the number of times the pattern occurs in the string. If no match is found, then the function returns 0. For more information about regular expressions, see POSIX operators.',
        example: "SELECT regexp_count('abcdefghijklmnopqrstuvwxyz', '[a-z]{3}') => 8"
      },
      {
        name: 'REGEXP_REPLACE',
        title: 'REGEXP_REPLACE ( source_string, pattern [, replace_string [ , position [, parameters ] ] ] )',
        description:
          'Searches a string for a regular expression pattern and returns an integer that indicates the beginning position or ending position of the matched substring. If no match is found, then the function returns 0. REGEXP_INSTR is similar to the POSITION function, but lets you search a string for a regular expression pattern. For more information about regular expressions, see POSIX operators.\n\n',
        example: "SELECT regexp_replace('the fox', 'FOX', 'quick brown fox', 1, 'i') => the quick brown fox"
      },
      {
        name: 'REGEXP_SUBSTR',
        title: 'REGEXP_SUBSTR ( source_string, pattern [, position [, occurrence [, parameters ] ] ] )',
        description:
          "Returns characters from a string by searching it for a regular expression pattern. REGEXP_SUBSTR is similar to the SUBSTRING function function, but lets you search a string for a regular expression pattern. If the function can't match the regular expression to any characters in the string, it returns an empty string. For more information about regular expressions, see POSIX operators.",
        example: "SELECT regexp_substr('THE SECRET CODE IS THE LOWERCASE PART OF 1931abc0EZ.', '[a-z]+', 1, 1, 'c') => abc"
      },
      {
        name: 'REPEAT',
        title: 'REPEAT(string, integer)',
        description: 'Repeats a string the specified number of times. If the input parameter is numeric, REPEAT treats it as a string.',
        example: 'select catid, repeat(catid,3)\nfrom category\norder by 1,2'
      },
      {
        name: 'REPLICATE',
        title: 'REPLICATE(string, integer)',
        description: 'Repeats a string the specified number of times. If the input parameter is numeric, REPEAT treats it as a string.',
        example: 'select catid, REPLICATE(catid,3)\nfrom category\norder by 1,2'
      },
      {
        name: 'REPLACE',
        title: 'REPLACE(string1, old_chars, new_chars)',
        description: 'Replaces all occurrences of a set of characters within an existing string with other specified characters.',
        example: "select catid, catgroup,\nreplace(catgroup, 'Shows', 'Theatre')\nfrom category\norder by 1,2,3"
      },
      {
        name: 'REVERSE',
        title: 'REVERSE ( expression )',
        description:
          "The REVERSE function operates on a string and returns the characters in reverse order. For example, reverse('abcde') returns edcba. This function works on numeric and date data types as well as character data types; however, in most cases it has practical value for character strings.\n\n",
        example: 'select distinct city as cityname, reverse(cityname)\nfrom users order by city limit 5'
      },
      {
        name: 'RTRIM',
        title: 'RTRIM( string, trim_chars )',
        description:
          'The RTRIM function trims a specified set of characters from the end of a string. Removes the longest string containing only characters in the trim characters list. Trimming is complete when a trim character does not appear in the input string.\n\n',
        example: "select 'xyzaxyzbxyzcxyz' as untrim,\nrtrim('xyzaxyzbxyzcxyz', 'xyz') as trim"
      },
      {
        name: 'SOUNDEX',
        title: 'SOUNDEX(string)',
        description:
          'The SOUNDEX function returns the American Soundex value consisting of the first letter followed by a 3–digit encoding of the sounds that represent the English pronunciation of the string that you specify.',
        example: "select soundex('AWS Amazon') => A252"
      },
      {
        name: 'SPLIT_PART',
        title: 'SPLIT_PART(string, delimiter, position)',
        description: 'Splits a string on the specified delimiter and returns the part at the specified position.\n\n',
        example: "select split_part('abc$def$ghi','$',2) => def"
      },
      {
        name: 'STRPOS',
        title: 'STRPOS(string, substring )',
        description: 'Returns the position of a substring within a specified string.',
        example: "select strpos('dogfish', 'fist') => 0"
      },
      {
        name: 'SUBSTRING',
        title: 'SUBSTRING(character_string, start_position, number_characters )',
        description:
          "Returns the subset of a string based on the specified start position.\n\nIf the input is a character string, the start position and number of characters extracted are based on characters, not bytes, so that multi-byte characters are counted as single characters. If the input is a binary expression, the start position and extracted substring are based on bytes. You can't specify a negative length, but you can specify a negative starting position.",
        example: "select substring('caterpillar',6,4) => pill"
      },
      {
        name: 'SUBSTR',
        title: 'SUBSTR(character_string, start_position, number_characters )',
        description:
          "Returns the subset of a string based on the specified start position.\n\nIf the input is a character string, the start position and number of characters extracted are based on characters, not bytes, so that multi-byte characters are counted as single characters. If the input is a binary expression, the start position and extracted substring are based on bytes. You can't specify a negative length, but you can specify a negative starting position.",
        example: "select SUBSTR('caterpillar',6,4) => pill"
      },
      {
        name: 'TRANSLATE',
        title: 'TRANSLATE ( expression, characters_to_replace, characters_to_substitute )',
        description:
          '\nRSS\nFor a given expression, replaces all occurrences of specified characters with specified substitutes. Existing characters are mapped to replacement characters by their positions in the characters_to_replace and characters_to_substitute arguments. If more characters are specified in the characters_to_replace argument than in the characters_to_substitute argument, the extra characters from the characters_to_replace argument are omitted in the return value.',
        example: "select translate('mint tea', 'inea', 'osin') => most tin"
      },
      {
        name: 'TRIM',
        title: 'TRIM( [ BOTH ] [trim_chars FROM ] string ] )',
        description:
          'Trims a string by removing leading and trailing blanks or by removing leading and trailing characters that match an optional specified string.',
        example: "select trim('\"' FROM '\"dog\"') => dog"
      },
      {
        name: 'UPPER',
        title: 'UPPER(string)',
        description: 'Converts a string to uppercase. UPPER supports UTF-8 multibyte characters, up to a maximum of four bytes per character.',
        example: 'select catname, upper(catname) from category order by 1,2'
      }
    ]
  }
});
