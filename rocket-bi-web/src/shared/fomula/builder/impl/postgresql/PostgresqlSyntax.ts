export const getPostgresqlSyntax = () => ({
  name: 'postgresql',
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
        name: 'array_agg',
        title: 'array_agg(expression)',
        description: 'Concatenate input values into an array.',
        example: 'SELECT array_agg(column_name) FROM table_name'
      },
      {
        name: 'avg',
        title: 'avg(expression)',
        description: 'Calculate the average (arithmetic mean) of a set of values.',
        example: 'SELECT avg(salary) FROM employees'
      },
      {
        name: 'bit_and',
        title: 'bit_and(bitstring)',
        description: 'Bitwise AND of all input values.',
        example: 'SELECT bit_and(flags) FROM bit_flags_table'
      },
      {
        name: 'bit_or',
        title: 'bit_or(bitstring)',
        description: 'Bitwise OR of all input values.',
        example: 'SELECT bit_or(flags) FROM bit_flags_table'
      },
      {
        name: 'bool_and',
        title: 'bool_and(boolean)',
        description: 'True if all input values are true, otherwise false.',
        example: 'SELECT bool_and(is_active) FROM users'
      },
      {
        name: 'bool_or',
        title: 'bool_or(boolean)',
        description: 'True if at least one input value is true, otherwise false.',
        example: 'SELECT bool_or(is_active) FROM users'
      },
      {
        name: 'count',
        title: 'count(*)',
        description: 'Total number of input rows.',
        example: 'SELECT count(*) FROM table_name'
      },
      {
        name: 'json_agg',
        title: 'json_agg(expression)',
        description: 'Aggregates values as a JSON array.',
        example: 'SELECT json_agg(column_name) FROM table_name'
      },
      {
        name: 'max',
        title: 'max(expression)',
        description: 'Maximum value of a set of values.',
        example: 'SELECT max(salary) FROM employees'
      },
      {
        name: 'min',
        title: 'min(expression)',
        description: 'Minimum value of a set of values.',
        example: 'SELECT min(salary) FROM employees'
      },
      {
        name: 'string_agg',
        title: 'string_agg(expression, delimiter)',
        description: 'Concatenate input strings separated by a delimiter.',
        example: "SELECT string_agg(name, ', ') FROM employees"
      },
      {
        name: 'sum',
        title: 'sum(expression)',
        description: 'Sum of a set of values.',
        example: 'SELECT sum(quantity) FROM sales'
      },
      {
        name: 'corr',
        title: 'corr(Y, X)',
        description: 'Return correlation coefficient as double precision',
        example: 'SELECT corr(height, weight) FROM people'
      },
      {
        name: 'covar_pop',
        title: 'covar_pop(Y, X)',
        description: 'Return population covariance as double precision',
        example: 'SELECT covar_pop(height, weight) FROM people'
      },
      {
        name: 'covar_samp',
        title: 'covar_samp(Y, X)',
        description: 'Return sample covariance as double precision',
        example: 'SELECT covar_samp(height, weight) FROM people'
      },
      {
        name: 'regr_avgx',
        title: 'regr_avgx(Y, X)',
        description: 'Return average of the independent variable (sum(X)/N) as double precision',
        example: ''
      },
      {
        name: 'regr_avgy',
        title: 'regr_avgy(Y, X)',
        description: 'Return average of the dependent variable (sum(Y)/N) as double precision',
        example: ''
      },
      {
        name: 'regr_count',
        title: 'regr_count(Y, X)',
        description: 'Return number of input rows in which both expressions are nonnull as bigint',
        example: ''
      },
      {
        name: 'regr_intercept',
        title: 'regr_intercept(Y, X)',
        description: 'Return y-intercept of the least-squares-fit linear equation determined by the (X, Y) pairs as double precision',
        example: ''
      },
      {
        name: 'regr_r2',
        title: 'regr_r2(Y, X)',
        description: 'Return square of the correlation coefficient as double precision',
        example: ''
      },
      {
        name: 'regr_slope',
        title: 'regr_slope(Y, X)',
        description: 'Return slope of the least-squares-fit linear equation determined by the (X, Y) pairs as double precision',
        example: ''
      },
      {
        name: 'regr_sxx',
        title: 'regr_sxx(Y, X)',
        description: 'Return sum(X^2) - sum(X)^2/N ("sum of squares" of the independent variable) as double precision',
        example: ''
      },
      {
        name: 'regr_sxy',
        title: 'regr_sxy(Y, X)',
        description: 'Return sum(X*Y) - sum(X) * sum(Y)/N ("sum of products" of independent times dependent variable) as double precision',
        example: ''
      },
      {
        name: 'stddev',
        title: 'stddev(expression)',
        description: 'Historical alias for stddev_samp.  as double precision. Return double precision for floating-point arguments, otherwise numeric',
        example: ''
      },
      {
        name: 'stddev_pop',
        title: 'stddev_pop(expression)',
        description: 'Population standard deviation of the input values. Return double precision for floating-point arguments, otherwise numeric',
        example: ''
      },
      {
        name: 'stddev_samp',
        title: 'stddev_samp(expression)',
        description: 'sample standard deviation of the input values. Return double precision for floating-point arguments, otherwise numeric',
        example: ''
      },
      {
        name: 'variance',
        title: 'variance(expression)',
        description: 'Historical alias for var_samp. Return double precision for floating-point arguments, otherwise numeric',
        example: ''
      },
      {
        name: 'var_pop',
        title: 'var_pop(expression)',
        description:
          'population variance of the input values (square of the population standard deviation). Return double precision for floating-point arguments, otherwise numeric',
        example: ''
      },
      {
        name: 'var_samp',
        title: 'var_samp(expression)',
        description:
          'Sample variance of the input values (square of the sample standard deviation). Return double precision for floating-point arguments, otherwise numeric',
        example: ''
      }
    ],
    BuildInFunctions: [
      {
        name: 'abbrev',
        title: 'abbrev(inet|cidr)',
        description: 'The abbrev() function returns abbreviated display format as text',
        example: "SELECT abbrev(inet '10.1.0.0/16')"
      },
      {
        name: 'abs',
        title: 'abs(number)',
        description: 'The abs() function returns the absolute value of the input number.',
        example: 'SELECT abs(-10)'
      },
      {
        name: 'acldefault',
        title: 'acldefault(ACL, privilege)',
        description:
          "acldefault ( type \"char\", ownerId oid ) → aclitem[]\n\nConstructs an aclitem array holding the default access privileges for an object of type type belonging to the role with OID ownerId. This represents the access privileges that will be assumed when an object's ACL entry is null. (The default access privileges are described in Section PostgreSQL 5.7.) The type parameter must be one of 'c' for COLUMN, 'r' for TABLE and table-like objects, 's' for SEQUENCE, 'd' for DATABASE, 'f' for FUNCTION or PROCEDURE, 'l' for LANGUAGE, 'L' for LARGE OBJECT, 'n' for SCHEMA, 'p' for PARAMETER, 't' for TABLESPACE, 'F' for FOREIGN DATA WRAPPER, 'S' for FOREIGN SERVER, or 'T' for TYPE or DOMAIN.",
        example: "SELECT acldefault('public=arwdDxt', 'insert')"
      },
      {
        name: 'aclexplode',
        title: 'aclexplode(ACL)',
        description:
          'aclexplode ( aclitem[] ) → setof record ( grantor oid, grantee oid, privilege_type text, is_grantable boolean )\n\nReturns the aclitem array as a set of rows. If the grantee is the pseudo-role PUBLIC, it is represented by zero in the grantee column. Each granted privilege is represented as SELECT, INSERT, etc. Note that each privilege is broken out as a separate row, so only one keyword appears in the privilege_type column.',
        example: "SELECT * FROM aclexplode('public=arwdDxt/admin=rwd')"
      },
      {
        name: 'acos',
        title: 'acos(number)',
        description: 'The acos() function returns the arc cosine of the input number.',
        example: 'SELECT acos(0.5)'
      },
      {
        name: 'acosd',
        title: 'acosd(number)',
        description: 'The acosd() function returns the arc cosine in degrees of the input number.',
        example: 'SELECT acosd(0.5)'
      },
      {
        name: 'acosh',
        title: 'acosh(number)',
        description: 'The acosh() function returns the inverse hyperbolic cosine of the input number.',
        example: 'SELECT acosh(2)'
      },
      {
        name: 'any',
        title: 'any(array)',
        description: 'The any() function returns true if any element in the input array satisfies the condition.',
        example: 'SELECT * FROM products WHERE price > any(ARRAY[10, 20, 30])'
      },
      {
        name: 'area',
        title: 'area(object)',
        description: 'area',
        example: "SELECT area(box '((0,0),(1,1))')"
      },
      {
        name: 'array_append',
        title: 'array_append(array, element)',
        description: 'The array_append() function appends an element to the end of the input array.',
        example: 'SELECT array_append(ARRAY[1, 2, 3], 4)'
      },
      {
        name: 'array_cat',
        title: 'array_cat(array1, array2)',
        description: 'The array_cat() function concatenates two arrays.',
        example: 'SELECT array_cat(ARRAY[1, 2], ARRAY[3, 4])'
      },
      {
        name: 'array_dims',
        title: 'array_dims(array)',
        description: 'The array_dims() function returns the dimensions of the input array.',
        example: 'SELECT array_dims(ARRAY[1, 2, 3])'
      },
      {
        name: 'array_fill',
        title: 'array_fill(anyelement, int[], [, int[]])',
        description: 'This function is used to return an array initialized with supplied value and dimensions, optionally with lower bounds other than 1.',
        example: 'SELECT array_fill(1, ARRAY[5])'
      },
      {
        name: 'array_length',
        title: 'array_length(array, dimension)',
        description: 'The array_length() function returns the length of the specified dimension in the input array.',
        example: 'SELECT array_length(ARRAY[1, 2, 3], 1)'
      },
      {
        name: 'array_lower',
        title: 'array_lower(array, dimension)',
        description: 'The array_lower() function returns the lower bound of the specified dimension in the input array.',
        example: 'SELECT array_lower(ARRAY[1, 2, 3], 1)'
      },
      {
        name: 'array_ndims',
        title: 'array_ndims(array)',
        description: 'The array_ndims() function returns the number of dimensions in the input array.',
        example: 'SELECT array_ndims(ARRAY[[1, 2], [3, 4]])'
      },
      {
        name: 'array_position',
        title: 'array_position(array, element)',
        description: 'The array_position() function returns the position of the first occurrence of the specified element in the input array.',
        example: "SELECT array_position(ARRAY['apple', 'banana', 'orange'], 'banana')"
      },
      {
        name: 'array_positions',
        title: 'array_positions(array, element)',
        description: 'The array_positions() function returns an array of positions of all occurrences of the specified element in the input array.',
        example: "SELECT array_positions(ARRAY['apple', 'banana', 'orange', 'banana'], 'banana')"
      },
      {
        name: 'array_prepend',
        title: 'array_prepend(element, array)',
        description: 'The array_prepend() function prepends an element to the beginning of the input array.',
        example: 'SELECT array_prepend(0, ARRAY[1, 2, 3])'
      },
      {
        name: 'array_remove',
        title: 'array_remove(array, element)',
        description: 'The array_remove() function removes all occurrences of the specified element from the input array.',
        example: "SELECT array_remove(ARRAY['apple', 'banana', 'orange', 'banana'], 'banana')"
      },
      {
        name: 'array_replace',
        title: 'array_replace(array, search_element, replacement)',
        description: 'The array_replace() function replaces all occurrences of the search_element with the replacement in the input array.',
        example: "SELECT array_replace(ARRAY['apple', 'banana', 'orange', 'banana'], 'banana', 'grape')"
      },
      {
        name: 'array_to_json',
        title: 'array_to_json(array)',
        description: 'The array_to_json() function converts the input array to a JSON array.',
        example: 'SELECT array_to_json(ARRAY[1, 2, 3])'
      },
      {
        name: 'array_to_string',
        title: 'array_to_string(array, delimiter)',
        description: 'The array_to_string() function concatenates elements of the input array into a string using the specified delimiter.',
        example: "SELECT array_to_string(ARRAY['apple', 'banana', 'orange'], ', ')"
      },
      {
        name: 'array_to_tsvector',
        title: 'array_to_tsvector(array)',
        description: 'The array_to_tsvector() function converts the input array to a tsvector.',
        example: "SELECT array_to_tsvector(ARRAY['PostgreSQL', 'is', 'awesome'])"
      },
      {
        name: 'array_upper',
        title: 'array_upper(anyarray, int)',
        description: 'Returns the upper bound of the specified dimension in an array.',
        example: 'SELECT array_upper(Array[1,2,3,4,5], 1) => 5'
      },
      {
        name: 'asin',
        title: 'asin(double precision)',
        description: 'Returns the arc sine (inverse sine) of a given angle in radians.',
        example: 'SELECT asin(0.5) => 0.52'
      },
      {
        name: 'asind',
        title: 'asind(double precision)',
        description: 'Returns the arc sine (inverse sine) of a given angle in degrees.',
        example: 'SELECT asind(1) => 90'
      },
      {
        name: 'asinh',
        title: 'asinh(double precision)',
        description: 'Returns the hyperbolic arc sine of a number.',
        example: 'SELECT asinh(2.0) => 1.44'
      },
      {
        name: 'atan',
        title: 'atan(double precision)',
        description: 'Returns the arc tangent (inverse tangent) of a number in radians.',
        example: 'SELECT atan(1.0) => 0.79'
      },
      {
        name: 'atan2',
        title: 'atan2(double precision, double precision)',
        description: 'Returns the arc tangent (inverse tangent) of the quotient of its arguments.',
        example: 'SELECT atan2(1.0, 2.0) => 0.46'
      },
      {
        name: 'atan2d',
        title: 'atan2d(double precision, double precision)',
        description: 'Returns the arc tangent (inverse tangent) of the quotient of its arguments in degrees.',
        example: 'SELECT atan2d(1.0, 2.0) => 26.57'
      },
      {
        name: 'atand',
        title: 'atand(double precision)',
        description: 'Returns the arc tangent (inverse tangent) of a number in degrees.',
        example: 'SELECT atand(1.0) => 45'
      },
      {
        name: 'atanh',
        title: 'atanh(double precision)',
        description: 'Returns the hyperbolic arc tangent of a number.',
        example: 'SELECT atanh(0.5) => 0.55'
      },
      {
        name: 'avg',
        title: 'avg(expression)',
        description: 'Calculates the average (arithmetic mean) of a set of values.',
        example: 'SELECT avg(salary) FROM employees'
      },
      {
        name: 'bit_and',
        title: 'bit_and(expression)',
        description: 'The bitwise AND of all non-null input values, or null if none. Return the same type as argument data type.',
        example: 'SELECT bit_and(x) FROM ( SELECT 4 x UNION SELECT 5 x ) t => 4'
      },
      {
        name: 'bit_length',
        title: 'bit_length(string)',
        description: 'Returns the number of bits in a string.',
        example: "SELECT bit_length('hello') =>  40"
      },
      {
        name: 'bit_or',
        title: 'bit_or(expression)',
        description:
          'The PostgreSQL bit_or() function returns values of the same type as the input parameters, and it returns the result of performing a “bitwise OR” operation on all non-null input values.',
        example: 'SELECT bit_or(x) FROM ( SELECT 4 x UNION SELECT 5 x ) t => 5'
      },
      {
        name: 'bit_xor',
        title: 'bit_xor(expression)',
        description: 'Performs a bitwise XOR operation on two bit strings.',
        example: 'SELECT bit_xor(x) FROM ( SELECT 4 x UNION SELECT 5 x ) t => '
      },
      {
        name: 'bool_and',
        title: 'bool_and(boolean)',
        description: 'Returns true if all input values are true, otherwise false.',
        example: 'SELECT bool_and(true, false, true);'
      },
      {
        name: 'bool_or',
        title: 'bool_or(boolean)',
        description: 'Returns true if at least one input value is true, otherwise false.',
        example: 'SELECT bool_or(true, false, true);'
      },
      {
        name: 'bound_box',
        title: 'bound_box(point, double precision)',
        description: 'Returns a bounding box (rectangle) around a point with a specified size.',
        example: 'SELECT bound_box(point(2, 3), 1.5);'
      }
    ],
    'Data Types': [
      {
        name: 'to_char',
        title: 'to_char(value, format)',
        description: 'Converts a value to a string with a specified format.',
        example: "SELECT to_char(123.45, '999.99');"
      },
      {
        name: 'to_date',
        title: 'to_date(text, text)',
        description: 'Converts a text string to a date value using the specified format.',
        example: "SELECT to_date('2023-07-25', 'YYYY-MM-DD');"
      },
      {
        name: 'to_timestamp',
        title: 'to_timestamp(text, text)',
        description: 'Converts a text string to a timestamp value using the specified format.',
        example: "SELECT to_timestamp('2023-07-25 12:34:56', 'YYYY-MM-DD HH24:MI:SS');"
      },
      {
        name: 'to_number',
        title: 'to_number(text, text)',
        description: 'Converts a text string to a numeric value using the specified format.',
        example: "SELECT to_number('123.45', '999.99');"
      },
      {
        name: 'to_hex',
        title: 'to_hex(integer)',
        description: 'Converts an integer to its hexadecimal representation.',
        example: 'SELECT to_hex(255);'
      },
      {
        name: 'encode',
        title: 'encode(bytea, format)',
        description: 'Converts binary data to a textual representation using the specified format.',
        example: "SELECT encode(E'\\x48656C6C6F', 'escape');"
      },
      {
        name: 'decode',
        title: 'decode(text, format)',
        description: 'Converts a textual representation of binary data back to binary using the specified format.',
        example: "SELECT decode('48656C6C6F', 'hex');"
      },
      {
        name: 'date_part',
        title: 'date_part(text, timestamp)',
        description: 'Extracts a specific part (e.g., year, month, day) from a timestamp.',
        example: "SELECT date_part('year', '2023-07-25');"
      },
      {
        name: 'date_trunc',
        title: 'date_trunc(text, timestamp)',
        description: 'Truncates a timestamp to the specified precision.',
        example: "SELECT date_trunc('hour', '2023-07-25 12:34:56');"
      },
      {
        name: 'interval',
        title: 'interval(text)',
        description: 'Creates an interval value from a textual representation.',
        example: "SELECT INTERVAL '3 days';"
      }
    ],
    Date: [
      {
        name: 'age',
        title: 'age(timestamp, timestamp)',
        description: 'Calculates the interval between two timestamps as a duration.',
        example: "SELECT age('2023-07-25', '1990-01-01');"
      },
      {
        name: 'current_date',
        title: 'current_date',
        description: 'Returns the current date.',
        example: 'SELECT current_date;'
      },
      {
        name: 'current_time',
        title: 'current_time',
        description: 'Returns the current time without the date part.',
        example: 'SELECT current_time;'
      },
      {
        name: 'current_timestamp',
        title: 'current_timestamp',
        description: 'Returns the current timestamp with both date and time parts.',
        example: 'SELECT current_timestamp;'
      },
      {
        name: 'date_part',
        title: 'date_part(text, timestamp)',
        description: 'Extracts a specific part (e.g., year, month, day) from a timestamp.',
        example: "SELECT date_part('year', '2023-07-25');"
      },
      {
        name: 'date_trunc',
        title: 'date_trunc(text, timestamp)',
        description: 'Truncates a timestamp to the specified precision.',
        example: "SELECT date_trunc('hour', '2023-07-25 12:34:56');"
      },
      {
        name: 'extract',
        title: 'extract(field FROM source)',
        description: 'Extracts a specific field (e.g., year, month, day) from a date or time value.',
        example: "SELECT extract(YEAR FROM '2023-07-25');"
      },
      {
        name: 'now',
        title: 'now()',
        description: 'Returns the current timestamp with both date and time parts.',
        example: 'SELECT now();'
      },
      {
        name: 'timestamp',
        title: 'timestamp(text)',
        description: 'Converts a text string to a timestamp value.',
        example: "SELECT timestamp('2023-07-25 12:34:56');"
      },
      {
        name: 'to_timestamp',
        title: 'to_timestamp(text, text)',
        description: 'Converts a text string to a timestamp value using the specified format.',
        example: "SELECT to_timestamp('2023-07-25 12:34:56', 'YYYY-MM-DD HH24:MI:SS');"
      }
    ],
    Keyword: [
      {
        name: 'ALL',
        title: 'ALL',
        description: 'Used with a comparison operator to check if all subquery rows meet the condition.',
        example: 'SELECT * FROM products WHERE price > ALL (SELECT price FROM discounts);'
      },
      {
        name: 'ANALYSE',
        title: 'ANALYSE',
        description: 'Used to collect statistics about a table to optimize query performance.',
        example: 'ANALYZE products;'
      },
      {
        name: 'ANALYZE',
        title: 'ANALYZE',
        description: 'Used to collect statistics about a table to optimize query performance.',
        example: 'ANALYZE products;'
      },
      {
        name: 'AND',
        title: 'AND',
        description: 'A logical operator used for combining multiple conditions in a query.',
        example: "SELECT * FROM customers WHERE age >= 18 AND country = 'USA';"
      },
      {
        name: 'ANY',
        title: 'ANY',
        description: 'Used with a comparison operator to check if any subquery row meets the condition.',
        example: 'SELECT * FROM products WHERE price = ANY (SELECT price FROM discounts);'
      },
      {
        name: 'ARRAY',
        title: 'ARRAY',
        description: 'Used to define an array type in PostgreSQL.',
        example: 'SELECT ARRAY[1, 2, 3];'
      },
      {
        name: 'AS',
        title: 'AS',
        description: 'Used in the SELECT clause to rename a column or table.',
        example: 'SELECT first_name AS fname, last_name AS lname FROM employees;'
      },
      {
        name: 'ASC',
        title: 'ASC',
        description: 'Used in the ORDER BY clause to sort data in ascending order.',
        example: 'SELECT * FROM products ORDER BY price ASC;'
      },
      {
        name: 'ASYMMETRIC',
        title: 'ASYMMETRIC',
        description: 'Used in cryptographic functions to specify an asymmetric encryption algorithm.',
        example: "CREATE ASYMMETRIC KEY keyname WITH ALGORITHM 'RSA';"
      },
      {
        name: 'AUTHORIZATION',
        title: 'AUTHORIZATION',
        description: 'Specifies the owner of an object in PostgreSQL.',
        example: 'CREATE SCHEMA myschema AUTHORIZATION myuser;'
      },
      {
        name: 'BINARY',
        title: 'BINARY',
        description: 'Used to cast a string to a binary value.',
        example: "SELECT BINARY 'hello';"
      },
      {
        name: 'BOTH',
        title: 'BOTH',
        description: 'Used with a comparison operator to check if both conditions are true.',
        example: 'SELECT * FROM products WHERE price > 100 AND price < 200;'
      },
      {
        name: 'CASE',
        title: 'CASE',
        description: 'Used to perform conditional logic in a query.',
        example: "SELECT name, CASE WHEN age < 18 THEN 'Minor' ELSE 'Adult' END AS age_group FROM customers;"
      },
      {
        name: 'CAST',
        title: 'CAST',
        description: 'Used to explicitly convert data types.',
        example: "SELECT CAST('123' AS integer);"
      },
      {
        name: 'CHECK',
        title: 'CHECK',
        description: 'Defines a constraint to check data integrity.',
        example: 'CREATE TABLE products (name TEXT, quantity INTEGER CHECK (quantity >= 0));'
      },
      {
        name: 'COLLATE',
        title: 'COLLATE',
        description: 'Used to specify collation for string comparisons.',
        example: 'SELECT name FROM customers ORDER BY name COLLATE "en_US";'
      },
      {
        name: 'COLLATION',
        title: 'COLLATION',
        description: 'Defines the rules for string comparison in a specific locale.',
        example: 'CREATE COLLATION "fr_CA" (LOCALE = \'fr_CA\');'
      },
      {
        name: 'COLUMN',
        title: 'COLUMN',
        description: 'Used in the ALTER TABLE statement to add or modify a table column.',
        example: 'ALTER TABLE products ADD COLUMN discount INTEGER;'
      },
      {
        name: 'CONCURRENTLY',
        title: 'CONCURRENTLY',
        description: 'Used with the CREATE INDEX statement to create an index without locking the table.',
        example: 'CREATE INDEX CONCURRENTLY idx_name ON large_table (column);'
      },
      {
        name: 'CONSTRAINT',
        title: 'CONSTRAINT',
        description: 'Defines a constraint on a table column.',
        example: 'ALTER TABLE products ADD CONSTRAINT unique_name UNIQUE (name);'
      },
      {
        name: 'CREATE',
        title: 'CREATE',
        description: 'Used to create databases, tables, indexes, and other database objects.',
        example: 'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT);'
      },
      {
        name: 'CROSS',
        title: 'CROSS',
        description: 'Used in the JOIN clause to perform a Cartesian product between two tables.',
        example: 'SELECT * FROM table1 CROSS JOIN table2;'
      },
      {
        name: 'CURRENT_CATALOG',
        title: 'CURRENT_CATALOG',
        description: 'Returns the current database name.',
        example: 'SELECT CURRENT_CATALOG;'
      },
      {
        name: 'CURRENT_DATE',
        title: 'CURRENT_DATE',
        description: 'Returns the current date.',
        example: 'SELECT CURRENT_DATE;'
      },
      {
        name: 'CURRENT_ROLE',
        title: 'CURRENT_ROLE',
        description: "Returns the current user's role.",
        example: 'SELECT CURRENT_ROLE;'
      },
      {
        name: 'CURRENT_SCHEMA',
        title: 'CURRENT_SCHEMA',
        description: 'Returns the current schema name.',
        example: 'SELECT CURRENT_SCHEMA;'
      },
      {
        name: 'CURRENT_TIME',
        title: 'CURRENT_TIME',
        description: 'Returns the current time.',
        example: 'SELECT CURRENT_TIME;'
      },
      {
        name: 'CURRENT_TIMESTAMP',
        title: 'CURRENT_TIMESTAMP',
        description: 'Returns the current timestamp.',
        example: 'SELECT CURRENT_TIMESTAMP;'
      },
      {
        name: 'CURRENT_USER',
        title: 'CURRENT_USER',
        description: 'Returns the current user name.',
        example: 'SELECT CURRENT_USER;'
      },
      {
        name: 'DEFAULT',
        title: 'DEFAULT',
        description: 'Specifies the default value for a column when a new row is inserted.',
        example: "CREATE TABLE products (name TEXT DEFAULT 'Unknown', price NUMERIC DEFAULT 0);"
      },
      {
        name: 'DEFERRABLE',
        title: 'DEFERRABLE',
        description: 'Specifies that a constraint can be deferred until the end of a transaction.',
        example:
          'CREATE TABLE orders (order_id SERIAL PRIMARY KEY, total_amount NUMERIC, CONSTRAINT check_total CHECK (total_amount > 0) DEFERRABLE INITIALLY DEFERRED);'
      },
      {
        name: 'DESC',
        title: 'DESC',
        description: 'Used in the ORDER BY clause to sort data in descending order.',
        example: 'SELECT * FROM products ORDER BY price DESC;'
      },
      {
        name: 'DISTINCT',
        title: 'DISTINCT',
        description: 'Removes duplicate rows from the result set.',
        example: 'SELECT DISTINCT city FROM customers;'
      },
      {
        name: 'DO',
        title: 'DO',
        description: 'Used to define an anonymous code block in PostgreSQL.',
        example: "DO $$ BEGIN RAISE NOTICE 'Hello, World!'; END $$;"
      },
      {
        name: 'ELSE',
        title: 'ELSE',
        description: 'Used in the CASE statement to specify the default value if no condition is met.',
        example: "SELECT name, CASE WHEN age < 18 THEN 'Minor' ELSE 'Adult' END AS age_group FROM customers;"
      },
      {
        name: 'END',
        title: 'END',
        description: 'Marks the end of a code block or a loop in PostgreSQL.',
        example: "DO $$ DECLARE i INTEGER := 1; BEGIN WHILE i <= 5 LOOP RAISE NOTICE 'Value: %', i; i := i + 1; END LOOP; END $$;"
      },
      {
        name: 'EXCEPT',
        title: 'EXCEPT',
        description: 'Used to combine the results of two SELECT queries and remove duplicate rows.',
        example: 'SELECT * FROM table1 EXCEPT SELECT * FROM table2;'
      },
      {
        name: 'FALSE',
        title: 'FALSE',
        description: 'Represents a Boolean false value.',
        example: 'SELECT * FROM employees WHERE is_active = FALSE;'
      },
      {
        name: 'FETCH',
        title: 'FETCH',
        description: 'Used with the LIMIT clause to fetch a limited number of rows.',
        example: 'SELECT * FROM products ORDER BY price FETCH FIRST 10 ROWS ONLY;'
      },
      {
        name: 'FOR',
        title: 'FOR',
        description: 'Used in the CREATE TRIGGER statement to specify the event that triggers the trigger function.',
        example: 'CREATE TRIGGER trigger_name BEFORE INSERT ON table_name FOR EACH ROW EXECUTE FUNCTION trigger_function();'
      },
      {
        name: 'FOREIGN',
        title: 'FOREIGN',
        description: 'Used in the CREATE TABLE statement to define a foreign key constraint.',
        example: 'CREATE TABLE orders (order_id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customers(id));'
      },
      {
        name: 'FREEZE',
        title: 'FREEZE',
        description: 'Used to lock a table and its indexes from any modifications temporarily.',
        example: 'FREEZE orders;'
      },
      {
        name: 'FROM',
        title: 'FROM',
        description: 'Specifies the table from which data is queried.',
        example: 'SELECT * FROM employees;'
      },
      {
        name: 'FULL',
        title: 'FULL',
        description: 'Used in the JOIN clause to perform a full outer join between two tables.',
        example: 'SELECT * FROM customers FULL JOIN orders ON customers.id = orders.customer_id;'
      },
      {
        name: 'GRANT',
        title: 'GRANT',
        description: 'Grants privileges to users or roles.',
        example: 'GRANT SELECT, INSERT, UPDATE ON employees TO manager;'
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
        name: 'ILIKE',
        title: 'ILIKE',
        description: 'Performs a case-insensitive pattern match using the LIKE operator.',
        example: "SELECT * FROM products WHERE name ILIKE '%apple%';"
      },
      {
        name: 'IN',
        title: 'IN',
        description: 'Used with a list of values to check if a value is in the list.',
        example: "SELECT * FROM products WHERE category IN ('Electronics', 'Appliances', 'Books');"
      },
      {
        name: 'INITIALLY',
        title: 'INITIALLY',
        description: 'Specifies when a constraint should be checked (e.g., deferred or immediate).',
        example:
          'CREATE TABLE orders (order_id SERIAL PRIMARY KEY, total_amount NUMERIC, CONSTRAINT check_total CHECK (total_amount > 0) DEFERRABLE INITIALLY IMMEDIATE);'
      },
      {
        name: 'INNER',
        title: 'INNER',
        description: 'Used in the JOIN clause to perform an inner join between two tables.',
        example: 'SELECT * FROM customers INNER JOIN orders ON customers.id = orders.customer_id;'
      },
      {
        name: 'INTERSECT',
        title: 'INTERSECT',
        description: 'Used to combine the results of two SELECT queries and keep only common rows.',
        example: 'SELECT * FROM table1 INTERSECT SELECT * FROM table2;'
      },
      {
        name: 'INTO',
        title: 'INTO',
        description: 'Used in the SELECT statement to insert selected data into a table.',
        example: 'SELECT name, age INTO new_table FROM old_table WHERE age >= 18;'
      },
      {
        name: 'IS',
        title: 'IS',
        description: 'Used to check if a value is NULL or to compare values.',
        example: 'SELECT * FROM products WHERE category IS NULL;'
      },
      {
        name: 'ISNULL',
        title: 'ISNULL',
        description: 'A synonym for the NULL condition check.',
        example: 'SELECT * FROM products WHERE price ISNULL;'
      },
      {
        name: 'JOIN',
        title: 'JOIN',
        description: 'Used to combine rows from two or more tables based on a related column between them.',
        example: 'SELECT * FROM employees JOIN departments ON employees.department_id = departments.id;'
      },
      {
        name: 'LATERAL',
        title: 'LATERAL',
        description: 'Used in the FROM clause to allow access to a column from a subquery.',
        example: 'SELECT * FROM orders, LATERAL (SELECT * FROM order_items WHERE order_items.order_id = orders.id LIMIT 1) subquery;'
      },
      {
        name: 'LEADING',
        title: 'LEADING',
        description: 'Specifies that the optimizer should use the specified column to perform an index scan.',
        example: 'SELECT * FROM employees WHERE id = 100 LEADING (id);'
      },
      {
        name: 'LEFT',
        title: 'LEFT',
        description: 'Used in the JOIN clause to perform a left outer join between two tables.',
        example: 'SELECT * FROM customers LEFT JOIN orders ON customers.id = orders.customer_id;'
      },
      {
        name: 'LIKE',
        title: 'LIKE',
        description: 'Performs a pattern match on strings.',
        example: "SELECT * FROM products WHERE name LIKE '%apple%';"
      },
      {
        name: 'LIMIT',
        title: 'LIMIT',
        description: 'Specifies the maximum number of rows to return in the result set.',
        example: 'SELECT * FROM products LIMIT 10;'
      },
      {
        name: 'LOCALTIME',
        title: 'LOCALTIME',
        description: 'Returns the current time in the current time zone.',
        example: 'SELECT LOCALTIME;'
      },
      {
        name: 'LOCALTIMESTAMP',
        title: 'LOCALTIMESTAMP',
        description: 'Returns the current timestamp in the current time zone.',
        example: 'SELECT LOCALTIMESTAMP;'
      },
      {
        name: 'NATURAL',
        title: 'NATURAL',
        description: 'Used in the JOIN clause to perform a natural join between two tables.',
        example: 'SELECT * FROM customers NATURAL JOIN orders;'
      },
      {
        name: 'NOT',
        title: 'NOT',
        description: 'Negates a condition in the WHERE clause or a Boolean value.',
        example: 'SELECT * FROM products WHERE NOT price > 100;'
      },
      {
        name: 'NOTNULL',
        title: 'NOTNULL',
        description: 'A synonym for the NOT NULL condition check.',
        example: 'SELECT * FROM products WHERE price NOTNULL;'
      },
      {
        name: 'NULL',
        title: 'NULL',
        description: 'Represents a NULL value.',
        example: 'SELECT * FROM products WHERE description IS NULL;'
      },
      {
        name: 'OFFSET',
        title: 'OFFSET',
        description: 'Specifies the number of rows to skip before starting to return rows in the result set.',
        example: 'SELECT * FROM products ORDER BY price OFFSET 10;'
      },
      {
        name: 'ON',
        title: 'ON',
        description: 'Specifies the join condition between two tables in the JOIN clause.',
        example: 'SELECT * FROM employees JOIN departments ON employees.department_id = departments.id;'
      },
      {
        name: 'ONLY',
        title: 'ONLY',
        description: 'Used in the DROP TABLE statement to ensure that only the named table is dropped.',
        example: 'DROP TABLE mytable ONLY;'
      },
      {
        name: 'OR',
        title: 'OR',
        description: 'A logical operator used for combining multiple conditions in a query.',
        example: "SELECT * FROM products WHERE category = 'Electronics' OR category = 'Appliances';"
      },
      {
        name: 'ORDER',
        title: 'ORDER',
        description: 'Specifies the order of rows in the result set.',
        example: 'SELECT * FROM products ORDER BY price DESC;'
      },
      {
        name: 'OUTER',
        title: 'OUTER',
        description: 'Used in the JOIN clause to perform an outer join between two tables.',
        example: 'SELECT * FROM customers FULL OUTER JOIN orders ON customers.id = orders.customer_id;'
      },
      {
        name: 'OVERLAPS',
        title: 'OVERLAPS',
        description: 'Used to check if two time periods overlap.',
        example: "SELECT * FROM events WHERE start_time OVERLAPS '2023-07-25' AND '2023-07-26';"
      },
      {
        name: 'PLACING',
        title: 'PLACING',
        description: 'Specifies the target of an aggregate function in the SELECT statement.',
        example: 'SELECT department, AVG(salary) FROM employees GROUP BY department PLACING AVG(salary) AS avg_salary;'
      },
      {
        name: 'PRIMARY',
        title: 'PRIMARY',
        description: 'Used in the CREATE TABLE statement to define a primary key constraint.',
        example: 'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT);'
      },
      {
        name: 'REFERENCES',
        title: 'REFERENCES',
        description: 'Used in the CREATE TABLE statement to define a foreign key constraint.',
        example: 'CREATE TABLE orders (order_id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customers(id));'
      },
      {
        name: 'RETURNING',
        title: 'RETURNING',
        description: 'Used in the INSERT, UPDATE, or DELETE statement to return values from modified rows.',
        example: "INSERT INTO products (name, price) VALUES ('Laptop', 1200) RETURNING product_id;"
      },
      {
        name: 'RIGHT',
        title: 'RIGHT',
        description: 'Used in the JOIN clause to perform a right outer join between two tables.',
        example: 'SELECT * FROM orders RIGHT JOIN customers ON orders.customer_id = customers.id;'
      },
      {
        name: 'SELECT',
        title: 'SELECT',
        description: 'Retrieves data from one or more tables.',
        example: 'SELECT * FROM products;'
      },
      {
        name: 'SESSION_USER',
        title: 'SESSION_USER',
        description: 'Returns the name of the user who is connected to the database.',
        example: 'SELECT SESSION_USER;'
      },
      {
        name: 'SIMILAR',
        title: 'SIMILAR',
        description: 'Performs a case-insensitive pattern match using the SQL standard SIMILAR TO operator.',
        example: "SELECT * FROM products WHERE name SIMILAR TO '%apple%';"
      },
      {
        name: 'SOME',
        title: 'SOME',
        description: 'A synonym for the ANY operator used in subqueries.',
        example: 'SELECT * FROM products WHERE price > SOME (SELECT price FROM discounts);'
      },
      {
        name: 'SYMMETRIC',
        title: 'SYMMETRIC',
        description: 'Used in cryptographic functions to specify a symmetric encryption algorithm.',
        example: "CREATE SYMMETRIC KEY keyname WITH ALGORITHM 'AES256';"
      },
      {
        name: 'TABLE',
        title: 'TABLE',
        description: 'Used to define a table in PostgreSQL.',
        example: 'CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT);'
      },
      {
        name: 'TABLESAMPLE',
        title: 'TABLESAMPLE',
        description: 'Used to select a random sample of rows from a table.',
        example: 'SELECT * FROM large_table TABLESAMPLE SYSTEM(10);'
      },
      {
        name: 'THEN',
        title: 'THEN',
        description: 'Used in the CASE statement to specify the result if a condition is true.',
        example: "SELECT name, CASE WHEN age < 18 THEN 'Minor' ELSE 'Adult' END AS age_group FROM customers;"
      },
      {
        name: 'TO',
        title: 'TO',
        description: 'Used in the CAST statement to specify the target data type.',
        example: "SELECT CAST('123' AS integer);"
      },
      {
        name: 'TRAILING',
        title: 'TRAILING',
        description: 'Used in the aggregate function to specify trimming of trailing spaces.',
        example: "SELECT TRIM(TRAILING '0' FROM '12300');"
      },
      {
        name: 'TRUE',
        title: 'TRUE',
        description: 'Represents a Boolean true value.',
        example: 'SELECT * FROM employees WHERE is_active = TRUE;'
      },
      {
        name: 'UNION',
        title: 'UNION',
        description: 'Combines the results of two or more SELECT queries and removes duplicate rows.',
        example: 'SELECT * FROM table1 UNION SELECT * FROM table2;'
      },
      {
        name: 'UNIQUE',
        title: 'UNIQUE',
        description: 'Used to define a unique constraint on a table column.',
        example: 'CREATE TABLE employees (id SERIAL PRIMARY KEY, email TEXT UNIQUE);'
      },
      {
        name: 'USER',
        title: 'USER',
        description: 'Represents the name of the current user connected to the database.',
        example: 'SELECT USER;'
      },
      {
        name: 'USING',
        title: 'USING',
        description: 'Used in the JOIN clause to specify the column used for a join.',
        example: 'SELECT * FROM employees JOIN departments USING (department_id);'
      },
      {
        name: 'VARIADIC',
        title: 'VARIADIC',
        description: 'Used in function definitions to specify a variable number of arguments.',
        example: "CREATE FUNCTION my_function(VARIADIC args TEXT[]) RETURNS TEXT AS $$ BEGIN RETURN array_to_string(args, ','); END; $$ LANGUAGE plpgsql;"
      },
      {
        name: 'VERBOSE',
        title: 'VERBOSE',
        description: 'Used in the EXPLAIN command to display additional information.',
        example: 'EXPLAIN VERBOSE SELECT * FROM products;'
      },
      {
        name: 'WHEN',
        title: 'WHEN',
        description: 'Used in the CASE statement to specify a condition to evaluate.',
        example: "SELECT name, CASE WHEN age < 18 THEN 'Minor' ELSE 'Adult' END AS age_group FROM customers;"
      },
      {
        name: 'WHERE',
        title: 'WHERE',
        description: 'Specifies conditions to filter rows in the SELECT statement.',
        example: 'SELECT * FROM products WHERE price > 100;'
      },
      {
        name: 'WINDOW',
        title: 'WINDOW',
        description: 'Defines a window for use with window functions.',
        example: 'SELECT department, salary, AVG(salary) OVER w AS avg_salary FROM employees WINDOW w AS (PARTITION BY department);'
      },
      {
        name: 'WITH',
        title: 'WITH',
        description: 'Used to define common table expressions (CTEs) in a query.',
        example: 'WITH discounted_products AS (SELECT * FROM products WHERE price < 50) SELECT * FROM discounted_products;'
      }
    ],
    Operators: [
      {
        name: 'AND',
        title: 'AND',
        description: 'The logical AND operator. It returns true if both operands are true, otherwise false.',
        example: "SELECT * FROM customers WHERE age > 25 AND city = 'New York';"
      },
      {
        name: 'BETWEEN',
        title: 'BETWEEN',
        description: 'The BETWEEN operator is used to check if a value is within a range.',
        example: 'SELECT * FROM products WHERE price BETWEEN 10 AND 50;'
      },
      {
        name: 'IN',
        title: 'IN',
        description: 'The IN operator is used to check if a value matches any value in a list.',
        example: "SELECT * FROM employees WHERE department IN ('Sales', 'Marketing', 'HR');"
      },
      {
        name: 'LIKE',
        title: 'LIKE',
        description: 'The LIKE operator is used for pattern matching with wildcard characters.',
        example: "SELECT * FROM products WHERE product_name LIKE 'Apple%';"
      },
      {
        name: 'NOT',
        title: 'NOT',
        description: 'The logical NOT operator. It returns true if the condition is false, and vice versa.',
        example: "SELECT * FROM orders WHERE NOT status = 'Shipped';"
      },
      {
        name: 'OR',
        title: 'OR',
        description: 'The logical OR operator. It returns true if at least one of the operands is true.',
        example: 'SELECT * FROM students WHERE age < 18 OR age >= 21;'
      },
      {
        name: 'IS',
        title: 'IS',
        description: 'The IS operator is used to check if a value is NULL.',
        example: 'SELECT * FROM employees WHERE hire_date IS NULL;'
      },
      {
        name: 'NULL',
        title: 'NULL',
        description: 'The NULL operator is used to represent missing or unknown data.',
        example: 'SELECT * FROM customers WHERE email IS NULL;'
      },
      {
        name: 'INTERSECT',
        title: 'INTERSECT',
        description: 'The INTERSECT operator is used to combine the result of two or more SELECT statements and returns the common rows.',
        example: 'SELECT employee_id FROM employees INTERSECT SELECT employee_id FROM managers;'
      },
      {
        name: 'UNION',
        title: 'UNION',
        description: 'The UNION operator is used to combine the result of two or more SELECT statements and removes duplicate rows.',
        example: "SELECT product_name FROM products WHERE category = 'Electronics' UNION SELECT product_name FROM products WHERE category = 'Appliances';"
      },
      {
        name: 'INNER',
        title: 'INNER',
        description: 'The INNER JOIN operator selects records that have matching values in both tables.',
        example: 'SELECT orders.order_id, customers.customer_name FROM orders INNER JOIN customers ON orders.customer_id = customers.customer_id;'
      },
      {
        name: 'JOIN',
        title: 'JOIN',
        description: 'The JOIN operator is used to combine rows from two or more tables based on a related column.',
        example: 'SELECT orders.order_id, customers.customer_name FROM orders JOIN customers ON orders.customer_id = customers.customer_id;'
      },
      {
        name: 'LEFT',
        title: 'LEFT',
        description: 'The LEFT JOIN operator returns all records from the left table and the matched records from the right table.',
        example: 'SELECT customers.customer_name, orders.order_id FROM customers LEFT JOIN orders ON customers.customer_id = orders.customer_id;'
      },
      {
        name: 'OUTER',
        title: 'OUTER',
        description: 'The OUTER JOIN operator returns all records when there is a match in either the left or right table.',
        example: 'SELECT customers.customer_name, orders.order_id FROM customers OUTER JOIN orders ON customers.customer_id = orders.customer_id;'
      },
      {
        name: 'RIGHT',
        title: 'RIGHT',
        description: 'The RIGHT JOIN operator returns all records from the right table and the matched records from the left table.',
        example: 'SELECT customers.customer_name, orders.order_id FROM customers RIGHT JOIN orders ON customers.customer_id = orders.customer_id;'
      }
    ],
    Rounding: [
      {
        name: 'round',
        title: 'round(number)',
        description: 'Rounds a numeric value to the nearest integer.',
        example: 'SELECT round(3.7);'
      },
      {
        name: 'ceil',
        title: 'ceil(number)',
        description: 'Returns the smallest integer greater than or equal to a numeric value.',
        example: 'SELECT ceil(4.2);'
      },
      {
        name: 'ceiling',
        title: 'ceiling(number)',
        description: 'Returns the smallest integer greater than or equal to a numeric value.',
        example: 'SELECT ceiling(4.2);'
      },
      {
        name: 'floor',
        title: 'floor(number)',
        description: 'Returns the largest integer less than or equal to a numeric value.',
        example: 'SELECT floor(5.9);'
      }
    ],
    String: [
      {
        name: 'octet_length',
        title: 'octet_length(string)',
        description: 'Returns the number of bytes in string.',
        example: "octet_length('jose') => 4"
      },
      {
        name: 'overlay',
        title: 'overlay(string placing string from int [for int])',
        description: 'Returns the number of characters in string.',
        example: "overlay('Txxxxas' placing 'hom' from 2 for 4) =>  Thomas"
      },
      {
        name: 'position',
        title: 'position(substring in string)',
        description: 'Returns location of specified substring as number.',
        example: "position('om' in 'Thomas') =>  3"
      },
      {
        name: 'substring',
        title: 'substring(string [from int] [for int])',
        description: 'Extract substring',
        example: "substring('Thomas' from 2 for 3) => hom"
      },
      {
        name: 'substring',
        title: 'substring(string from pattern)',
        description: 'Extract substring matching POSIX regular expression',
        example: "substring('Thomas' from '...$') => mas"
      },
      {
        name: 'substring',
        title: 'substring(string from pattern for escape)',
        description: 'Extract substring matching SQL regular expression',
        example: "substring('Thomas' from '%#\"o_a#\"_' for '#') => oma"
      },
      {
        name: 'ascii',
        title: 'ascii(string)',
        description: 'Converts the first character of the input string to its ASCII code.',
        example: "SELECT ascii('A');"
      },
      {
        name: 'btrim',
        title: 'btrim(string text [, characters text])',
        description: 'Removes the specified characters from the beginning and end of a string.',
        example: "SELECT btrim('   hello   ');"
      },
      {
        name: 'char_length',
        title: 'char_length(string)',
        description: 'Returns the number of characters in the input string.',
        example: "SELECT char_length('Datainsider.co');"
      },
      {
        name: 'character_length',
        title: 'character_length(string)',
        description: 'Synonym for char_length().',
        example: "SELECT character_length('Hello World');"
      },
      {
        name: 'chr',
        title: 'chr(code)',
        description: 'Converts the ASCII code to a character.',
        example: 'SELECT chr(65);'
      },
      {
        name: 'concat',
        title: 'concat(string text [, string text [, ... ]])',
        description: 'Concatenates two or more strings into a single string.',
        example: "SELECT concat('Hello', ' ', 'World');"
      },
      {
        name: 'initcap',
        title: 'initcap(string)',
        description: 'Converts the first letter of each word to uppercase, and the rest to lowercase.',
        example: "SELECT initcap('hello world');"
      },
      {
        name: 'length',
        title: 'length(string)',
        description: 'Synonym for char_length().',
        example: "SELECT length('Hello, world!');"
      },
      {
        name: 'lower',
        title: 'lower(string)',
        description: 'Converts all characters in the string to lowercase.',
        example: "SELECT lower('HELLO');"
      },
      {
        name: 'lpad',
        title: 'lpad(string text, length integer [, fill text])',
        description: 'Pads the string to the left with a specified character to a specified length.',
        example: "SELECT lpad('hello', 10, '*');"
      },
      {
        name: 'ltrim',
        title: 'ltrim(string text [, characters text])',
        description: 'Removes the specified characters from the beginning of a string.',
        example: "SELECT ltrim('   hello   ');"
      },
      {
        name: 'repeat',
        title: 'repeat(string text, number integer)',
        description: 'Repeats the input string a specified number of times.',
        example: "SELECT repeat('a', 5);"
      },
      {
        name: 'replace',
        title: 'replace(string text, from text, to text)',
        description: 'Replaces all occurrences of a substring with another substring in a string.',
        example: "SELECT replace('hello world', 'world', 'Datainsider.co');"
      },
      {
        name: 'rpad',
        title: 'rpad(string text, length integer [, fill text])',
        description: 'Pads the string to the right with a specified character to a specified length.',
        example: "SELECT rpad('hello', 10, '*');"
      },
      {
        name: 'rtrim',
        title: 'rtrim(string text [, characters text])',
        description: 'Removes the specified characters from the end of a string.',
        example: "SELECT rtrim('   hello   ');"
      },
      {
        name: 'split_part',
        title: 'split_part(string text, delimiter text, field integer)',
        description: 'Splits a string into parts using a delimiter and returns the specified field.',
        example: "SELECT split_part('apple,banana,orange', ',', 2);"
      },
      {
        name: 'strpos',
        title: 'strpos(string text, substring text)',
        description: 'Finds the position of a substring in a string.',
        example: "SELECT strpos('Datainsider.co', 'insider');"
      },
      {
        name: 'substr',
        title: 'substr(string text, start integer [, length integer])',
        description: 'Extracts a substring from a string, starting at a specified position.',
        example: "SELECT substr('Datainsider.co', 6, 7);"
      },
      {
        name: 'trim',
        title: 'trim([leading | trailing | both] [characters] from string)',
        description: 'Removes the specified characters from the beginning, end, or both sides of a string.',
        example: "SELECT trim('   hello   ');"
      },
      {
        name: 'upper',
        title: 'upper(string)',
        description: 'Converts all characters in the string to uppercase.',
        example: "SELECT upper('hello');"
      }
    ]
  }
});
