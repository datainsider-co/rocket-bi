export const getClickhouseSyntax = () => ({
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
      { open: "'", close: "'" },
      { open: '`', close: '`' }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '`', close: '`' }
    ]
  },
  monarchLanguage: {
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
  },
  name: 'clickhouse',
  supportedFunction: {
    'Aggregate functions': [
      {
        name: 'count',
        title: 'count(expr)',
        description: 'Counts the number of rows or not-NULL values.',
        example: 'SELECT count() FROM t'
      },
      {
        name: 'sum',
        title: 'sum(expr)',
        description: 'Calculates the sum. Only works for numbers.',
        example: 'SELECT sum(profile) FROM t'
      },
      {
        name: 'min',
        title: 'min(expr)',
        description: 'Aggregate function that calculates the minimum across a group of values.',
        example: 'SELECT min(salary) FROM employees;'
      },
      {
        name: 'max',
        title: 'max(expr)',
        description: 'Aggregate function that calculates the maximum across a group of values.',
        example: 'SELECT max(salary) FROM employees;'
      },
      {
        name: 'avg',
        title: 'avg(expr)',
        description:
          'Aggregate function that calculates the maximum across a group of values. Returned value: \nThe arithmetic mean, always as Float64.\n NaN if the input parameter x is empty.',
        example: 'SELECT avg(profit) employees '
      },
      {
        name: 'any',
        title: 'any(expr)',
        description:
          'Selects the first encountered value. The query can be executed in any order and even in a different order each time, so the result of this function is indeterminate. To get a determinate result, you can use the ‘min’ or ‘max’ function instead of ‘any’.',
        example: 'SELECT any(name) employees '
      },
      {
        name: 'stddevPop',
        title: 'stddevPop(expr)',
        description: 'The result is equal to the square root of varPop.',
        example: 'select stddevPop(123)'
      },
      {
        name: 'stddevPopStable',
        title: 'stddevPopStable(expr)',
        description: 'The result is equal to the square root of varPop.',
        example: 'select stddevPopStable(123)'
      },
      {
        name: 'stddevSamp',
        title: 'stddevSamp(expr)',
        description: 'The result is equal to the square root of varSamp.',
        example: 'select stddevSamp(123)'
      },
      {
        name: 'stddevSampStable',
        title: 'stddevSampStable(expr)',
        description: 'The result is equal to the square root of varSamp.',
        example: 'select stddevSampStable(123)'
      },
      {
        name: 'varPop',
        title: 'varPop(expr)',
        description: 'Calculates the amount Σ((x - x̅)^2) / n, where n is the sample size and x̅is the average value of x.',
        example: 'select varPop(123)'
      },
      {
        name: 'varPopStable',
        title: 'varPopStable(expr)',
        description: 'Calculates the amount Σ((x - x̅)^2) / n, where n is the sample size and x̅is the average value of x.',
        example: 'select varPopStable(123)'
      },
      {
        name: 'varSamp',
        title: 'varSamp(expr)',
        description: 'Calculates the amount Σ((x - x̅)^2) / (n - 1), where n is the sample size and x̅is the average value of x.',
        example: 'select varSamp(123)'
      },
      {
        name: 'covarPop',
        title: 'covarPop(x, y)',
        description: 'Calculates the value of Σ((x - x̅)(y - y̅)) / n.',
        example: 'select covarPop(12, 10)'
      },
      {
        name: 'covarPopStable',
        title: 'covarPopStable(x, y)',
        description: 'Calculates the value of Σ((x - x̅)(y - y̅)) / n.',
        example: 'select covarPopStable(12, 10)'
      },
      {
        name: 'covarSamp',
        title: 'covarSamp(x, y)',
        description: 'Calculates the value of Σ((x - x̅)(y - y̅)) / (n - 1).',
        example: 'select covarSamp(12, 12)'
      },
      {
        name: 'covarSampStable',
        title: 'covarSampStable(x, y)',
        description: 'Calculates the value of Σ((x - x̅)(y - y̅)) / (n - 1).',
        example: 'select covarSampStable(12, 12)'
      },
      {
        name: 'anyHeavy',
        title: 'anyHeavy(column)',
        description:
          'Selects a frequently occurring value using the heavy hitters algorithm. If there is a value that occurs more than in half the cases in each of the query’s execution threads, this value is returned. Normally, the result is nondeterministic.',
        example: 'SELECT anyHeavy(AirlineID) FROM ontime'
      },
      {
        name: 'anyLast',
        title: 'anyLast(column)',
        description: 'Selects the last value encountered. The result is just as indeterminate as for the any function.',
        example: "SELECT anyLast(x) FROM values('x Int64', 1, 2, 3, 4)"
      },
      {
        name: 'argMin',
        title: 'argMin(arg, val)',
        description:
          'Calculates the arg value for a minimum val value. If there are several different values of arg for minimum values of val, returns the first of these values encountered.',
        example: 'SELECT argMin(user, salary) FROM salary'
      },
      {
        name: 'avgWeighted',
        title: 'avgWeighted(x, weight)',
        description: 'Calculates the weighted arithmetic mean.',
        example: "SELECT avgWeighted(x, w)\nFROM values('x Int8, w Int8', (4, 1), (1, 0), (10, 2))"
      },
      {
        name: 'topK',
        title: 'topK(N)(column)',
        description:
          'Returns an array of the approximately most frequent values in the specified column. The resulting array is sorted in descending order of approximate frequency of values (not by the values themselves).\n\nImplements the Filtered Space-Saving algorithm for analyzing TopK, based on the reduce-and-combine algorithm from Parallel Space Saving.',
        example: "SELECT topK(3)(x) FROM values('x Int8', 1, 5, 3, 4, 6)"
      },
      {
        name: 'topKWeighted',
        title: 'topKWeighted(N)(column)',
        description:
          'Returns an array of the approximately most frequent values in the specified column. The resulting array is sorted in descending order of approximate frequency of values (not by the values themselves). Additionally, the weight of the value is taken into account.',
        example: 'SELECT topKWeighted(10)(number, number) FROM numbers(1000)'
      },
      {
        name: 'groupArray',
        title: 'groupArray(x)',
        description: 'Creates an array of argument values. Values can be added to the array in any (indeterminate) order.',
        example: 'select id, groupArray(10)(name) from default.ck group by id;'
      },
      {
        name: 'groupUniqArray',
        title: 'groupUniqArray(x)',
        description: 'Creates an array from different argument values. Memory consumption is the same as for the uniqExact function.',
        example: 'select id, groupUniqArray(name) from default.ck group by id;'
      },
      {
        name: 'groupArrayInsertAt',
        title: 'groupArrayInsertAt(default_x, size)(x, pos)',
        description: 'Inserts a value into the array at the specified position.',
        example: 'SELECT groupArrayInsertAt(toString(number), number * 2) FROM numbers(5)'
      },
      {
        name: 'groupArrayMovingAvg',
        title: 'groupArrayMovingAvg(numbers_for_summing)',
        description:
          'The function can take the window size as a parameter. If left unspecified, the function takes the window size equal to the number of rows in the column.',
        example: 'SELECT\n    groupArrayMovingAvg(int) AS I,\n    groupArrayMovingAvg(float) AS F,\n    groupArrayMovingAvg(dec) AS D\nFROM t'
      },
      {
        name: 'sumWithOverflow',
        title: 'sumWithOverflow(column)',
        description:
          'Computes the sum of the numbers, using the same data type for the result as for the input parameters. If the sum exceeds the maximum value for this data type, it is calculated with overflow.\n\nOnly works for numbers.',
        example: 'select sumWithOverflow(number) from numbers(100)'
      },
      {
        name: 'sumMap',
        title: 'sumMap(key, value) or sumMap(Tuple(key, value))',
        description:
          'Totals the value array according to the keys specified in the key array.\n\nPassing tuple of keys and values arrays is a synonym to passing two arrays of keys and values.\n\nThe number of elements in key and value must be the same for each row that is totaled.\n\nReturns a tuple of two arrays: keys in sorted order, and values ​​summed for the corresponding keys.',
        example: 'SELECT\n    timeslot,\n    sumMap(statusMap.status, statusMap.requests),\n    sumMap(statusMapTuple)\nFROM sum_map\nGROUP BY timeslot'
      },
      {
        name: 'minMap',
        title: 'minMap(key, value) or minMap(Tuple(key, value))',
        description:
          'Calculates the minimum from value array according to the keys specified in the key array.\n\nPassing a tuple of keys and value ​​arrays is identical to passing two arrays of keys and values.\n\nThe number of elements in key and value must be the same for each row that is totaled.\n\nReturns a tuple of two arrays: keys in sorted order, and values calculated for the corresponding keys.',
        example: "SELECT minMap(a, b)\nFROM values('a Array(Int32), b Array(Int64)', ([1, 2], [2, 2]), ([2, 3], [1, 1]))"
      },
      {
        name: 'maxMap',
        title: 'maxMap(key, value) or maxMap(Tuple(key, value))',
        description:
          'Calculates the maximum from value array according to the keys specified in the key array.\n\nPassing a tuple of keys and value arrays is identical to passing two arrays of keys and values.\n\nThe number of elements in key and value must be the same for each row that is totaled.\n\nReturns a tuple of two arrays: keys and values calculated for the corresponding keys.',
        example: "SELECT maxMap(a, b)\nFROM values('a Array(Int32), b Array(Int64)', ([1, 2], [2, 2]), ([2, 3], [1, 1]))"
      },
      {
        name: 'skewSamp',
        title: 'skewSamp(expr)',
        description:
          'Computes the sample skewness of a sequence.\n\nIt represents an unbiased estimate of the skewness of a random variable if passed values form its sample.',
        example: 'SELECT skewSamp(value) FROM series_with_value_column;'
      },
      {
        name: 'skewPop',
        title: 'skewPop(expr)',
        description: 'Computes the skewness of a sequence.',
        example: 'SELECT skewPop(value) FROM series_with_value_column'
      },
      {
        name: 'kurtSamp',
        title: 'kurtSamp(expr)',
        description:
          'Computes the sample kurtosis of a sequence.\n\nIt represents an unbiased estimate of the kurtosis of a random variable if passed values form its sample.',
        example: 'SELECT kurtSamp(value) FROM series_with_value_column;'
      },
      {
        name: 'kurtPop',
        title: 'kurtPop(expr)',
        description: 'Computes the kurtosis of a sequence.',
        example: 'SELECT kurtPop(value) FROM series_with_value_column;'
      },
      {
        name: 'uniq',
        title: 'uniq(x[, ...])',
        description: 'Calculates the approximate number of different values of the argument.',
        example: 'SELECT uniq(name) FROM t'
      },
      {
        name: 'uniqExact',
        title: 'uniqExact(x[, ...])',
        description: 'Calculates the exact number of different argument values.',
        example: 'SELECT uniqExact(name) FROM t'
      },
      {
        name: 'uniqCombined',
        title: 'uniqCombined(HLL_precision)(x[, ...])',
        description: 'Calculates the approximate number of different argument values',
        example: 'SELECT uniqCombined(name) FROM t'
      },
      {
        name: 'uniqCombined64',
        title: 'uniqCombined64(HLL_precision)(x[, ...])',
        description: 'Same as uniqCombined, but uses 64-bit hash for all data types.',
        example: 'SELECT uniqCombined64(name) FROM t'
      },
      {
        name: 'uniqHLL12',
        title: 'uniqHLL12(x[, ...])',
        description: 'Calculates the approximate number of different argument values, using the HyperLogLog algorithm.',
        example: 'SELECT uniqHLL12(name) FROM t'
      },
      {
        name: 'quantile',
        title: 'quantile(level)(expr)',
        description:
          'Computes an approximate quantile of a numeric data sequence.\n\nThis function applies reservoir sampling with a reservoir size up to 8192 and a random number generator for sampling. The result is non-deterministic. To get an exact quantile, use the quantileExact function.\n\nWhen using multiple quantile* functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantiles function.\n\nNote that for an empty numeric sequence, quantile will return NaN, but its quantile* variants will return either NaN or a default value for the sequence type, depending on the variant.',
        example: 'SELECT quantile(val) FROM t'
      },
      {
        name: 'quantiles',
        title: 'quantiles(level1, level2, …)(x)',
        description: 'These functions calculate all the quantiles of the listed levels in one pass, and return an array of the resulting values.',
        example: "SELECT quantiles(0)(a) FROM values('a Int64', 1, 2, 3, 4, 5, 100)"
      },
      {
        name: 'quantilesExactExclusive',
        title: 'quantilesExactExclusive(level1, level2, ...)(expr)',
        description:
          'Exactly computes the quantiles of a numeric data sequence.\n\nTo get exact value, all the passed values ​​are combined into an array, which is then partially sorted. Therefore, the function consumes O(n) memory, where n is a number of values that were passed. However, for a small number of values, the function is very effective.\n\nThis function is equivalent to PERCENTILE.EXC Excel function, (type R6).\n\nWorks more efficiently with sets of levels than quantileExactExclusive.',
        example: 'SELECT quantilesExactExclusive(0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999)(number) FROM numbers(1000)'
      },
      {
        name: 'quantilesExactInclusive',
        title: 'quantilesExactInclusive(level1, level2, ...)(expr)',
        description:
          'Exactly computes the quantiles of a numeric data sequence.\n\nTo get exact value, all the passed values ​​are combined into an array, which is then partially sorted. Therefore, the function consumes O(n) memory, where n is a number of values that were passed. However, for a small number of values, the function is very effective.\n\nThis function is equivalent to PERCENTILE.INC Excel function, (type R7).\n\nWorks more efficiently with sets of levels than quantileExactInclusive.',
        example: 'SELECT quantilesExactInclusive(0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999)(number) FROM numbers(1000)'
      },
      {
        name: 'quantileExact',
        title: 'quantileExact(level)(expr)',
        description:
          'Exactly computes the quantile of a numeric data sequence.\n\nTo get exact value, all the passed values ​​are combined into an array, which is then partially sorted. Therefore, the function consumes O(n) memory, where n is a number of values that were passed. However, for a small number of values, the function is very effective.\n\nWhen using multiple quantile* functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantiles function.',
        example: 'SELECT quantileExact(number) FROM numbers(10)'
      },
      {
        name: 'quantileExactLow',
        title: 'quantileExactLow(level)(expr)',
        description:
          "Similar to quantileExact, this computes the exact quantile of a numeric data sequence.\n\nTo get the exact value, all the passed values are combined into an array, which is then fully sorted. The sorting algorithm's complexity is O(N·log(N)), where N = std::distance(first, last) comparisons.\n\nThe return value depends on the quantile level and the number of elements in the selection, i.e. if the level is 0.5, then the function returns the lower median value for an even number of elements and the middle median value for an odd number of elements. Median is calculated similarly to the median_low implementation which is used in python.\n\nFor all other levels, the element at the index corresponding to the value of level * size_of_array is returned.",
        example: 'SELECT quantileExactLow(number) FROM numbers(10)'
      },
      {
        name: 'quantileExactHigh',
        title: 'quantileExactHigh(level)(expr)',
        description:
          "Similar to quantileExact, this computes the exact quantile of a numeric data sequence.\n\nAll the passed values are combined into an array, which is then fully sorted, to get the exact value. The sorting algorithm's complexity is O(N·log(N)), where N = std::distance(first, last) comparisons.\n\nThe return value depends on the quantile level and the number of elements in the selection, i.e. if the level is 0.5, then the function returns the higher median value for an even number of elements and the middle median value for an odd number of elements. Median is calculated similarly to the median_high implementation which is used in python. For all other levels, the element at the index corresponding to the value of level * size_of_array is returned.\n\nThis implementation behaves exactly similar to the current quantileExact implementation.\n\nWhen using multiple quantile* functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantiles function.",
        example: 'SELECT quantileExactHigh(number) FROM numbers(10)'
      },
      {
        name: 'quantileExactExclusive',
        title: 'quantileExactExclusive(level)(expr)',
        description:
          'Exactly computes the quantile of a numeric data sequence.\n\nTo get exact value, all the passed values ​​are combined into an array, which is then partially sorted. Therefore, the function consumes O(n) memory, where n is a number of values that were passed. However, for a small number of values, the function is very effective.\n\nThis function is equivalent to PERCENTILE.EXC Excel function, (type R6).\n\nWhen using multiple quantileExactExclusive functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantilesExactExclusive function.',
        example: 'SELECT quantileExactExclusive(0.6)(number) FROM numbers(1000)'
      },
      {
        name: 'quantileExactInclusive',
        title: 'quantileExactInclusive(level)(expr)',
        description:
          'Exactly computes the quantile of a numeric data sequence.\n\nTo get exact value, all the passed values ​​are combined into an array, which is then partially sorted. Therefore, the function consumes O(n) memory, where n is a number of values that were passed. However, for a small number of values, the function is very effective.\n\nThis function is equivalent to PERCENTILE.INC Excel function, (type R7).\n\nWhen using multiple quantileExactInclusive functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantilesExactInclusive function.',
        example: 'SELECT quantileExactInclusive(0.6)(number) FROM  numbers(19999)'
      },
      {
        name: 'quantileExactWeighted',
        title: 'quantileExactWeighted(level)(expr, weight)',
        description:
          'Exactly computes the quantile of a numeric data sequence, taking into account the weight of each element.\n\nTo get exact value, all the passed values ​​are combined into an array, which is then partially sorted. Each value is counted with its weight, as if it is present weight times. A hash table is used in the algorithm. Because of this, if the passed values ​​are frequently repeated, the function consumes less RAM than quantileExact. You can use this function instead of quantileExact and specify the weight 1.\n\nWhen using multiple quantile* functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantiles function.',
        example: 'SELECT quantileExactWeighted(n, val) FROM t'
      },
      {
        name: 'quantileTiming',
        title: 'quantileTiming(level)(expr)',
        description:
          'With the determined precision computes the quantile of a numeric data sequence.\n\nThe result is deterministic (it does not depend on the query processing order). The function is optimized for working with sequences which describe distributions like loading web pages times or backend response times.\n\nWhen using multiple quantile* functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantiles function.',
        example: 'SELECT quantileTiming(number) FROM numbers(1000)'
      },
      {
        name: 'quantileTimingWeighted',
        title: 'quantileTimingWeighted(level)(expr, weight)',
        description:
          'With the determined precision computes the quantile of a numeric data sequence according to the weight of each sequence member.\n\nThe result is deterministic (it does not depend on the query processing order). The function is optimized for working with sequences which describe distributions like loading web pages times or backend response times.\n\nWhen using multiple quantile* functions with different levels in a query, the internal states are not combined (that is, the query works less efficiently than it could). In this case, use the quantiles function.',
        example: 'SELECT quantileTimingWeighted(response_time, weight) FROM t'
      },
      {
        name: 'quantilesTimingWeighted',
        title: 'quantilesTimingWeighted(level)(expr, weight)',
        description:
          'Same as quantileTimingWeighted, but accept multiple parameters with quantile levels and return an Array filled with many values of that quantiles.',
        example: 'SELECT quantilesTimingWeighted(0,5, 0.99)(response_time, weight) FROM t\n'
      }
    ],
    Arithmetic: [
      {
        name: 'plus',
        title: 'plus(a, b), a + b operator',
        description:
          'Calculates the sum of the numbers. You can also add integer numbers with a date or date and time. In the case of a date, adding an integer means adding the corresponding number of days. For a date with time, it means adding the corresponding number of seconds.',
        example: 'plus(1,2) = 3'
      },
      {
        name: 'minus',
        title: 'minus(a, b), a - b operator',
        description:
          'Calculates the difference. The result is always signed.\n\nYou can also calculate integer numbers from a date or date with time. The idea is the same – see above for ‘plus’.',
        example: 'minus(5,2) = 3'
      },
      {
        name: 'multiply',
        title: 'multiply(a, b), a * b operator',
        description: 'Calculates the product of the numbers.',
        example: 'multiply(3,12) = 36'
      },
      {
        name: 'divide',
        title: 'divide(a, b), a / b operator',
        description:
          'Calculates the quotient of the numbers. The result type is always a floating-point type. It is not integer division. For integer division, use the ‘intDiv’ function. When dividing by zero you get ‘inf’, ‘-inf’, or ‘nan’.',
        exmaple: 'divide(50,2) = 2.5e+01'
      },
      {
        name: 'intDiv',
        title: 'intDiv(a, b)',
        description:
          'Calculates the quotient of the numbers. Divides into integers, rounding down (by the absolute value). An exception is thrown when dividing by zero or when dividing a minimal negative number by minus one.',
        example: 'intDiv(10, 2) = 5'
      },
      {
        name: 'intDivOrZero',
        title: 'intDivOrZero(a, b)',
        description: 'Differs from ‘intDiv’ in that it returns zero when dividing by zero or when dividing a minimal negative number by minus one.',
        example: 'intDivOrZero(10, -2) = -5'
      },
      {
        name: 'modulo',
        title: 'modulo(a, b), a % b operator',
        description:
          'Calculates the remainder after division. If arguments are floating-point numbers, they are pre-converted to integers by dropping the decimal portion. The remainder is taken in the same sense as in C++. Truncated division is used for negative numbers. An exception is thrown when dividing by zero or when dividing a minimal negative number by minus one.',
        example: 'modulo(10, 3) = 1'
      },
      {
        name: 'moduloOrZero',
        title: 'moduloOrZero(a, b)',
        description: 'Differs from modulo in that it returns zero when the divisor is zero.',
        example: 'moduloOrZero(10, 5) = 0'
      },
      {
        name: 'negate',
        title: 'negate(a), -a operator',
        description: 'Calculates a number with the reverse sign. The result is always signed.',
        example: 'negate(20) = -20'
      },
      {
        name: 'abs',
        title: 'abs(a)',
        description:
          'Calculates the absolute value of the number (a). That is, if a < 0, it returns -a. For unsigned types it doesn’t do anything. For signed integer types, it returns an unsigned number.',
        example: 'abs(-2) = 2'
      },
      {
        name: 'gcd',
        title: 'gcd(a, b)',
        description:
          'Returns the greatest common divisor of the numbers. An exception is thrown when dividing by zero or when dividing a minimal negative number by minus one.',
        example: 'gcd(27,18) = 9'
      },
      {
        name: 'lcm',
        title: 'lcm(a, b)',
        description:
          'Returns the least common multiple of the numbers. An exception is thrown when dividing by zero or when dividing a minimal negative number by minus one.',
        example: 'lcm(27,18) = 54'
      }
    ],
    Array: [
      {
        name: 'empty',
        title: 'empty([x])',
        description: 'Returns 1 for an empty array, or 0 for a non-empty array. The result type is UInt8. The function also works for strings.',
        example: 'SELECT empty([]);'
      },
      {
        name: 'notEmpty',
        title: 'notEmpty([x])',
        description: 'Returns 0 for an empty array, or 1 for a non-empty array. The result type is UInt8. The function also works for strings.',
        example: 'SELECT notEmpty([1,2]);'
      },
      {
        name: 'emptyArrayUInt8',
        title: 'Uint8Array()',
        description:
          "Represents an array of 8-bit unsigned integers. The contents are initialized to 0. Once established, you can reference elements in the array using the object's methods, or using standard array index syntax (that is, using bracket notation).",
        example: 'const x = new Uint8Array([21, 31]);\nconsole.log(x[1]); // 31'
      },
      {
        name: 'emptyArrayUInt16',
        title: 'Uint16Array()',
        description:
          "Represents an array of 16-bit unsigned integers in the platform byte order. If control over byte order is needed, use DataView instead. The contents are initialized to 0. Once established, you can reference elements in the array using the object's methods, or using standard array index syntax (that is, using bracket notation).",
        example: 'const x = new Uint16Array([21, 31]);\nconsole.log(x[1]); // 31'
      },
      {
        name: 'emptyArrayUInt32',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayUInt64',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayInt8',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayInt16',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayInt32',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayInt64',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayFloat32',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayDate',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayDateTime',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayString',
        title: '',
        description: ''
      },
      {
        name: 'emptyArrayToSingle',
        title: '',
        description: ''
      },
      {
        name: 'range',
        title: 'range([start, ] end [, step])',
        description: 'Returns an array of UInt numbers from start to end - 1 by step.',
        example: 'SELECT range(5), range(1, 5), range(1, 5, 2);'
      },
      {
        name: 'array',
        title: 'array(x1, …)',
        description: 'Creates an array from the function arguments.',
        example: 'SELECT array(1,2,3);'
      },
      {
        name: 'arrayConcat',
        title: 'arrayConcat(arrays)',
        description: 'Combines arrays passed as arguments.',
        example: 'SELECT arrayConcat([1, 2], [3, 4], [5, 6]) AS res'
      },
      {
        name: 'has',
        title: '',
        description: ''
      },
      {
        name: 'hasAll',
        title: 'hasAll(set, subset)',
        description: 'Checks whether one array is a subset of another.',
        example: 'SELECT hasAll([], [])'
      },
      {
        name: 'hasAny',
        title: 'hasAny(array1, array2)',
        description: 'Checks whether two arrays have intersection by some elements.',
        example: 'SELECT hasAny([1], [])'
      },
      {
        name: 'hasSubstr',
        title: 'hasSubstr(array1, array2)',
        description:
          'Checks whether all the elements of array2 appear in array1 in the same exact order. Therefore, the function will return 1, if and only if array1 = prefix + array2 + suffix.',
        example: 'SELECT hasSubstr([], [])'
      },
      {
        name: 'indexOf',
        title: 'indexOf(arr, x)',
        description: 'Returns the index of the first ‘x’ element (starting from 1) if it is in the array, or 0 if it is not.',
        example: 'SELECT indexOf([1, 3, NULL, NULL], NULL)'
      },
      {
        name: 'arrayCount',
        title: 'arrayCount([func,] arr1, …)',
        description:
          'Returns the number of elements for which func(arr1[i], …, arrN[i]) returns something other than 0. If func is not specified, it returns the number of non-zero elements in the array.',
        example: 'arrayCount(lambda(tuple(x, y), equals(x, y)), [1, 2, 3], [1, 5, 3]) = 2'
      },
      {
        name: 'countEqual',
        title: 'countEqual(arr, x)',
        description: 'Returns the number of elements in the array equal to x. Equivalent to arrayCount (elem -> elem = x, arr).',
        example: 'SELECT countEqual([1, 2, NULL, NULL], NULL)'
      },
      {
        name: 'arrayEnumerate',
        title: 'arrayEnumerate(arr)',
        description: 'Returns the array [1, 2, 3, …, length (arr) ]',
        example: 'SELECT number, num FROM numbers(5) ARRAY JOIN arrayEnumerate([1,2,3]) as num'
      },
      {
        name: 'arrayEnumerateUniq',
        title: 'arrayEnumerateUniq(arr, …)',
        description: 'Returns an array the same size as the source array, indicating for each element what its position is among elements with the same value.',
        example: 'arrayEnumerateUniq([10, 20, 10, 30])'
      },
      {
        name: 'arrayPopBack',
        title: 'arrayPopBack(array)',
        description: 'Removes the last item from the array.',
        example: 'SELECT arrayPopBack([1, 2, 3]) AS res;'
      },
      {
        name: 'arrayPopFront',
        title: 'arrayPopFront(array)',
        description: 'Removes the first item from the array.',
        example: 'SELECT arrayPopFront([1, 2, 3]) AS res;'
      },
      {
        name: 'arrayPushBack',
        title: 'arrayPushBack(array, single_value)',
        description: 'Adds one item to the end of the array.',
        example: "SELECT arrayPushBack(['a'], 'b') AS res;"
      },
      {
        name: 'arrayPushFront',
        title: 'arrayPushFront(array, single_value)',
        description: 'Adds one element to the beginning of the array.',
        example: "SELECT arrayPushFront(['b'], 'a') AS res;"
      },
      {
        name: 'arrayResize',
        title: 'arrayResize(array, size[, extender])',
        description: 'Changes the length of the array.',
        example: 'SELECT arrayResize([1], 3);'
      },
      {
        name: 'arraySlice',
        title: 'arraySlice(array, offset[, length])',
        description: 'Returns a slice of the array.',
        example: 'SELECT arraySlice([1, 2, NULL, 4, 5], 2, 3) AS res;'
      },
      {
        name: 'arraySort',
        title: 'arraySort([func,] arr, …)',
        description:
          'Sorts the elements of the arr array in ascending order. If the func function is specified, sorting order is determined by the result of the func function applied to the elements of the array. If func accepts multiple arguments, the arraySort function is passed several arrays that the arguments of func will correspond to.',
        example: 'SELECT arraySort([1, 3, 3, 0]);'
      },
      {
        name: 'arrayReverseSort',
        title: 'arrayReverseSort([func,] arr, …)',
        description:
          'Sorts the elements of the arr array in descending order. If the func function is specified, arr is sorted according to the result of the func function applied to the elements of the array, and then the sorted array is reversed. If func accepts multiple arguments, the arrayReverseSort function is passed several arrays that the arguments of func will correspond to. ',
        example: 'SELECT arrayReverseSort([1, 3, 3, 0]);'
      },
      {
        name: 'arrayUniq',
        title: 'arrayUniq(arr, …)',
        description:
          'If one argument is passed, it counts the number of different elements in the array. If multiple arguments are passed, it counts the number of different tuples of elements at corresponding positions in multiple arrays.',
        example: 'SELECT arrayUniq([2, 3]) AS res;'
      },
      {
        name: 'arrayJoin',
        title: 'arrayJoin(arr)',
        description:
          'Takes an array as an argument, and propagates the source row to multiple rows for the number of elements in the array. All the values in columns are simply copied, except the values in the column where this function is applied; it is replaced with the corresponding array value.',
        example: "SELECT arrayJoin([1, 2, 3] AS src) AS dst, 'Hello', src"
      },
      {
        name: 'arrayDifference',
        title: 'arrayDifference(array)',
        description:
          'Calculates the difference between adjacent array elements. Returns an array where the first element will be 0, the second is the difference between a[1] - a[0], etc. The type of elements in the resulting array is determined by the type inference rules for subtraction (e.g. UInt8 - UInt8 = Int16).',
        example: 'SELECT arrayDifference([1, 2, 3, 4]);'
      },
      {
        name: 'arrayDistinct',
        title: 'arrayDistinct(array)',
        description: 'Takes an array, returns an array containing the distinct elements only.',
        example: 'SELECT arrayDistinct([1, 2, 2, 3, 1]);'
      },
      {
        name: 'arrayEnumerateDense',
        title: 'arrayEnumerateDense(arr)',
        description: 'Returns an array of the same size as the source array, indicating where each element first appears in the source array.',
        example: 'SELECT arrayEnumerateDense([10, 20, 10, 30])'
      },
      {
        name: 'arrayIntersect',
        title: 'arrayIntersect(arr)',
        description: 'Takes multiple arrays, returns an array with elements that are present in all source arrays.',
        example: 'SELECT\n    arrayIntersect([1, 2], [1, 3], [2, 3]) AS no_intersect,\n    arrayIntersect([1, 2], [1, 3], [1, 4]) AS intersect'
      },
      {
        name: 'arrayReduce',
        title: 'arrayReduce(agg_func, arr1, arr2, ..., arrN)',
        description:
          "Applies an aggregate function to array elements and returns its result. The name of the aggregation function is passed as a string in single quotes 'max', 'sum'. When using parametric aggregate functions, the parameter is indicated after the function name in parentheses 'uniqUpTo(6)'.",
        example: "SELECT arrayReduce('max', [1, 2, 3]);"
      },
      {
        name: 'arrayReduceInRanges',
        title: 'arrayReduceInRanges(agg_func, ranges, arr1, arr2, ..., arrN)',
        description:
          'Applies an aggregate function to array elements in given ranges and returns an array containing the result corresponding to each range. The function will return the same result as multiple arrayReduce(agg_func, arraySlice(arr1, index, length), ...).',
        example: "SELECT arrayReduceInRanges(\n    'sum',\n    [(1, 5), (2, 3), (3, 4), (4, 4)],\n    [1000000, 200000, 30000, 4000, 500, 60, 7]\n) AS res"
      },
      {
        name: 'arrayReverse',
        title: 'arrayReverse(array)',
        description: 'Returns an array of the same size as the original array containing the elements in reverse order.',
        example: 'SELECT arrayReverse([1, 2, 3])'
      },
      {
        name: 'reverse',
        title: 'arrayReverse(array)',
        description: 'Synonym for “arrayReverse”. Returns an array of the same size as the original array containing the elements in reverse order.',
        example: 'SELECT arrayReverse([1, 2, 3])'
      },
      {
        name: 'arrayFlatten',
        title: 'flatten(array_of_arrays)',
        description: 'Converts an array of arrays to a flat array.',
        example: 'SELECT flatten([[[1]], [[2], [3]]]);'
      },
      {
        name: 'arrayCompact',
        title: 'arrayCompact(arr)',
        description: 'Removes consecutive duplicate elements from an array. The order of result values is determined by the order in the source array.',
        example: 'SELECT arrayCompact([1, 1, nan, nan, 2, 3, 3, 3]);'
      },
      {
        name: 'arrayZip',
        title: 'arrayZip(arr1, arr2, ..., arrN)',
        description:
          'Combines multiple arrays into a single array. The resulting array contains the corresponding elements of the source arrays grouped into tuples in the listed order of arguments.',
        example: "SELECT arrayZip(['a', 'b', 'c'], [5, 2, 1]);"
      },
      {
        name: 'arrayAUC',
        title: 'arrayAUC(arr_scores, arr_labels)',
        description: 'Calculate AUC (Area Under the Curve, which is a concept in machine learning',
        example: 'select arrayAUC([0.1, 0.4, 0.35, 0.8], [0, 0, 1, 1]);'
      },
      {
        name: 'arrayMap',
        title: 'arrayMap(func, arr1, …)',
        description:
          'Returns an array obtained from the original arrays by application of func(arr1[i], …, arrN[i]) for each element. Arrays arr1 … arrN must have the same number of elements.',
        example: 'SELECT arrayMap(x -> (x + 2), [1, 2, 3]) as res;'
      },
      {
        name: 'arrayFilter',
        title: 'arrayFilter(func, arr1, …)',
        description: 'Returns an array containing only the elements in arr1 for which func(arr1[i], …, arrN[i]) returns something other than 0.',
        example: "SELECT arrayFilter(x -> x LIKE '%World%', ['Hello', 'abc World']) AS res"
      },
      {
        name: 'arrayFill',
        title: 'arrayFill(func, arr1, …)',
        description:
          'Scan through arr1 from the first element to the last element and replace arr1[i] by arr1[i - 1] if func(arr1[i], …, arrN[i]) returns 0. The first element of arr1 will not be replaced.',
        example: 'SELECT arrayFill(x -> not isNull(x), [1, null, 3, 11, 12, null, null, 5, 6, 14, null, null]) AS res'
      },
      {
        name: 'arrayReverseFill',
        title: 'arrayReverseFill(func, arr1, …)',
        description:
          'Scan through arr1 from the last element to the first element and replace arr1[i] by arr1[i + 1] if func(arr1[i], …, arrN[i]) returns 0. The last element of arr1 will not be replaced.',
        example: 'SELECT arrayReverseFill(x -> not isNull(x), [1, null, 3, 11, 12, null, null, 5, 6, 14, null, null]) AS res'
      },
      {
        name: 'arraySplit',
        title: 'arraySplit(func, arr1, …)',
        description:
          'Split arr1 into multiple arrays. When func(arr1[i], …, arrN[i]) returns something other than 0, the array will be split on the left hand side of the element. The array will not be split before the first element.',
        example: 'SELECT arraySplit((x, y) -> y, [1, 2, 3, 4, 5], [1, 0, 0, 1, 0]) AS res'
      },
      {
        name: 'arrayReverseSplit',
        title: 'arrayReverseSplit(func, arr1, …)',
        description:
          'Split arr1 into multiple arrays. When func(arr1[i], …, arrN[i]) returns something other than 0, the array will be split on the right hand side of the element. The array will not be split after the last element.',
        example: 'SELECT arrayReverseSplit((x, y) -> y, [1, 2, 3, 4, 5], [1, 0, 0, 1, 0]) AS res'
      },
      {
        name: 'arrayExists',
        title: 'arrayExists([func,] arr1, …)',
        description:
          'Returns 1 if there is at least one element in arr for which func(arr1[i], …, arrN[i]) returns something other than 0. Otherwise, it returns 0.',
        example: 'SELECT arrayExists((x,y)->x==y,[1, 2, 2, 3, 1],[4, 5, 6, 7, 8]);'
      },
      {
        name: 'arrayAll',
        title: 'arrayAll([func,] arr1, …)',
        description: 'Returns 1 if func(arr1[i], …, arrN[i]) returns something other than 0 for all the elements in arrays. Otherwise, it returns 0.',
        example: 'SELECT arrayAll((x,y)->x==y,[1,2,3],[4,5,6]);'
      },
      {
        name: 'arrayFirst',
        title: 'arrayFirst(func, arr1, …)',
        description: 'Returns the first element in the arr1 array for which func(arr1[i], …, arrN[i]) returns something other than 0.',
        example: "SELECT arrayFirst(x -> x LIKE '%World%', ['Hello World', 'abc World']) AS res"
      },
      {
        name: 'arrayFirstIndex',
        title: 'arrayFirstIndex(func, arr1, …) ',
        description: 'Returns the index of the first element in the arr1 array for which func(arr1[i], …, arrN[i]) returns something other than 0.',
        example: "SELECT arrayFirstIndex(x -> x LIKE '%World%', ['Hello World', 'abc World']) AS res"
      },
      {
        name: 'arrayMin',
        title: 'arrayMin([func,] arr)',
        description:
          'Returns the minimum of elements in the source array.\n\nIf the func function is specified, returns the mininum of elements converted by this function.',
        example: 'SELECT arrayMin([1, 2, 4]) AS res;'
      },
      {
        name: 'arrayMax',
        title: 'arrayMax([func,] arr)',
        description:
          'Returns the maximum of elements in the source array.\n\nIf the func function is specified, returns the maximum of elements converted by this function.',
        example: 'SELECT arrayMax([1, 2, 4]) AS res;'
      },
      {
        name: 'arraySum',
        title: 'arraySum([func,] arr)',
        description:
          'Returns the sum of elements in the source array.\n\nIf the func function is specified, returns the sum of elements converted by this function.',
        example: 'SELECT arraySum([2, 3]) AS res;'
      },
      {
        name: 'arrayAvg',
        title: 'arrayAvg([func,] arr)',
        description:
          'Returns the average of elements in the source array.\n\nIf the func function is specified, returns the average of elements converted by this function.',
        example: 'SELECT arrayAvg([1, 2, 4]) AS res;'
      },
      {
        name: 'arrayCumSum',
        title: 'arrayCumSum([func,] arr1, …)',
        description:
          'Returns an array of partial sums of elements in the source array (a running sum). If the func function is specified, then the values of the array elements are converted by func(arr1[i], …, arrN[i]) before summing.',
        example: 'SELECT arrayCumSum([1, 1, 1, 1]) AS res'
      },
      {
        name: 'arrayCumSumNonNegative',
        title: 'arrayCumSumNonNegative([func,] arr1, …)',
        description:
          'Same as arrayCumSum, returns an array of partial sums of elements in the source array (a running sum). Different arrayCumSum, when then returned value contains a value less than zero, the value is replace with zero and the subsequent calculation is performed with zero parameters.',
        example: 'SELECT arrayCumSumNonNegative([1, 1, -4, 1]) AS res'
      },
      {
        name: 'arrayProduct',
        title: 'arrayProduct(arr)',
        description: 'Multiplies elements of an array.',
        example: 'SELECT arrayProduct([1,2,3,4,5,6]) as res;'
      }
    ],
    Bit: [
      {
        name: 'bitAnd',
        title: 'bitAnd(a, b)',
        description: "Returns a bitwise 'AND' of two numbers.",
        example: 'BITAND(1,5) = 1;'
      },
      {
        name: 'bitOr',
        title: 'bitOr(a, b)',
        description: "Returns a bitwise 'OR' of two numbers.",
        example: 'BITOR(23,10) = 31;'
      },
      {
        name: 'bitXor',
        title: 'bitXor(a, b)',
        description: "Returns a bitwise 'XOR' of two numbers.",
        example: 'BITXOR(5,3) = 6;'
      },
      {
        name: 'bitNot',
        title: 'bitNot(a)',
        description: 'Returns the result of a bitwise logical NOT operation performed on a numeric value.',
        example: 'SELECT BITNOT(6);'
      },
      {
        name: 'bitShiftLeft',
        title: 'bitShiftLeft(a, b)',
        description: 'Shifts the binary representation of a value to the left by a specified number of bit positions.',
        example: 'SELECT 99 AS a, bin(a), bitShiftLeft(a, 2) AS a_shifted, bin(a_shifted);'
      },
      {
        name: 'bitShiftRight',
        title: 'bitShiftRight(a, b)',
        description: 'Shifts the binary representation of a value to the right by a specified number of bit positions.',
        example: 'SELECT 101 AS a, bin(a), bitShiftRight(a, 2) AS a_shifted, bin(a_shifted);'
      },
      {
        name: 'bitRotateLeft',
        title: 'bitRotateLeft(a, b)',
        description: 'Rotates all bits to the left.',
        example: 'SELECT bitRotateLeft(uint8_t value, uint8_t pos);'
      },
      {
        name: 'bitRotateRight',
        title: 'bitRotateRight(a, b)',
        description: 'Rotates all bits to the right.',
        example: 'SELECT bitRotateRight(uint8_t value, uint8_t pos);'
      },
      {
        name: 'bitTest',
        title: 'SELECT bitTest(number, index)',
        description:
          'Takes any integer and converts it into binary form, returns the value of a bit at specified position. The countdown starts from 0 from the right to the left.',
        example: 'bitTest(43, 1) = 1;'
      },
      {
        name: 'bitTestAll',
        title: 'SELECT bitTestAll(number, index1, index2, index3, index4, ...)',
        description:
          'Returns result of logical conjuction (AND operator) of all bits at given positions. The countdown starts from 0 from the right to the left.',
        example: 'bitTestAll(43, 0, 1, 3, 5) = 1;'
      },
      {
        name: 'bitTestAny',
        title: 'SELECT bitTestAny(number, index1, index2, index3, index4, ...)',
        description:
          'Returns result of logical disjunction (OR operator) of all bits at given positions. The countdown starts from 0 from the right to the left.',
        example: 'bitTestAny(43, 0, 2) = 1;'
      },
      {
        name: 'bitCount',
        title: 'bitCount(x)',
        description: 'Calculates the number of bits set to one in the binary representation of a number.',
        example: 'bitCount(333) = 5;'
      },
      {
        name: 'bitHammingDistance',
        title: 'bitHammingDistance(int1, int2)',
        description:
          'Returns the Hamming Distance between the bit representations of two integer values. Can be used with SimHash functions for detection of semi-duplicate strings. The smaller is the distance, the more likely those strings are the same.',
        example: 'bitHammingDistance(111, 121) = 3;'
      }
    ],
    Bitmap: [
      {
        name: 'bitmapBuild',
        title: 'bitmapBuild(array)',
        description: 'Builds a bitmap from unsigned integer array.',
        example: 'SELECT bitmapBuild([1, 2, 3, 4, 5]) AS res, toTypeName(res);'
      },
      {
        name: 'bitmapToArray',
        title: 'bitmapToArray(bitmap)',
        description: 'Converts bitmap to integer array.',
        example: 'SELECT bitmapToArray(bitmapBuild([1, 2, 3, 4, 5])) AS res;'
      },
      {
        name: 'bitmapSubsetInRange',
        title: 'bitmapSubsetInRange(bitmap, range_start, range_end)',
        description: 'Returns subset in specified range (not include the range_end).',
        example:
          'SELECT bitmapToArray(bitmapSubsetInRange(bitmapBuild([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,100,200,500]), toUInt32(30), toUInt32(200))) AS res;'
      },
      {
        name: 'bitmapSubsetLimit',
        title: 'bitmapSubsetLimit(bitmap, range_start, cardinality_limit)',
        description: 'Creates a subset of bitmap with n elements taken between range_start and cardinality_limit.',
        example:
          'SELECT bitmapToArray(bitmapSubsetLimit(bitmapBuild([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,100,200,500]), toUInt32(30), toUInt32(200))) AS res;'
      },
      {
        name: 'bitmapContains',
        title: 'bitmapContains(haystack, needle)',
        description: 'Checks whether the bitmap contains an element.',
        example: 'SELECT bitmapContains(bitmapBuild([1,5,7,9]), toUInt32(9)) AS res;'
      },
      {
        name: 'bitmapHasAny',
        title: 'bitmapHasAny(bitmap1, bitmap2)',
        description: 'Checks whether two bitmaps have intersection by some elements.',
        example: 'SELECT bitmapHasAny(bitmapBuild([1,2,3]),bitmapBuild([3,4,5])) AS res;'
      },
      {
        name: 'bitmapHasAll',
        title: 'bitmapHasAll(bitmap,bitmap)',
        description:
          'Analogous to hasAll(array, array) returns 1 if the first bitmap contains all the elements of the second one, 0 otherwise. If the second argument is an empty bitmap then returns 1.',
        example: 'SELECT bitmapHasAll(bitmapBuild([1,2,3]),bitmapBuild([3,4,5])) AS res;'
      },
      {
        name: 'bitmapCardinality',
        title: 'bitmapCardinality(bitmap)',
        description: 'Returns bitmap cardinality of type UInt64.',
        example: 'SELECT bitmapCardinality(bitmapBuild([1, 2, 3, 4, 5])) AS res;'
      },
      {
        name: 'bitmapMin',
        title: 'bitmapMin(bitmap)',
        description: 'Returns the smallest value of type UInt64 in the set, UINT32_MAX if the set is empty.',
        example: 'SELECT bitmapMin(bitmapBuild([1, 2, 3, 4, 5])) AS res;'
      },
      {
        name: 'bitmapMax',
        title: 'bitmapMax(bitmap)',
        description: 'Returns the greatest value of type UInt64 in the set, 0 if the set is empty.',
        example: 'SELECT bitmapMax(bitmapBuild([1, 2, 3, 4, 5])) AS res;'
      },
      {
        name: 'bitmapTransform',
        title: 'bitmapTransform(bitmap, from_array, to_array)',
        description: 'Transform an array of values in a bitmap to another array of values, the result is a new bitmap.',
        example:
          'SELECT bitmapToArray(bitmapTransform(bitmapBuild([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), cast([5,999,2] as Array(UInt32)), cast([2,888,20] as Array(UInt32)))) AS res;'
      },
      {
        name: 'bitmapAnd',
        title: 'bitmapAnd(bitmap,bitmap)',
        description: 'Two bitmap and calculation, the result is a new bitmap.',
        example: 'SELECT bitmapToArray(bitmapAnd(bitmapBuild([1,2,3]),bitmapBuild([3,4,5]))) AS res;'
      },
      {
        name: 'bitmapOr',
        title: 'bitmapOr(bitmap,bitmap)',
        description: 'Two bitmap or calculation, the result is a new bitmap.',
        example: 'SELECT bitmapToArray(bitmapOr(bitmapBuild([1,2,3]),bitmapBuild([3,4,5]))) AS res;'
      },
      {
        name: 'bitmapXor',
        title: 'bitmapXor(bitmap,bitmap)',
        description: 'Two bitmap xor calculation, the result is a new bitmap.',
        example: 'SELECT bitmapToArray(bitmapXor(bitmapBuild([1,2,3]),bitmapBuild([3,4,5]))) AS res;'
      },
      {
        name: 'bitmapAndnot',
        title: 'bitmapAndnot(bitmap,bitmap)',
        description: 'Two bitmap andnot calculation, the result is a new bitmap.',
        example: 'SELECT bitmapToArray(bitmapAndnot(bitmapBuild([1,2,3]),bitmapBuild([3,4,5]))) AS res;'
      },
      {
        name: 'bitmapAndCardinality',
        title: 'bitmapAndCardinality(bitmap,bitmap)',
        description: 'Two bitmap and calculation, return cardinality of type UInt64.',
        example: 'SELECT bitmapAndCardinality(bitmapBuild([1,2,3]),bitmapBuild([3,4,5])) AS res;'
      },
      {
        name: 'bitmapOrCardinality',
        title: 'bitmapOrCardinality(bitmap,bitmap)',
        description: 'Two bitmap or calculation, return cardinality of type UInt64.',
        example: 'SELECT bitmapOrCardinality(bitmapBuild([1,2,3]),bitmapBuild([3,4,5])) AS res;'
      },
      {
        name: 'bitmapAndnotCardinality',
        title: 'bitmapXorCardinality(bitmap,bitmap)',
        description: 'Two bitmap xor calculation, return cardinality of type UInt64.',
        example: 'SELECT bitmapXorCardinality(bitmapBuild([1,2,3]),bitmapBuild([3,4,5])) AS res;'
      }
    ],
    Conditional: [
      {
        name: 'if',
        title: 'if( condition, then, else )',
        description:
          'If the condition cond evaluates to a non-zero value, returns the result of the expression then, and the result of the expression else, if present, is skipped. If the cond is zero or NULL, then the result of the then expression is skipped and the result of the else expression, if present, is returned.',
        example: "if( 2 > 1, 'value A', 'value B')"
      },
      {
        name: 'Ternary Operator',
        title: 'condition ? then : else',
        description: 'It works same as if function.',
        example: "2 > 1 ? 'value A' : 'value B'"
      },
      {
        name: 'multiIf',
        title: 'multiIf( condition_1, then_1, condition_2, then_2,..., else)',
        description: 'It works same as if function. ',
        example: "age_group = multiIf( [age] < 20, '<20', [age] < 30, '20-30', '>30')"
      },
      {
        name: 'case',
        title: 'CASE x WHEN a THEN b WHEN a2 THEN b2 ELSE c',
        description: 'It works same as multiIf function. ',
        example:
          "CASE\r\n    WHEN Quantity > 30 THEN 'The quantity is greater than 30'\r\n    WHEN Quantity = 30 THEN 'The quantity is 30'\r\n    ELSE 'The quantity is under 30'"
      }
    ],
    Conversion: [
      {
        name: 'toInt8',
        title: 'toInt8(expr)',
        description: 'Converts an input value to the Int8 data type.',
        example: 'SELECT toInt8(8.8);'
      },
      {
        name: 'toInt16',
        title: 'toInt16(expr)',
        description: 'Converts an input value to the Int16 data type.',
        example: "SELECT toInt16('16');"
      },
      {
        name: 'toInt32',
        title: 'toInt32(expr)',
        description: 'Converts an input value to the Int32 data type.',
        example: 'SELECT toInt32(32);'
      },
      {
        name: 'toInt64',
        title: 'toInt64(expr)',
        description: 'Converts an input value to the Int64 data type.',
        example: 'SELECT toInt64(nan);'
      },
      {
        name: 'toInt128',
        title: 'toInt128(expr)',
        description: 'Converts an input value to the Int128 data type.',
        example: 'SELECT toInt128(128);'
      },
      {
        name: 'toInt256',
        title: 'toInt256(expr)',
        description: 'Converts an input value to the Int256 data type.',
        example: 'SELECT toInt256(256);'
      },
      {
        name: 'toInt8OrZero',
        title: 'toInt8OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(8). If failed, returns 0.',
        example: "SELECT toInt8OrZero('123qwe123');"
      },
      {
        name: 'toInt16OrZero',
        title: 'toInt16OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(16). If failed, returns 0.',
        example: "SELECT toInt16OrZero('123qwe123');"
      },
      {
        name: 'toInt32OrZero',
        title: 'toInt16OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(16). If failed, returns 0.',
        example: "SELECT toInt16OrZero('123qwe123');"
      },
      {
        name: 'toInt64OrZero',
        title: 'toInt64OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(64). If failed, returns 0.',
        example: "SELECT toInt64OrZero('123qwe123');"
      },
      {
        name: 'toInt128OrZero',
        title: 'toInt128OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(128). If failed, returns 0.',
        example: "SELECT toInt128OrZero('123qwe123');"
      },
      {
        name: 'toInt256OrZero',
        title: 'toInt256OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(256). If failed, returns 0.',
        example: "SELECT toInt256OrZero('123qwe123');"
      },
      {
        name: 'toInt8OrNull',
        title: 'toInt8OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(8). If failed, returns NULL.',
        example: "SELECT toInt8OrNull('123qwe123');"
      },
      {
        name: 'toInt16OrNull',
        title: 'toInt16OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(16). If failed, returns NULL.',
        example: "SELECT toInt16OrNull('123qwe123');"
      },
      {
        name: 'toInt32OrNull',
        title: 'toInt32OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(32). If failed, returns NULL.',
        example: "SELECT toInt32OrNull('123qwe123');"
      },
      {
        name: 'toInt64OrNull',
        title: 'toInt64OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(64). If failed, returns NULL.',
        example: "SELECT toInt64OrNull('123qwe123');"
      },
      {
        name: 'toInt128OrNull',
        title: 'toInt128OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(128). If failed, returns NULL.',
        example: "SELECT toInt128OrNull('123qwe123');"
      },
      {
        name: 'toInt256OrNull',
        title: 'toInt256OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Int(256). If failed, returns NULL.',
        example: "SELECT toInt256OrNull('123qwe123');"
      },
      {
        name: 'toUInt8',
        title: 'toUInt8(expr)',
        description: 'Converts an input value to the UInt8 data type.',
        example: 'SELECT toUInt8(8.8);'
      },
      {
        name: 'toUInt16',
        title: 'toUInt16(expr)',
        description: 'Converts an input value to the UInt16 data type.',
        example: "SELECT toUInt16('16');"
      },
      {
        name: 'toUInt32',
        title: 'toUInt32(expr)',
        description: 'Converts an input value to the UInt32 data type.',
        example: 'SELECT toUInt32(-32);'
      },
      {
        name: 'toUInt64',
        title: 'toUInt64(expr)',
        description: 'Converts an input value to the UInt64 data type.',
        example: 'SELECT toUInt64(nan);'
      },
      {
        name: 'toUInt128',
        title: 'toUInt64(expr)',
        description: 'Converts an input value to the UInt64 data type.',
        example: 'SELECT toUInt64(nan);'
      },
      {
        name: 'toUInt256',
        title: 'toUInt256(expr)',
        description: 'Converts an input value to the UInt256 data type.',
        example: 'SELECT toUInt256(256);'
      },
      {
        name: 'toUInt8OrZero',
        title: 'toUInt8OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(8). If failed, returns 0.',
        example: "SELECT toUInt8OrZero('123qwe123');"
      },
      {
        name: 'toUInt16OrZero',
        title: 'toUInt16OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(16). If failed, returns 0.',
        example: "SELECT toUInt16OrZero('123qwe123');"
      },
      {
        name: 'toUInt32OrZero',
        title: 'toUInt32OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(32). If failed, returns 0.',
        example: "SELECT toUInt32OrZero('123qwe123');"
      },
      {
        name: 'toUInt64OrZero',
        title: 'toUIn64OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(64). If failed, returns 0.',
        example: "SELECT toUInt64OrZero('123qwe123');"
      },
      {
        name: 'toUInt128OrZero',
        title: 'toUInt128OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(128). If failed, returns 0.',
        example: "SELECT toUInt128OrZero('123qwe123');"
      },
      {
        name: 'toUInt256OrZero',
        title: 'toUInt256OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(256). If failed, returns 0.',
        example: "SELECT toUInt256OrZero('123qwe123');"
      },
      {
        name: 'toUInt8OrNull',
        title: 'toUInt8OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(8). If failed, returns NULL.',
        example: "SELECT toUInt8OrNull('123qwe123');"
      },
      {
        name: 'toUInt16OrNull',
        title: 'toUInt16OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(16). If failed, returns NULL.',
        example: "SELECT toUInt16OrNull('123qwe123');"
      },
      {
        name: 'toUInt32OrNull',
        title: 'toUInt32OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(32). If failed, returns NULL.',
        example: "SELECT toUInt32OrNull('123qwe123');"
      },
      {
        name: 'toUInt64OrNull',
        title: 'toUInt64OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(64). If failed, returns NULL.',
        example: "SELECT toUInt64OrNull('123qwe123');"
      },
      {
        name: 'toUInt128OrNull',
        title: 'toUInt128OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(128). If failed, returns NULL.',
        example: "SELECT toUInt128OrNull('123qwe123');"
      },
      {
        name: 'toUInt256OrNull',
        title: 'toUInt256OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into UInt(256). If failed, returns NULL.',
        example: "SELECT toUInt256OrNull('123qwe123');"
      },
      {
        name: 'toFloat32',
        title: 'toFloat32(expr)',
        description: 'Converts an input value to the Float32 data type.',
        example: 'SELECT toFloat32(42);'
      },
      {
        name: 'toFloat64',
        title: 'toFloat64(expr)',
        description: 'Converts an input value to the Float64 data type.',
        example: 'SELECT toFloat64(42);'
      },
      {
        name: 'toFloat32OrZero',
        title: 'toFloat32OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Float32. If failed, returns 0.',
        example: "SELECT toFloat32OrZero('123qwe123');"
      },
      {
        name: 'toFloat64OrZero',
        title: 'toFloat64OrZero(expr)',
        description: 'It takes an argument of type String and tries to parse it into Float64. If failed, returns 0.',
        example: "SELECT toFloat64OrZero('123qwe123');"
      },
      {
        name: 'toFloat32OrNull',
        title: 'toFloat32OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Float32. If failed, returns NULL.',
        example: "SELECT toFloat32OrNull('123qwe123');"
      },
      {
        name: 'toFloat64OrNull',
        title: 'toFloat64OrNull(expr)',
        description: 'It takes an argument of type String and tries to parse it into Float64. If failed, returns NULL.',
        example: "SELECT toFloat64OrNull('123qwe123');"
      },
      {
        name: 'toDate',
        title: 'toDate(x)',
        description: 'Converts the argument to Date data type.',
        example: 'SELECT toDate(12345);'
      },
      {
        name: 'toDateOrZero',
        title: 'toDateOrZero(x)',
        description: 'It takes an argument and tries to parse it into Date. If failed, returns 0.',
        example: 'SELECT toDateOrZero(12345);'
      },
      {
        name: 'toDateOrNull',
        title: 'toDateOrNull(x)',
        description: 'It takes an argument and tries to parse it into Date. If failed, returns NULL.',
        example: 'SELECT toDateOrNull(12345);'
      },
      {
        name: 'toDateTime',
        title: 'toDateTime(x)',
        description: 'Converts the argument to date and timestamp value.',
        example: "SELECT toDateTime('2019-01-01 00:00:00');"
      },
      {
        name: 'toDateTimeOrZero',
        title: 'toDateTimeOrZero(x)',
        description: 'It takes an argument and tries to parse it into Date and Timestamp. If failed, returns 0.',
        example: "SELECT toDateTimeOrZero('2019-01-01 00:00:00');"
      },
      {
        name: 'toDateTimeOrNull',
        title: 'toDateTimeOrNull(x)',
        description: 'It takes an argument and tries to parse it into Date and Timestamp. If failed, returns NULL.',
        example: "SELECT toDateTimeOrNull('2019-01-01 00:00:00');"
      },
      {
        name: 'toDecimal32',
        title: 'toDecimal32(value, S)',
        description:
          'Converts value to the Decimal32 data type with precision of S. The value can be a number or a string. The S (scale) parameter specifies the number of decimal places.',
        example: 'SELECT toDecimal32(1, 2);'
      },
      {
        name: 'toDecimal64',
        title: 'toDecimal64(value, S)',
        description:
          'Converts value to the Decimal64 data type with precision of S. The value can be a number or a string. The S (scale) parameter specifies the number of decimal places.',
        example: 'SELECT toDecimal64(1, 2);'
      },
      {
        name: 'toDecimal128',
        title: 'toDecimal128(value, S)',
        description:
          'Converts value to the Decimal128 data type with precision of S. The value can be a number or a string. The S (scale) parameter specifies the number of decimal places.',
        example: 'SELECT toDecimal128(1, 2);'
      },
      {
        name: 'toDecimal256',
        title: 'toDecimal256(value, S)',
        description:
          'Converts value to the Decimal256 data type with precision of S. The value can be a number or a string. The S (scale) parameter specifies the number of decimal places.',
        example: 'SELECT toDecimal256(1, 2);'
      },
      {
        name: 'toDecimal32OrNull',
        title: 'toDecimal32OrNull(expr, S)',
        description:
          'Converts an input string to a Nullable(Decimal32(S)) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a NULL value instead of an exception in the event of an input value parsing error.',
        exampe: 'SELECT toDecimal32OrNull(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal64OrNull',
        title: 'toDecimal64OrNull(expr, S)',
        description:
          'Converts an input string to a Nullable(Decimal64(S)) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a NULL value instead of an exception in the event of an input value parsing error.',
        exampe: 'SELECT toDecimal64OrNull(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal128OrNull',
        title: 'toDecimal128OrNull(expr, S)',
        description:
          'Converts an input string to a Nullable(Decimal128(S)) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a NULL value instead of an exception in the event of an input value parsing error.',
        exampe: 'SELECT toDecimal128OrNull(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal256OrNull',
        title: 'toDecimal256OrNull(expr, S)',
        description:
          'Converts an input string to a Nullable(Decimal256(S)) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a NULL value instead of an exception in the event of an input value parsing error.',
        exampe: 'SELECT toDecimal256OrNull(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal32OrZero',
        title: 'toDecimal32OrZero( expr, S)',
        description:
          'Converts an input value to the Decimal32(S) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a 0 value instead of an exception in the event of an input value parsing error.',
        example: 'SELECT toDecimal32OrZero(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal64OrZero',
        title: 'toDecimal64OrZero( expr, S)',
        description:
          'Converts an input value to the Decimal64(S) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a 0 value instead of an exception in the event of an input value parsing error.',
        example: 'SELECT toDecimal64OrZero(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal128OrZero',
        title: 'toDecimal128OrZero( expr, S)',
        description:
          'Converts an input value to the Decimal128(S) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a 0 value instead of an exception in the event of an input value parsing error.',
        example: 'SELECT toDecimal128OrZero(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toDecimal256OrZero',
        title: 'toDecimal256OrZero( expr, S)',
        description:
          'Converts an input value to the Decimal256(S) data type. This function should be used instead of toDecimal*() functions, if you prefer to get a 0 value instead of an exception in the event of an input value parsing error.',
        example: 'SELECT toDecimal256OrZero(toString(-1.111), 5) AS val, toTypeName(val);'
      },
      {
        name: 'toString',
        title: 'toString(value)',
        description: 'Converts between numbers, strings (but not fixed strings), dates, and dates with times.',
        example: "SELECT\n    now() AS now_local,\n    toString(now(), 'Asia/Yekaterinburg') AS now_yekat;"
      },
      {
        name: 'toFixedString',
        title: 'toFixedString(s, N)',
        description:
          'Converts a String type argument to a FixedString(N) type (a string with fixed length N). N must be a constant. If the string has fewer bytes than N, it is padded with null bytes to the right. If the string has more bytes than N, an exception is thrown.',
        example: "SELECT toFixedString('1234', 5)"
      },
      {
        name: 'toStringCutToZero',
        title: 'toStringCutToZero(s)',
        description: 'Accepts a String or FixedString argument. Returns the String with the content truncated at the first zero byte found.',
        example: "SELECT toFixedString('foo', 8) AS s, toStringCutToZero(s) AS s_cut;"
      },
      {
        name: 'reinterpretAsUInt8',
        title: 'reinterpretAsUInt8(expr)',
        description:
          'Returns the UInt8 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsUInt8(32);'
      },
      {
        name: 'reinterpretAsUInt16',
        title: 'reinterpretAsUInt16(expr)',
        description:
          'Returns the UInt16 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsUInt16(32);'
      },
      {
        name: 'reinterpretAsUInt32',
        title: 'reinterpretAsUInt32(expr)',
        description:
          'Returns the UInt32 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsUInt32(32);'
      },
      {
        name: 'reinterpretAsUInt64',
        title: 'reinterpretAsUInt64(expr)',
        description:
          'Returns the UInt64 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsUInt64(32);'
      },
      {
        name: 'reinterpretAsInt8',
        title: 'reinterpretAsInt8(expr)',
        description:
          'Returns the Int8 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsInt8(32);'
      },
      {
        name: 'reinterpretAsInt16',
        title: 'reinterpretAsInt16(expr)',
        description:
          'Returns the Int16 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsInt16(32);'
      },
      {
        name: 'reinterpretAsInt32',
        title: 'reinterpretAsInt32(expr)',
        description:
          'Returns the Int32 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsInt32(32);'
      },
      {
        name: 'reinterpretAsInt64',
        title: 'reinterpretAsInt64(expr)',
        description:
          'Returns the Int64 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsInt64(32);'
      },
      {
        name: 'reinterpretAsFloat32',
        title: 'reinterpretAsFloat32(expr)',
        description:
          'Returns the Float32 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsFloat32(42);'
      },
      {
        name: 'reinterpretAsFloat64',
        title: 'reinterpretAsFloat64(expr)',
        description:
          'Returns the Float64 data type containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. ',
        example: 'SELECT reinterpretAsFloat64(42);'
      },
      {
        name: 'reinterpretAsDate',
        title: 'reinterpretAsDate(fixed_string)',
        description:
          'Accepts a string and interpret the bytes placed at the beginning of the string as a number in host order (little endian). If the string isn’t long enough, the functions work as if the string is padded with the necessary number of null bytes. If the string is longer than needed, the extra bytes are ignored. A date is interpreted as the number of days since the beginning of the Unix Epoch.',
        example: "SELECT reinterpretAsDate(reinterpretAsString(toDate('2019-01-01')));"
      },
      {
        name: 'reinterpretAsDateTime',
        title: 'reinterpretAsDateTime(fixed_string)',
        description:
          'Accepts a string and interpret the bytes placed at the beginning of the string as a number in host order (little endian). If the string isn’t long enough, the functions work as if the string is padded with the necessary number of null bytes. If the string is longer than needed, the extra bytes are ignored. A date is interpreted as the number of days since the beginning of the Unix Epoch, and a date with time is interpreted as the number of seconds since the beginning of the Unix Epoch.',
        example: "SELECT reinterpretAsDateTime(reinterpretAsString(toDateTime('2019-01-01 00:00:00')));"
      },
      {
        name: 'reinterpretAsString',
        title: 'reinterpretAsString(value)',
        description:
          'Accepts a number or date or date with time and returns a string containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. For example, a UInt32 type value of 255 is a string that is one byte long.',
        example: "SELECT reinterpretAsString(toDate('2019-01-01'));"
      },
      {
        name: 'reinterpretAsFixedString',
        title: 'reinterpretAsFixedString(x)',
        description:
          'Accepts a number or date or date with time, and returns a FixedString containing bytes representing the corresponding value in host order (little endian). Null bytes are dropped from the end. For example, a UInt32 type value of 255 is a FixedString that is one byte long.',
        example: "SELECT reinterpretAsFixedString(toDate('2019-01-01'));"
      },
      {
        name: 'reinterpretAsUUID',
        title: 'reinterpretAsUUID(fixed_string)',
        description:
          "Accepts 16 bytes string and returns UUID containing bytes representing the corresponding value in network byte order (big-endian). If the string isn't long enough, the function works as if the string is padded with the necessary number of null bytes to the end. If the string is longer than 16 bytes, the extra bytes at the end are ignored.",
        example: "SELECT reinterpretAsUUID(reverse(unhex('000102030405060708090a0b0c0d0e0f')));"
      },
      {
        name: 'reinterpret',
        title: 'reinterpret(x, type)',
        description: 'Uses the same source in-memory bytes sequence for x value and reinterprets it to destination type.',
        example: "SELECT reinterpret(toInt8(-1), 'UInt8') as int_to_uint;"
      },
      {
        name: 'CAST',
        title: 'CAST(x, T)',
        description:
          'Converts an input value to the specified data type. Unlike the reinterpret function, CAST tries to present the same value using the new data type. If the conversion can not be done then an exception is raised. Several syntax variants are supported.',
        example: "SELECT\n    CAST(toInt8(-1), 'UInt8') AS cast_int_to_uint;"
      },
      {
        name: 'accurateCast',
        title: 'accurateCast(x, T)',
        description:
          'Converts x to the T data type.\nThe difference from cast(x, T) is that accurateCast does not allow overflow of numeric types during cast if type value x does not fit the bounds of type T.',
        example: "SELECT cast(-1, 'UInt8') as uint8;"
      },
      {
        name: 'accurateCastOrNull',
        title: 'accurateCastOrNull(x, T)',
        description:
          'Converts input value x to the specified data type T. Always returns Nullable type and returns NULL if the casted value is not representable in the target type.',
        example: "SELECT toTypeName(accurateCastOrNull(5, 'UInt8'));"
      },
      {
        name: 'toInterval',
        title: 'toInterval(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: 'toInterval(1)'
      },
      {
        name: 'parseDateTimeBestEffort',
        title: 'parseDateTimeBestEffort(time_string [, time_zone])',
        description: 'Parse a number type argument to a Date or DateTime type.',
        example: "SELECT parseDateTimeBestEffort('23/10/2020 12:12:57')\nAS parseDateTimeBestEffort;"
      },
      {
        name: 'parseDateTime32BestEffort',
        title: 'parseDateTime32BestEffort(time_string [, time_zone])',
        description: 'Converts a date and time in the String representation to DateTime data type.',
        example: "SELECT\n    '04-Jun-2021' AS str,\n    parseDateTime32BestEffort(str) AS dateTime,\n    toDate(dateTime) AS date;\n"
      },
      {
        name: 'parseDateTimeBestEffortUS',
        title: 'parseDateTimeBestEffortUS(time_string [, time_zone])',
        description:
          'This function behaves like parseDateTimeBestEffort for ISO date formats, e.g. YYYY-MM-DD hh:mm:ss, and other date formats where the month and date components can be unambiguously extracted, e.g. YYYYMMDDhhmmss, YYYY-MM, DD hh, or YYYY-MM-DD hh:mm:ss ±h:mm. If the month and the date components cannot be unambiguously extracted, e.g. MM/DD/YYYY, MM-DD-YYYY, or MM-DD-YY, it prefers the US date format instead of DD/MM/YYYY, DD-MM-YYYY, or DD-MM-YY. As an exception from the latter, if the month is bigger than 12 and smaller or equal than 31, this function falls back to the behavior of parseDateTimeBestEffort, e.g. 15/08/2020 is parsed as 2020-08-15.',
        example: "SELECT parseDateTimeBestEffortUS('23/10/2020 12:12:57')\nAS pparseDateTimeBestEffortUS;"
      },
      {
        name: 'parseDateTimeBestEffortOrNull',
        title: 'parseDateTimeBestEffortOrNull(time_string [, time_zone])',
        description: 'Same as for parseDateTimeBestEffort except that it returns NULL when it encounters a date format that cannot be processed.',
        example: "parseDateTimeBestEffortOrNull('23/10/2020 12:12:57')\nAS parseDateTimeBestEffortOrNull;"
      },
      {
        name: 'parseDateTime32BestEffortOrNull',
        title: 'parseDateTime32BestEffortOrNull(time_string [, time_zone])',
        description: 'Same as for parseDateTimeBestEffort except that it returns NULL when it encounters a date format that cannot be processed.',
        example: "parseDateTime32BestEffortOrNull('23/10/2020 12:12:57')\nAS parseDateTime32BestEffortOrNull;"
      },
      {
        name: 'parseDateTimeBestEffortOrZero',
        title: 'parseDateTimeBestEffortOrZero(time_string [, time_zone])',
        description:
          'Same as for parseDateTimeBestEffort except that it returns zero date or zero date time when it encounters a date format that cannot be processed.',
        example: "parseDateTimeBestEffortOrZero('23/10/2020 12:12:57')\nAS parseDateTimeBestEffortOrZero;"
      },
      {
        name: 'parseDateTime32BestEffortOrZero',
        title: 'parseDateTime32BestEffortOrZero(time_string [, time_zone])',
        description:
          'Same as for parseDateTimeBestEffort except that it returns zero date or zero date time when it encounters a date format that cannot be processed.',
        example: "parseDateTime32BestEffortOrZero('23/10/2020 12:12:57')\nAS parseDateTime32BestEffortOrZero;"
      },
      {
        name: 'parseDateTimeBestEffortUSOrNull',
        title: 'parseDateTimeBestEffortUSOrNull(time_string [, time_zone])',
        description: 'Same as parseDateTimeBestEffortUS function except that it returns NULL when it encounters a date format that cannot be processed.',
        example: "SELECT parseDateTimeBestEffortUSOrNull('23/10/2020 12:12:57')\nAS parseDateTimeBestEffortUSOrNull;"
      },
      {
        name: 'parseDateTimeBestEffortUSOrZero',
        title: 'parseDateTimeBestEffortUSOrZero(time_string [, time_zone])',
        description:
          'Same as parseDateTimeBestEffortUS function except that it returns zero date (1970-01-01) or zero date with time (1970-01-01 00:00:00) when it encounters a date format that cannot be processed.',
        example: "SELECT parseDateTimeBestEffortUSOrNull('23/10/2020 12:12:57')\nAS parseDateTimeBestEffortUSOrNull;"
      },
      {
        name: 'parseDateTime64BestEffort',
        title: 'parseDateTime64BestEffort(time_string [, precision [, time_zone]])',
        description: 'Same as parseDateTimeBestEffort function but also parse milliseconds and microseconds and returns DateTime data type.',
        example: "SELECT parseDateTime64BestEffort('2021-01-01') AS a, toTypeName(a) AS t\nUNION ALL;"
      },
      {
        name: 'parseDateTime64BestEffortUS',
        title: 'parseDateTime64BestEffortUS(time_string [, precision [, time_zone]])',
        description: 'Same as for parseDateTime64BestEffort, except that this function prefers US date format (MM/DD/YYYY etc.) in case of ambiguity.',
        example: "SELECT parseDateTime64BestEffortUS('2021-01-01') AS a, toTypeName(a) AS t\nUNION ALL;"
      },
      {
        name: 'parseDateTime64BestEffortOrNull',
        title: 'parseDateTime64BestEffortOrNull(time_string [, precision [, time_zone]])',
        description: 'Same as for parseDateTime64BestEffort except that it returns NULL when it encounters a date format that cannot be processed.',
        example: "SELECT parseDateTime64BestEffortOrNull('2021-01-01') AS a, toTypeName(a) AS t\nUNION ALL;"
      },
      {
        name: 'parseDateTime64BestEffortOrZero',
        title: 'parseDateTime64BestEffortOrZero(time_string [, precision [, time_zone]])',
        description:
          'Same as for parseDateTime64BestEffort except that it returns zero date or zero date time when it encounters a date format that cannot be processed.',
        example: "SELECT parseDateTime64BestEffortOrZero('2021-01-01') AS a, toTypeName(a) AS t\nUNION ALL;"
      },
      {
        name: 'toLowCardinality',
        title: 'toLowCardinality(expr)',
        description:
          'Converts input parameter to the LowCardinality version of same data type.\nTo convert data from the LowCardinality data type use the CAST function. For example, CAST(x as String).',
        example: "SELECT toLowCardinality('1');"
      },
      {
        name: 'toUnixTimestamp64Milli',
        title: 'toUnixTimestamp64Milli(value)',
        description:
          'Converts a DateTime64 to a Int64 value with fixed sub-second precision. Input value is scaled up or down appropriately depending on it precision.',
        example: "WITH toDateTime64('2019-09-16 19:20:12.345678910', 6) AS dt64\nSELECT toUnixTimestamp64Milli(dt64);"
      },
      {
        name: 'toUnixTimestamp64Micro',
        title: 'toUnixTimestamp64Micro(value)',
        description:
          'Converts a DateTime64 to a Int64 value with fixed sub-second precision. Input value is scaled up or down appropriately depending on it precision.',
        example: "WITH toDateTime64('2019-09-16 19:20:12.345678910', 6) AS dt64\nSELECT toUnixTimestamp64Micro(dt64);"
      },
      {
        name: 'toUnixTimestamp64Nano',
        title: 'toUnixTimestamp64Nano(value)',
        description:
          'Converts a DateTime64 to a Int64 value with fixed sub-second precision. Input value is scaled up or down appropriately depending on it precision.',
        example: "WITH toDateTime64('2019-09-16 19:20:12.345678910', 6) AS dt64\nSELECT toUnixTimestamp64Nano(dt64);"
      },
      {
        name: 'fromUnixTimestamp64Milli',
        title: 'fromUnixTimestamp64Milli(value [, ti])',
        description:
          'Converts an Int64 to a DateTime64 value with fixed sub-second precision and optional timezone. Input value is scaled up or down appropriately depending on it’s precision. Please note that input value is treated as UTC timestamp, not timestamp at given (or implicit) timezone.',
        example: "WITH CAST(1234567891011, 'Int64') AS i64\nSELECT fromUnixTimestamp64Milli(i64, 'UTC');"
      },
      {
        name: 'fromUnixTimestamp64Micro',
        title: 'fromUnixTimestamp64Micro(value [, ti])',
        description:
          'Converts an Int64 to a DateTime64 value with fixed sub-second precision and optional timezone. Input value is scaled up or down appropriately depending on it’s precision. Please note that input value is treated as UTC timestamp, not timestamp at given (or implicit) timezone.',
        example: "WITH CAST(1234567891011, 'Int64') AS i64\nSELECT fromUnixTimestamp64Micro(i64, 'UTC');"
      },
      {
        name: 'fromUnixTimestamp64Nano',
        title: 'fromUnixTimestamp64Nano(value [, ti])',
        description:
          'Converts an Int64 to a DateTime64 value with fixed sub-second precision and optional timezone. Input value is scaled up or down appropriately depending on it’s precision. Please note that input value is treated as UTC timestamp, not timestamp at given (or implicit) timezone.',
        example: "WITH CAST(1234567891011, 'Int64') AS i64\nSELECT fromUnixTimestamp64Nano(i64, 'UTC');"
      },
      {
        name: 'formatRow',
        title: 'formatRow(format, x, y, ...)',
        description: 'Converts arbitrary expressions into a string via given format.',
        example: "SELECT formatRow('CSV', number, 'good')\nFROM numbers(3);"
      },
      {
        name: 'formatRowNoNewline',
        title: 'formatRowNoNewline(format, x, y, ...)',
        description: 'Converts arbitrary expressions into a string via given format. The function trims the last \\n if any.',
        example: "SELECT formatRowNoNewline('CSV', number, 'good')\nFROM numbers(3);"
      },
      {
        name: 'toIntervalYear',
        title: 'toIntervalYear(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDate(toDate('2020-01-01') + toIntervalYear(7))\n//2027-01-01"
      },
      {
        name: 'toIntervalQuarter',
        title: 'toIntervalQuarter(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDate(toDate('2020-01-01') + toIntervalQuarter(6))\n//2021-07-01"
      },
      {
        name: 'toIntervalMonth',
        title: 'toIntervalMonth(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDate(toDate('2020-01-01') + toIntervalMonth(6))\n//2020-07-01"
      },
      {
        name: 'toIntervalWeek',
        title: 'toIntervalWeek(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDate(toDate('2020-01-01') + toIntervalWeek(6))\n//2020-02-12"
      },
      {
        name: 'toIntervalDay',
        title: 'toIntervalDay(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDate(toDate('2020-01-01') + toIntervalDay(6))\n//2020-01-07"
      },
      {
        name: 'toIntervalHour',
        title: 'toIntervalHour(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDateTime(toDate('2020-01-01') + toIntervalHour(6))\n//2020-01-01T06:00"
      },
      {
        name: 'toIntervalMinute',
        title: 'toIntervalMinute(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDateTime(toDate('2020-01-01') + toIntervalMinute(6))\n//2020-01-01T00:06"
      },
      {
        name: 'toIntervalSecond',
        title: 'toIntervalSecond(number)',
        description: 'Converts a Number type argument to an Interval data type.',
        example: "SELECT toDateTime(toDate('2020-01-01') + toIntervalSecond(6))\n//2020-01-01T00:00:06"
      }
    ],
    'Data types': [
      {
        name: 'Int8',
        title: 'Int8',
        description: '[-128 : 127]'
      },
      {
        name: 'Int16',
        title: 'Int16',
        description: '[-32768 : 32767]'
      },
      {
        name: 'Int32',
        title: 'Int32',
        description: '[-2147483648 : 2147483647]'
      },
      {
        name: 'Int64',
        title: 'Int64',
        description: '[-9223372036854775808 : 9223372036854775807]'
      },
      {
        name: 'Int128',
        title: 'Int128',
        description: '[-170141183460469231731687303715884105728 : 170141183460469231731687303715884105727]'
      },
      {
        name: 'Int256',
        title: 'Int256',
        description:
          '[-57896044618658097711785492504343953926634992332820282019728792003956564819968 : 57896044618658097711785492504343953926634992332820282019728792003956564819967]'
      },
      {
        name: 'UInt8',
        title: 'UInt8',
        description: '[0 : 255]'
      },
      {
        name: 'UInt16',
        title: 'UInt16',
        description: '[0 : 65535]'
      },
      {
        name: 'UInt32',
        title: 'UInt32',
        description: '[0 : 4294967295]'
      },
      {
        name: 'UInt64',
        title: 'UInt64',
        description: '[0 : 18446744073709551615]'
      },
      {
        name: 'UInt128',
        title: 'UInt128',
        description: '[0 : 340282366920938463463374607431768211455]'
      },
      {
        name: 'UInt256',
        title: 'UInt256',
        description: '[0 : 115792089237316195423570985008687907853269984665640564039457584007913129639935]'
      },
      {
        name: 'Float32',
        title: 'Float32',
        description: 'FLOAT'
      },
      {
        name: 'Float64',
        title: 'Float64',
        description: 'DOUBLE'
      },
      {
        name: 'Decimal32',
        title: 'Decimal32',
        description: 'S(synonym): [0, P], P(precision): [ 1 : 9 ],Range Decimal32(S):( -1 * 10^(9 - S), 1 * 10^(9 - S) )',
        example: 'SELECT toDecimal32(2, 4) AS x, x / 3'
      },
      {
        name: 'Decimal64',
        title: 'Decimal64',
        description: 'S(synonym): [0, P], P(precision): [ 10 : 18 ],Range Decimal64(S):( -1 * 10^(18 - S), 1 * 10^(18 - S) )'
      },
      {
        name: 'Decimal128',
        title: 'Decimal128',
        description: 'S(synonym): [0, P], P(precision): [ 19 : 38 ],Range Decimal128(S):( -1 * 10^(38 - S), 1 * 10^(38 - S) )'
      },
      {
        name: 'Decimal256',
        title: 'Decimal256',
        description: 'S(synonym): [0, P], P(precision): [ 39 : 76 ],Range Decimal256(S):( -1 * 10^(76 - S), 1 * 10^(76 - S) )'
      },
      {
        name: 'Bool',
        title: 'Bool',
        description: 'true(1), false(0)'
      },
      {
        name: 'String',
        title: 'String',
        description: 'Strings of an arbitrary length. The length is not limited. The value can contain an arbitrary set of bytes, including null bytes.'
      },
      {
        name: 'Date',
        title: 'Date',
        description: 'Supported range of values: [1970-01-01, 2149-06-06].'
      },
      {
        name: 'Date32',
        title: 'Date32',
        description:
          'A date. Supports the date range same with Datetime64. Stored in four bytes as the number of days since 1925-01-01. Allows storing values till 2283-11-11.'
      },
      {
        name: 'Datetime',
        title: 'Datetime',
        description:
          'Allows to store an instant in time, that can be expressed as a calendar date and a time of a day. Supported range of values: [1970-01-01 00:00:00, 2106-02-07 06:28:15].'
      },
      {
        name: 'Datetime64',
        title: 'Datetime64',
        description:
          'Allows to store an instant in time, that can be expressed as a calendar date and a time of a day. Supported range of values: [1925-01-01 00:00:00, 2283-11-11 23:59:59.99999999] '
      }
    ],
    Date: [
      {
        name: 'timeZone',
        title: 'timeZone',
        description:
          'Returns the timezone of the server. If it is executed in the context of a distributed table, then it generates a normal column with values relevant to each shard. Otherwise it produces a constant value.',
        example: 'SELECT timeZone()\n//UTC'
      },
      {
        name: 'toTimeZone',
        title: 'toTimeZone(date_or_datetime, timezone)',
        description: 'Convert time or date and time to(DateTime64) the specified time zone(string).',
        example:
          "SELECT toDateTime('2019-01-01 00:00:00', 'UTC') AS time_utc,\ntoTimeZone(time_utc, 'Asia/Yekaterinburg'),\ntoTimeZone(time_utc, 'US/Samoa')\n//2019-01-01T00:00Z\n2019-01-01T05:00+05:00\n2018-12-31T13:00-11:00"
      },
      {
        name: 'timeZoneOf',
        title: 'timeZoneOf(datetime)',
        description: 'Returns the timezone name of DateTime or DateTime64 data types.',
        example: 'SELECT timeZoneOf(now())\n//UTC'
      },
      {
        name: 'timeZoneOffset',
        title: 'timeZoneOffset(datetime)',
        description: 'Returns a timezone offset in seconds from UTC.',
        example:
          "SELECT toDateTime('2021-04-21 10:20:30', 'America/New_York') AS Time, toTypeName(Time) AS Type,\ntimeZoneOffset(Time) AS Offset_in_seconds\n//2021-04-21T10:20:30-04:00\nDateTime('America/New_York')\n-14400"
      },
      {
        name: 'toYear',
        title: 'toYear(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the year number (AD).',
        example: 'SELECT  toYear(now())\n//2022'
      },
      {
        name: 'YEAR',
        title: 'YEAR(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the year number (AD).',
        example: 'SELECT  YEAR(now())\n//2022'
      },
      {
        name: 'toQuarter',
        title: 'toQuarter(date_or_datetime)',
        description: 'Converts a date or date with time to a UInt8 number containing the quarter number.',
        example: "SELECT toQuarter(toDateTime('2022-06-23T11:16:17'))\n//2"
      },
      {
        name: 'QUARTER',
        title: 'QUARTER(date_or_datetime)',
        description: 'Converts a date or date with time to a UInt8 number containing the quarter number.',
        example: "SELECT QUARTER(toDateTime('2022-06-23T11:16:17'))\n//2"
      },
      {
        name: 'toMonth',
        title: 'toMonth(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the month number (1-12).',
        example: "SELECT  toMonth(toDateTime('2022-06-23T11:16:17'))\n//6"
      },
      {
        name: 'MONTH',
        title: 'MONTH(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the month number (1-12).',
        example: "SELECT  MONTH(toDateTime('2022-06-23T11:16:17'))\n//6"
      },
      {
        name: 'toDayOfYear',
        title: 'toDayOfYear(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the year (1-366).',
        example: "SELECT  toDayOfYear(toDateTime('2022-06-23T11:16:17'))\n//174"
      },
      {
        name: 'DAYOFYEAR',
        title: 'DAYOFYEAR(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the year (1-366).',
        example: "SELECT  DAYOFYEAR(toDateTime('2022-06-23T11:16:17'))\n//174"
      },
      {
        name: 'toDayOfMonth',
        title: 'toDayOfMonth(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the month (1-31).',
        example: "SELECT  toDayOfMonth(toDateTime('2022-06-23T11:16:17'))\n//23"
      },
      {
        name: 'DAYOFMONTH',
        title: 'DAYOFMONTH(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the month (1-31).',
        example: "SELECT  DAYOFMONTH(toDateTime('2022-06-23T11:16:17'))\n//23"
      },
      {
        name: 'DAY',
        title: 'DAY(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the month (1-31).',
        example: "SELECT  DAY(toDateTime('2022-06-23T11:16:17'))\n//23"
      },
      {
        name: 'toDayOfWeek',
        title: 'toDayOfWeek(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the week (Monday is 1, and Sunday is 7).',
        example: "SELECT  toDayOfWeek(toDateTime('2022-06-23T11:16:17'))\n//4"
      },
      {
        name: 'DAYOFWEEK',
        title: 'DAYOFWEEK(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the number of the day of the week (Monday is 1, and Sunday is 7).',
        example: "SELECT  DAYOFWEEK(toDateTime('2022-06-23T11:16:17'))\n//4"
      },
      {
        name: 'toHour',
        title: 'toHour(datetime)',
        description: 'Converts a date with time to a  number containing the number of the hour in 24-hour time (0-23)',
        example: "SELECT  toHour(toDateTime('2022-06-23T11:16:17'))\n//11"
      },
      {
        name: 'HOUR',
        title: 'HOUR(datetime)',
        description: 'Converts a date with time to a  number containing the number of the hour in 24-hour time (0-23)',
        example: "SELECT  HOUR(toDateTime('2022-06-23T11:16:17'))\n//11"
      },
      {
        name: 'MINUTE',
        title: 'MINUTE(datetime)',
        description: 'Converts a date with time to a number containing the number of the minute of the hour (0-59).',
        example: "SELECT  MINUTE(toDateTime('2022-06-23T11:16:17'))\n//16"
      },
      {
        name: 'toMinute',
        title: 'toMinute(datetime)',
        description: 'Converts a date with time to a number containing the number of the minute of the hour (0-59).',
        example: "SELECT  toMinute(toDateTime('2022-06-23T11:16:17'))\n//16"
      },
      {
        name: 'toSecond',
        title: 'toSecond(datetime)',
        description: 'Converts a date with time to a UInt8 number containing the number of the second in the minute (0-59).Leap seconds are not accounted for.',
        example: "SELECT  toSecond(toDateTime('2022-06-23T11:16:17'))\n//17"
      },
      {
        name: 'SECOND',
        title: 'SECOND(datetime)',
        description: 'Converts a date with time to a UInt8 number containing the number of the second in the minute (0-59).Leap seconds are not accounted for.',
        example: "SELECT  SECOND(toDateTime('2022-06-23T11:16:17'))\n//17"
      },
      {
        name: 'toUnixTimestamp',
        title: 'toUnixTimestamp(value, [timezone])',
        description: 'For DateTime argument: converts value(datetime or string with timezone) to the number with type UInt32 -- Unix Timestamp ',
        example: "SELECT toUnixTimestamp('2017-11-05 08:07:47', 'Asia/Tokyo'),toUnixTimestamp(toDateTime('2022-06-23T11:16:17')) \n//1509836867 1655982977"
      },
      {
        name: 'toStartOfYear',
        title: 'toStartOfYear(date_or_datetime)',
        description: 'Rounds down a date or date with time to the first day of the year.Returns the date.',
        example: "SELECT  toStartOfYear(toDateTime('2022-06-23T11:16:17'))\n//2022-01-01"
      },
      {
        name: 'toStartOfISOYear',
        title: 'toStartOfISOYear(date_or_datetime)',
        description: 'Rounds down a date or date with time to the first day of ISO year.Returns the date.',
        example: "SELECT  toStartOfISOYear(toDateTime('2022-06-23T11:16:17'))\n//2022-01-03"
      },
      {
        name: 'toStartOfQuarter',
        title: 'toStartOfQuarter(date_or_datetime)',
        description:
          'Rounds down a date or date with time to the first day of the quarter.The first day of the quarter is either 1 January, 1 April, 1 July, or 1 October.Returns the date.',
        example: "SELECT  toStartOfQuarter(toDateTime('2022-06-23T11:16:17'))\n//2022-04-01"
      },
      {
        name: 'toStartOfMonth',
        title: 'toStartOfMonth(date_or_datetime)',
        description: 'Rounds down a date or date with time to the first day of the month.Returns the date.',
        example: "SELECT  toStartOfMonth(toDateTime('2022-06-23T11:16:17'))\n//2022-06-01"
      },
      {
        name: 'toMonday',
        title: 'toMonday(date_or_datetime)',
        description: 'Rounds down a date or date with time to the nearest Monday.Returns the date.',
        example: "SELECT  toMonday(toDateTime('2022-06-23T11:16:17'))\n//2022-06-20"
      },
      {
        name: 'toStartOfWeek',
        title: 'toStartOfWeek(date_or_datetime[,mode)',
        description:
          'Rounds down a date or date with time to the nearest Sunday or Monday by mode.Returns the date.The mode argument works exactly like the mode argument to toWeek(). For the single-argument syntax, a mode value of 0 is used.',
        example: "SELECT  toStartOfWeek(toDateTime('2022-06-23T11:16:17'))\n//2022-06-19"
      },
      {
        name: 'toStartOfDay',
        title: 'toStartOfDay(datetime)',
        description: 'Rounds down a date with time to the start of the day.',
        example: "SELECT  toStartOfDay(toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T00:00"
      },
      {
        name: 'toStartOfHour',
        title: 'toStartOfHour(datetime)',
        description: 'Rounds down a date with time to the start of the hour.',
        example: "SELECT  toStartOfHour(toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T11:00"
      },
      {
        name: 'toStartOfMinute',
        title: 'toStartOfMinute(datetime)',
        description: 'Rounds down a date with time to the start of the minute.',
        example: "SELECT  toStartOfMinute(toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T11:16"
      },
      {
        name: 'toStartOfSecond',
        title: 'toStartOfSecond(value, [timezone])',
        description: 'Truncates sub-seconds.If timezone is not specified, the function uses the timezone of the value(DateTime64) parameter.',
        example: "SELECT toStartOfSecond(toDateTime64('2022-06-23T11:16:17', 3))\n//2022-06-23T11:16:17"
      },
      {
        name: 'toStartOfFiveMinute',
        title: 'toStartOfFiveMinutes(datetime)',
        description: 'Rounds down a date with time to the start of the five-minute interval.',
        example: "SELECT toStartOfFiveMinute(toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T11:15"
      },
      {
        name: 'toStartOfTenMinutes',
        title: 'toStartOfTenMinutes(datetime)',
        description: 'Rounds down a date with time to the start of the ten-minute interval.',
        example: "SELECT toStartOfTenMinutes(toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T11:10"
      },
      {
        name: 'toStartOfFifteenMinutes',
        title: 'toStartOfFifteenMinutes(datetime)',
        description: 'Rounds down the date with time to the start of the fifteen-minute interval.',
        example: "SELECT toStartOfFifteenMinutes(toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T11:15"
      },
      {
        name: 'toStartOfInterval',
        title: 'toStartOfInterval(time_or_data, INTERVAL x unit [, time_zone])',
        description:
          'This is a generalization of other functions named toStartOf*. For example,toStartOfInterval(t, INTERVAL 1 year) returns the same as toStartOfYear(t)',
        example: "select toStartOfInterval(toDateTime('2022-06-23T11:16:17'), INTERVAL 1 month)\n//2022-06-01"
      },
      {
        name: 'toTime',
        title: 'toTime(datetime)',
        description: 'Converts a date with time to a certain fixed date, while preserving the time.',
        example: "SELECT toTime(toDateTime('2022-06-23T11:16:17'))\n//1970-01-02T11:16:17"
      },
      {
        name: 'toRelativeYearNum',
        title: 'toRelativeYearNum(datetime)',
        description: 'Converts a date with time or date to the number of the year, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeYearNum(toDateTime('2022-06-23T11:16:17'))\n//2022"
      },
      {
        name: 'toRelativeQuarterNum',
        title: 'toRelativeQuarterNum(datetime)',
        description: 'Converts a date with time or date to the number of the quarter, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeQuarterNum(toDateTime('2022-06-23T11:16:17'))\n//8089"
      },
      {
        name: 'toRelativeMonthNum',
        title: 'toRelativeMonthNum(date_or_datetime)',
        description: 'Converts a date with time or date to the number of the month, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeMonthNum(toDateTime('2022-06-23T11:16:17'))\n//24270"
      },
      {
        name: 'toRelativeWeekNum',
        title: 'toRelativeWeekNum(date_or_datetime)',
        description: 'Converts a date with time or date to the number of the week, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeWeekNum(toDateTime('2022-06-23T11:16:17'))\n//2738"
      },
      {
        name: 'toRelativeDayNum',
        title: 'toRelativeDayNum(date_or_datetime)',
        description: 'Converts a date with time or date to the number of the day, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeDayNum(toDateTime('2022-06-23T11:16:17'))\n//19166"
      },
      {
        name: 'toRelativeHourNum',
        title: 'toRelativeHourNum(date_or_datetime)',
        description: 'Converts a date with time or date to the number of the hour, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeHourNum(toDateTime('2022-06-23T11:16:17'))\n//459995"
      },
      {
        name: 'toRelativeMinuteNum',
        title: 'toRelativeMinuteNum(date_or_datetime)',
        description: 'Converts a date with time or date to the number of the minute, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeMinuteNum(toDateTime('2022-06-23T11:16:17'))\n//27599716"
      },
      {
        name: 'toRelativeSecondNum',
        title: 'toRelativeSecondNum(date_or_datetime)',
        description: 'Converts a date with time or date to the number of the second, starting from a certain fixed point in the past.',
        example: "SELECT toRelativeSecondNum(toDateTime('2022-06-23T11:16:17'))\n//1655982977"
      },
      {
        name: 'toISOYear',
        title: 'toISOYear(date_or_date_time)',
        description: 'Converts a date or date with time to a number containing the ISO Year number.',
        example: "SELECT toISOYear(toDateTime('2022-06-23T11:16:17'))\n//2022"
      },
      {
        name: 'toISOWeek',
        title: 'toISOWeek(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the ISO Week number.',
        example: "SELECT toISOWeek(toDateTime('2022-06-23T11:16:17'))\n//25"
      },
      {
        name: 'toWeek',
        title: 'toWeek(date, [, mode][, Timezone])',
        description:
          'This function returns the week number for date or datetime. The following describes how the mode argument works: https://clickhouse.com/docs/en/sql-reference/functions/date-time-functions#toweekdatemode',
        example: "SELECT toWeek(toDateTime('2022-06-23T11:16:17'), 3)\n//25"
      },
      {
        name: 'toYearWeek',
        title: 'toYearWeek(date[,mode])',
        description:
          'Returns year and week for a date. The year in the result may be different from the year in the date argument for the first and the last week of the year.The mode argument works exactly like the mode argument to toWeek(). For the single-argument syntax, a mode value of 0 is used.',
        example: "SELECT toYearWeek(toDateTime('2022-06-23T11:16:17'), 3)\n//202225"
      },
      {
        name: 'date_trunc',
        title: 'date_trunc(unit, value[, timezone])',
        description: 'Truncates date and time data to the specified part of date. unit is second, minute, hour, day, week, month, quarter or year.',
        example: "SELECT date_trunc('hour', toDateTime('2022-06-23T11:16:17'))\n//2022-06-23T11:00"
      },
      {
        name: 'date_add',
        title: 'date_add(unit, value, date)',
        description: 'Adds the time interval or date interval to the provided date or date with time.',
        example: "SELECT date_add(YEAR, 3, toDate('2018-01-01'))\n//2021-01-01"
      },
      {
        name: 'date_diff',
        title: "date_diff('unit', startdate, enddate, [timezone])",
        description: 'Returns the difference between two dates or dates with time values.',
        example: "select dateDiff('hour', toDateTime('2018-01-01 22:00:00'), toDateTime('2018-01-02 23:00:00'))\n//25"
      },
      {
        name: 'date_sub',
        title: 'date_sub(unit, value, date)',
        description: 'Subtracts the time interval or date interval from the provided date or date with time.',
        example: "select date_sub(YEAR, 3, toDate('2018-01-01'))\n//2015-01-01"
      },
      {
        name: 'timestamp_add',
        title: 'timestamp_add(date, INTERVAL value unit)',
        description: 'Adds the specified time value with the provided date or date time value.',
        example: "select timestamp_add(toDate('2018-01-01'), INTERVAL 3 MONTH)\n//2018-04-01"
      },
      {
        name: 'timestamp_sub',
        title: 'timestamp_sub(unit, value, date)',
        description: 'Subtracts the time interval from the provided date or date with time.',
        example: "select timestamp_sub(MONTH, 5, toDateTime('2018-12-18 01:02:03'))\n//2018-07-18T01:02:03"
      },
      {
        name: 'now',
        title: 'now([timezone])',
        description: 'Returns the current date and time.',
        example: 'select now()\n//2020-10-17 07:42:09'
      },
      {
        name: 'today',
        title: 'today',
        description: 'Accepts zero arguments and returns the current date at one of the moments of request execution.The same as ‘toDate(now())’.',
        example: 'select today()\n//2022-06-24'
      },
      {
        name: 'yesterday',
        title: 'yesterday',
        description: 'Accepts zero arguments and returns yesterday’s date at one of the moments of request execution.The same as ‘today() - 1’.',
        example: 'select yesterday()\n//2022-06-23'
      },
      {
        name: 'timeSlot',
        title: 'timeSlot(time_or_datetime)',
        description: 'Rounds the time to the half hour.',
        example: "SELECT timeSlot(toDateTime('2022-06-23T11:16:17'))()\n//2022-06-23T11:00"
      },
      {
        name: 'toYYYYMM',
        title: 'toYYYYMM(date_or_datetime)',
        description: 'Converts a date or date with time to a number containing the year and month number (YYYY * 100 + MM).',
        example: "SELECT toYYYYMM(toDateTime('2022-06-23T11:16:17'))\n//202206"
      },
      {
        name: 'toYYYYMMDD',
        title: 'toYYYYMMDD(date_or_datetime)',
        description: 'Converts a date or date with time to a UInt32 number containing the year and month number (YYYY * 10000 + MM * 100 + DD).',
        example: "SELECT toYYYYMMDD(toDateTime('2022-06-23T11:16:17'))\n//20220623"
      },
      {
        name: 'toYYYYMMDDhhmmss',
        title: 'toYYYYMMDDhhmmss(date_or_datetime)',
        description:
          'Converts a date or date with time to a UInt64 number containing the year and month number (YYYY * 10000000000 + MM * 100000000 + DD * 1000000 + hh * 10000 + mm * 100 + ss).',
        example: "SELECT toYYYYMMDDhhmmss(toDateTime('2022-06-23T11:16:17'))\n//20220623111617"
      },
      {
        name: 'addYears',
        title: 'addYears(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addYears(toDate('2018-01-01'), 2)\n//2020-01-01"
      },
      {
        name: 'addMonths',
        title: 'addMonths(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addMonths(toDate('2018-01-01'), 2)\n//2018-03-01"
      },
      {
        name: 'addWeeks',
        title: 'addWeeks(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addWeeks(toDate('2018-01-01'), 2)\n//2018-01-15"
      },
      {
        name: 'addDays',
        title: 'addDays(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addDays(toDate('2018-01-01'), 2)\n//2018-01-03"
      },
      {
        name: 'addHours',
        title: 'addHours(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addHours(toDate('2018-01-01'), 2)\n//2018-01-01T02:00"
      },
      {
        name: 'addMinutes',
        title: 'addMinutes(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addMinutes(toDate('2018-01-01'), 2)\n//2018-01-01T00:02"
      },
      {
        name: 'addSeconds',
        title: 'addSeconds(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addSeconds(toDate('2018-01-01'), 2)\n//2018-01-01T00:00:02"
      },
      {
        name: 'addQuarters',
        title: 'addQuarters(date_or_datetime, int)',
        description: 'Function adds a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime. ',
        example: "SELECT addQuarters(toDate('2018-01-01'), 2)\n//2018-07-01"
      },
      {
        name: 'subtractYears',
        title: 'subtractYears(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractYears(toDate('2018-01-01'), 2)\n//2016-01-01"
      },
      {
        name: 'subtractMonths',
        title: 'subtractMonths(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractMonths(toDate('2018-01-01'), 2)\n//2017-11-01"
      },
      {
        name: 'subtractWeeks',
        title: 'subtractWeeks(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractWeeks(toDate('2018-01-01'), 2)\n//2017-12-18"
      },
      {
        name: 'subtractDays',
        title: 'subtractDays(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractDays(toDate('2018-01-01'), 2)\n//2017-12-30"
      },
      {
        name: 'subtractHours',
        title: 'subtractHours(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractHours(toDate('2018-01-01'), 2)\n//2017-12-31T22:00"
      },
      {
        name: 'subtractMinutes',
        title: 'subtractMinutes(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractMinutes(toDate('2018-01-01'), 2)\n//2017-12-31T23:58"
      },
      {
        name: 'subtractSeconds',
        title: 'subtractSeconds(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractSeconds(toDate('2018-01-01'), 2)\n//2017-12-31T23:59:58"
      },
      {
        name: 'subtractQuarters',
        title: 'subtractQuarters(date_or_datetime, int)',
        description: 'Function subtract a Date/DateTime interval to a Date/DateTime and then return the Date/DateTime.',
        example: "SELECT subtractQuarters(toDate('2018-01-01'), 2)\n//2017-07-01"
      },
      {
        name: 'formatDateTime',
        title: 'formatDateTime(Time, Format\\[, Timezone\\])',
        description:
          'Returns time and date values according to the determined format. To know more about Format, check the link: https://clickhouse.com/docs/en/sql-reference/functions/date-time-functions#formatdatetime',
        example: "SELECT formatDateTime(toDate('2010-01-04'), '%D')\n//01/04/10"
      },
      {
        name: 'dateName',
        title: 'dateName(date_part, date)',
        description:
          "Returns specified part of date. date_part possible values: 'year', 'quarter', 'month', 'week', 'dayofyear', 'day', 'weekday', 'hour', 'minute', 'second'.",
        example: "SELECT dateName('year',toDateTime('2021-04-14 11:22:33'))\n//2021"
      },
      {
        name: 'FROM_UNIXTIME',
        title: 'FROM_UNIXTIME(timestamp)',
        description:
          'Function converts Unix timestamp to a calendar date and a time of a day. When there is only a single argument of Integer type, it acts in the same way as toDateTime and return DateTime type.',
        example: 'SELECT FROM_UNIXTIME(423543535)\n//1983-06-04 10:58:55'
      },
      {
        name: 'toModifiedJulianDay',
        title: 'toModifiedJulianDay(date)',
        description:
          'Converts a Proleptic Gregorian calendar date in text form YYYY-MM-DD to a Modified Julian Day number in Int32. This function supports date from 0000-01-01 to 9999-12-31. It raises an exception if the argument cannot be parsed as a date, or the date is invalid.',
        example: "SELECT toModifiedJulianDay('2020-01-01')\n//58849"
      },
      {
        name: 'toModifiedJulianDayOrNull',
        title: 'toModifiedJulianDayOrNull(string_or_fixed_string)',
        description: 'Similar to toModifiedJulianDay(), but instead of raising exceptions it returns NULL.',
        example: "SELECT toModifiedJulianDayOrNull('2020-01-01')\n//58849"
      },
      {
        name: 'fromModifiedJulianDay',
        title: 'fromModifiedJulianDay(string_or_fixed_string)',
        description:
          'Converts a Modified Julian Day number to a Proleptic Gregorian calendar date in text form YYYY-MM-DD. This function supports day number from -678941 to 2973119 (which represent 0000-01-01 and 9999-12-31 respectively). It raises an exception if the day number is outside of the supported range.',
        example: 'SELECT fromModifiedJulianDay(58849)\n//2020-01-01'
      },
      {
        name: 'fromModifiedJulianDayOrNull',
        title: 'fromModifiedJulianDay(string_or_fixed_string)',
        description: 'Similar to fromModifiedJulianDayOrNull(), but instead of raising exceptions it returns NULL.',
        example: 'SELECT fromModifiedJulianDayOrNull(58849)\n//2020-01-01'
      }
    ],
    Encoding: [
      {
        name: 'char',
        title: 'char(number_1, [number_2, ..., number_n]);',
        description:
          'Returns the string with the length as the number of passed arguments and each byte has the value of corresponding argument. Accepts multiple arguments of numeric types. If the value of argument is out of range of UInt8 data type, it is converted to UInt8 with possible rounding and overflow.',
        example: 'char(104.1, 101, 108.9, 108.9, 111) AS hello = hello;'
      },
      {
        name: 'hex',
        title: 'hex(arg)',
        description: 'Returns a string containing the argument’s hexadecimal representation.',
        example: 'SELECT hex(1);'
      },
      {
        name: 'unhex',
        title: 'unhex(arg)',
        description:
          'Performs the opposite operation of hex. It interprets each pair of hexadecimal digits (in the argument) as a number and converts it to the byte represented by the number. The return value is a binary string (BLOB).',
        example: "SELECT unhex('303132');"
      },
      {
        name: 'UUIDStringToNum',
        title: 'UUIDStringToNum(String)',
        description:
          'Accepts a string containing 36 characters in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx , and returns it as a set of bytes in a FixedString(16).',
        example: "SELECT\n    '612f3c40-5d3b-217e-707b-6a546a3d7b29' AS uuid,\n    UUIDStringToNum(uuid) AS bytes;"
      },
      {
        name: 'UUIDNumToString',
        title: 'UUIDNumToString(FixedString(16))',
        description: 'Accepts a FixedString(16) value, and returns a string containing 36 characters in text format.',
        example: "SELECT\n    'a/<@];!~p{jTj={)' AS bytes,\n    UUIDNumToString(toFixedString(bytes, 16)) AS uuid;"
      },
      {
        name: 'bitmaskToList',
        title: 'bitmaskToList(num)',
        description:
          'Accepts an integer. Returns a string containing the list of powers of two that total the source number when summed. They are comma-separated without spaces in text format, in ascending order.',
        example: 'SELECT bitmaskToList(1);'
      },
      {
        name: 'bitmaskToArray',
        title: 'bitmaskToArray(num)',
        description:
          'Accepts an integer. Returns an array of UInt64 numbers containing the list of powers of two that total the source number when summed. Numbers in the array are in ascending order.',
        example: 'SELECT bitmaskToArray(1);'
      }
    ],
    Encryption: [
      {
        name: 'encrypt',
        title: "encrypt('mode', 'plaintext', 'key' [, iv, aad])",
        description: 'Encrypts data.',
        example: "INSERT INTO encryption_test VALUES('aes-256-ofb no IV', encrypt('aes-256-ofb', 'Secret', '12345678910121314151617181920212'));"
      },
      {
        name: 'aes_encrypt_mysql',
        title: "aes_encrypt_mysql('mode', 'plaintext', 'key' [, iv])",
        description:
          "Compatible with mysql encryption and resulting ciphertext can be decrypted with AES_DECRYPT function.\nWill produce the same ciphertext as encrypt on equal inputs. But when key or iv are longer than they should normally be, aes_encrypt_mysql will stick to what MySQL's aes_encrypt does: 'fold' key and ignore excess bits of iv.",
        example:
          "SELECT encrypt('aes-256-ofb', 'Secret', '12345678910121314151617181920212', 'iviviviviviviviv') = aes_encrypt_mysql('aes-256-ofb', 'Secret', '12345678910121314151617181920212', 'iviviviviviviviv') AS ciphertexts_equal;"
      },
      {
        name: 'decrypt',
        title: "decrypt('mode', 'ciphertext', 'key' [, iv, aad])",
        description: 'Decrypts ciphertext into a plaintext',
        example: "SELECT comment, decrypt('aes-256-cfb128', secret, '12345678910121314151617181920212') as plaintext FROM encryption_test"
      },
      {
        name: 'aes_decrypt_mysql',
        title: "aes_decrypt_mysql('mode', 'ciphertext', 'key' [, iv])",
        description:
          "Compatible with mysql encryption and decrypts data encrypted with AES_ENCRYPT function.\nWill produce same plaintext as decrypt on equal inputs. But when key or iv are longer than they should normally be, aes_decrypt_mysql will stick to what MySQL's aes_decrypt does: 'fold' key and ignore excess bits of IV.",
        example: "SELECT aes_decrypt_mysql('aes-256-ofb', unhex('24E9E4966469'), '123456789101213141516171819202122', 'iviviviviviviviv123456') AS plaintext"
      }
    ],
    'External dictionaries': [
      {
        name: 'dictGet',
        title: "dictGet('dict_name', attr_names, id_expr)",
        description: 'Retrieves values from a dictionary.',
        example: "SELECT\n    dictGet('ext-dict-mult', ('c1','c2'), number + 1) AS val,\n    toTypeName(val) AS type\nFROM system.numbers\nLIMIT 3;"
      },
      {
        name: 'dictHas',
        title: "dictHas('dict_name', id_expr)",
        description: 'Checks whether a key is present in a dictionary.'
      },
      {
        name: 'dictGetHierarchy',
        title: "dictGetHierarchy('dict_name', key)",
        description: 'Creates an array, containing all the parents of a key in the hierarchical dictionary.'
      },
      {
        name: 'dictIsIn',
        title: "dictIsIn('dict_name', child_id_expr, ancestor_id_expr)",
        description: 'Checks the ancestor of a key through the whole hierarchical chain in the dictionary.'
      },
      {
        name: 'dictGetInt8',
        title: "dictGetInt8('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Int8 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetInt16',
        title: "dictGetInt16('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Int16 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetInt32',
        title: "dictGetInt32('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Int32 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetInt64',
        title: "dictGetInt64('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Int64 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetUInt8',
        title: "dictGetUInt8('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to UInt8 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetUInt16',
        title: "dictGetUInt16('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to UInt16 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetUInt32',
        title: "dictGetUInt32('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to UInt32 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetUInt64',
        title: "dictGetUInt64('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to UInt64 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetFloat32',
        title: "dictGetFloat32('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Float32 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetFloat64',
        title: "dictGetFloat64('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Float64 data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetDate',
        title: "dictGetDate('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Date data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetDateTime',
        title: "dictGetDateTime('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to Date and Time data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetUUID',
        title: "dictGetUUID('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to UUID data type regardless of the dictionary configuration.'
      },
      {
        name: 'dictGetString',
        title: "dictGetString('dict_name', 'attr_name', id_expr)",
        description: 'Converts dictionary attribute values to string regardless of the dictionary configuration.'
      }
    ],
    Files: [
      {
        name: 'file',
        title: 'file(path[, default])',
        description: 'Reads file as a String. The file content is not parsed, so any information is read as one string and placed into the specified column.',
        example: "INSERT INTO table SELECT file('a.txt'), file('b.txt');"
      }
    ],
    GeoHash: [
      {
        name: 'geohashEncode',
        title: 'geohashEncode(longitude, latitude, [precision])',
        description: 'Encodes latitude and longitude as a geohash-string.',
        example: 'SELECT geohashEncode(-5.60302734375, 42.593994140625, 0) AS res;'
      },
      {
        name: 'geohashDecode',
        title: 'geohashDecode(string)',
        description: 'Decodes any geohash-encoded string into longitude and latitude.',
        example: "SELECT geohashDecode('ezs42') AS res;"
      },
      {
        name: 'geohashesInBox',
        title: 'geohashesInBox(longitude_min, latitude_min, longitude_max, latitude_max, precision)',
        description:
          'Returns an array of geohash-encoded strings of given precision that fall inside and intersect boundaries of given box, basically a 2D grid flattened into array.',
        example: 'SELECT geohashesInBox(24.48, 40.56, 24.785, 40.81, 4) AS thasos;'
      }
    ],
    'Geographical coordinates': [
      {
        name: 'greatCircleDistance',
        title: 'greatCircleDistance(lon1Deg, lat1Deg, lon2Deg, lat2Deg)',
        description: 'Calculates the distance between two points on the Earth’s surface using the great-circle formula.',
        example: 'SELECT greatCircleDistance(55.755831, 37.617673, -55.755831, -37.617673)'
      },
      {
        name: 'greatCircleAngle',
        title: 'greatCircleAngle(lon1Deg, lat1Deg, lon2Deg, lat2Deg)',
        description: 'Calculates the central angle between two points on the Earth’s surface using the great-circle formula.',
        example: 'SELECT greatCircleAngle(0, 0, 45, 0) AS arc'
      },
      {
        name: 'pointInEllipses',
        title: 'pointInEllipses(x, y, x₀, y₀, a₀, b₀,...,xₙ, yₙ, aₙ, bₙ)',
        description: 'Checks whether the point belongs to at least one of the ellipses. Coordinates are geometric in the Cartesian coordinate system.',
        example: 'SELECT pointInEllipses(10., 10., 10., 9.1, 1., 0.9999)'
      },
      {
        name: 'pointInPolygon',
        title: 'pointInPolygon((x, y), [(a, b), (c, d) ...], ...)',
        description: 'Checks whether the point belongs to the polygon on the plane.',
        example: 'SELECT pointInPolygon((3., 3.), [(6, 0), (8, 4), (5, 8), (0, 2)]) AS res'
      }
    ],
    'H3 indexes': [
      {
        name: 'h3IsValid',
        title: 'h3IsValid(h3index)',
        description: 'Verifies whether the number is a valid H3 index.',
        example: 'SELECT h3IsValid(630814730351855103) AS h3IsValid;'
      },
      {
        name: 'h3GetResolution',
        title: 'h3GetResolution(h3index)',
        description: 'Defines the resolution of the given H3 index.',
        example: 'SELECT h3GetResolution(639821929606596015) AS resolution;'
      },
      {
        name: 'h3EdgeAngle',
        title: 'h3EdgeAngle(resolution)',
        description: 'Calculates the average length of the H3 hexagon edge in grades.',
        example: 'SELECT h3EdgeAngle(10) AS edgeAngle;'
      },
      {
        name: 'h3EdgeLengthM',
        title: 'h3EdgeLengthM(resolution)',
        description: 'Calculates the average length of the H3 hexagon edge in meters.',
        example: 'SELECT h3EdgeLengthM(15) AS edgeLengthM;'
      },
      {
        name: 'geoToH3',
        title: 'geoToH3(lon, lat, resolution)',
        description: 'Returns H3 point index (lon, lat) with specified resolution.',
        example: 'SELECT geoToH3(37.79506683, 55.71290588, 15) AS h3Index;'
      },
      {
        name: 'h3kRing',
        title: 'h3kRing(h3index, k)',
        description: 'Lists all the H3 hexagons in the raduis of k from the given hexagon in random order.',
        example: 'SELECT arrayJoin(h3kRing(644325529233966508, 1)) AS h3index;'
      },
      {
        name: 'h3GetBaseCell',
        title: 'h3GetBaseCell(index)',
        description: 'Returns the base cell number of the H3 index.',
        example: 'SELECT h3GetBaseCell(612916788725809151) AS basecell;'
      },
      {
        name: 'h3HexAreaM2',
        title: 'h3HexAreaM2(resolution)',
        description: 'Returns average hexagon area in square meters at the given resolution.',
        example: 'SELECT h3HexAreaM2(13) AS area;'
      },
      {
        name: 'h3IndexesAreNeighbors',
        title: 'h3IndexesAreNeighbors(index1, index2)',
        description: 'Returns whether or not the provided H3 indexes are neighbors.',
        example: 'SELECT h3IndexesAreNeighbors(617420388351344639, 617420388352655359) AS n;'
      },
      {
        name: 'h3ToChildren',
        title: 'h3ToChildren(index, resolution)',
        description: 'Returns an array of child indexes for the given H3 index.',
        example: 'SELECT h3ToChildren(599405990164561919, 6) AS children;'
      },
      {
        name: 'h3ToParent',
        title: 'h3ToParent(index, resolution)',
        description: 'Returns the parent (coarser) index containing the given H3 index.',
        example: 'SELECT h3ToParent(599405990164561919, 3) AS parent;'
      },
      {
        name: 'h3ToString',
        title: 'h3ToString(index)',
        description: 'Converts the H3Index representation of the index to the string representation.',
        example: 'SELECT h3ToString(617420388352917503) AS h3_string;'
      },
      {
        name: 'stringToH3',
        title: 'stringToH3(index_str)',
        description: 'Converts the string representation to the H3Index (UInt64) representation.',
        example: "SELECT stringToH3('89184926cc3ffff') AS index;"
      }
    ],
    Hash: [
      {
        name: 'halfMD5',
        title: 'halfMD5(par1, ...)',
        description:
          'Interprets all the input parameters as strings and calculates the MD5 hash value for each of them. Then combines hashes, takes the first 8 bytes of the hash of the resulting string, and interprets them as UInt64 in big-endian byte order.',
        example: "SELECT halfMD5(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS halfMD5hash, toTypeName(halfMD5hash) AS type;"
      },
      {
        name: 'MD5',
        title: 'select MD5(string)',
        description:
          'Calculates the MD5 from a string and returns the resulting set of bytes as FixedString(16). If you do not need MD5 in particular, but you need a decent cryptographic 128-bit hash, use the ‘sipHash128’ function instead. If you want to get the same result as output by the md5sum utility, use lower(hex(MD5(s))).',
        example: "select MD5('test the MD5 function')"
      },
      {
        name: 'sipHash64',
        title: 'sipHash64(par1,...)',
        description: 'Produces a 64-bit SipHash hash value.',
        example: "SELECT sipHash64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS SipHash, toTypeName(SipHash) AS type;"
      },
      {
        name: 'sipHash128',
        title: 'sipHash128(par1,...)',
        description: 'Produces a 128-bit SipHash hash value. Differs from sipHash64 in that the final xor-folding state is done up to 128 bits.',
        example: "SELECT hex(sipHash128('foo', '\\x01', 3));"
      },
      {
        name: 'cityHash64',
        title: 'cityHash64(par1,...)',
        description: 'Produces a 64-bit CityHash hash value.',
        example: "SELECT cityHash64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS CityHash, toTypeName(CityHash) AS type;"
      },
      {
        name: 'intHash32',
        title: 'intHash32(integer)',
        description:
          'Calculates a 32-bit hash code from any type of integer. This is a relatively fast non-cryptographic hash function of average quality for numbers.',
        example: 'SELECT intHash32(12072650598913549138);'
      },
      {
        name: 'intHash64',
        title: 'intHash64(integer)',
        description: 'Calculates a 64-bit hash code from any type of integer. It works faster than intHash32. Average quality.',
        example: 'SELECT intHash64(12072650598913549138);'
      },
      {
        name: 'SHA1',
        title: 'SHA1(string)',
        description: 'Calculates SHA-1, SHA-224, SHA-256, SHA-512 hash from a string and returns the resulting set of bytes as FixedString.',
        example: "SELECT hex(SHA1('abc'));"
      },
      {
        name: 'SHA224',
        title: 'SHA224(string)',
        description: 'Calculates SHA-1, SHA-224, SHA-256, SHA-512 hash from a string and returns the resulting set of bytes as FixedString.',
        example: "SELECT hex(SHA224('abc'));"
      },
      {
        name: 'SHA256',
        title: 'SHA256(string)',
        description: 'Calculates SHA-1, SHA-224, SHA-256, SHA-512 hash from a string and returns the resulting set of bytes as FixedString.',
        example: "SELECT hex(SHA256('abc'));"
      },
      {
        name: 'URLHash',
        title: 'URLHash(url[, N])',
        description:
          'A fast, decent-quality non-cryptographic hash function for a string obtained from a URL using some type of normalization. URLHash(s) – Calculates a hash from a string without one of the trailing symbols /,? or # at the end, if present. URLHash(s, N) – Calculates a hash from a string up to the N level in the URL hierarchy, without one of the trailing symbols /,? or # at the end, if present. Levels are the same as in URLHierarchy',
        example: "SELECT URLHash('https://www.bytedance.com/en/news',2)"
      },
      {
        name: 'farmFingerprint64',
        title: 'farmFingerprint64(par1, ...)',
        description: 'Produces a 64-bit Fingerprint value. farmFingerprint64 is preferred for a stable and portable value.',
        example:
          "SELECT farmFingerprint64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS farmFingerprint64, toTypeName(FfarmFingerprint64) AS type;"
      },
      {
        name: 'farmHash64',
        title: 'farmHash64(par1, ...)',
        description: 'Produces a 64-bit FarmHash value.',
        example: "SELECT farmHash64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS FarmHash, toTypeName(FarmHash) AS type;"
      },
      {
        name: 'javaHash',
        title: 'javaHash(string)',
        description:
          'Calculates JavaHash from a string, Byte, Short, Integer, Long. This hash function is neither fast nor having a good quality. The only reason to use it is when this algorithm is already used in another system and you have to calculate exactly the same result.',
        example: 'SELECT javaHash(toInt32(123));'
      },
      {
        name: 'javaHashUTF16LE',
        title: 'javaHashUTF16LE(stringUtf16le)',
        description: 'Calculates JavaHash from a string, assuming it contains bytes representing a string in UTF-16LE encoding.',
        example: "SELECT javaHashUTF16LE(convertCharset('test', 'utf-8', 'utf-16le'));"
      },
      {
        name: 'hiveHash',
        title: 'hiveHash(string)',
        description: 'Calculates HiveHash from a string.',
        example: "hiveHash('Hello, world!') = 267439093;"
      },
      {
        name: 'metroHash64',
        title: 'metroHash64(par1, ...)',
        description: 'Produces a 64-bit MetroHash hash value.',
        example: "SELECT metroHash64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS MetroHash, toTypeName(MetroHash) AS type;"
      },
      {
        name: 'jumpConsistentHash',
        title: 'JumpConsistentHash(key, buckets)',
        description:
          'Calculates JumpConsistentHash form a UInt64. Accepts two arguments: a UInt64-type key and the number of buckets. Returns Int32. For more information, see the link: JumpConsistentHash',
        example: 'SELECT jumpConsistentHash(18446744073709551615, 12);'
      },
      {
        name: 'murmurHash2_32',
        title: 'murmurHash2_32(par1, ...)',
        description: 'Produces a MurmurHash2 hash value.',
        example: "murmurHash2_32('test') = 403862830;"
      },
      {
        name: 'murmurHash2_64',
        title: 'murmurHash2_64(par1, ...)',
        description: 'Produces a MurmurHash2 hash value.',
        example: "SELECT murmurHash2_64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS MurmurHash2, toTypeName(MurmurHash2) AS type;"
      },
      {
        name: 'gccMurmurHash',
        title: 'gccMurmurHash(par1, ...)',
        description: 'Calculates a 64-bit MurmurHash2 hash value using the same hash seed as gcc. It is portable between CLang and GCC builds.',
        example: "SELECT gccMurmurHash(1, 2, 3) AS res1,gccMurmurHash(('a', [1, 2, 3], 4, (4, ['foo', 'bar'], 1, (1, 2)))) AS res2;"
      },
      {
        name: 'murmurHash3_32',
        title: 'murmurHash3_32(par1, ...)',
        description: 'Produces a MurmurHash3 hash value.',
        example: "SELECT murmurHash3_32(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS MurmurHash3, toTypeName(MurmurHash3) AS type;"
      },
      {
        name: 'murmurHash3_64',
        title: 'murmurHash3_64(par1, ...)',
        description: 'Produces a MurmurHash3 hash value.',
        example: "SELECT murmurHash3_64(array('e','x','a'), 'mple', 10, toDateTime('2019-06-15 23:00:00')) AS MurmurHash3, toTypeName(MurmurHash3) AS type;"
      },
      {
        name: 'murmurHash3_128',
        title: 'murmurHash3_128(expr)',
        description: 'Produces a 128-bit MurmurHash3 hash value.',
        example: "SELECT hex(murmurHash3_128('foo', 'foo', 'foo'));"
      },
      {
        name: 'xxHash32',
        title: 'SELECT xxHash32(s)',
        description: 'Calculates xxHash from a string.\nxxHash is an extremely fast non-cryptographic hash algorithm, working at RAM speed limit.',
        example: "SELECT xxHash32('Hello, world!');"
      },
      {
        name: 'xxHash64',
        title: 'SELECT xxHash64(s)',
        description: 'Calculates xxHash from a string.\nxxHash is an extremely fast non-cryptographic hash algorithm, working at RAM speed limit.',
        example: "SELECT xxHash64('Hello, world!')"
      },
      {
        name: 'ngramSimHash',
        title: 'ngramSimHash(string[, ngramsize])',
        description: 'Splits a ASCII string into n-grams of ngramsize symbols and returns the n-gram simhash. Is case sensitive. ',
        example: "SELECT ngramSimHash('ClickHouse') AS Hash;"
      },
      {
        name: 'ngramSimHashCaseInsensitive',
        title: 'ngramSimHashCaseInsensitive(string[, ngramsize])',
        description: 'Splits a ASCII string into n-grams of ngramsize symbols and returns the n-gram simhash. Is case insensitive. ',
        example: "SELECT ngramSimHashCaseInsensitive('ClickHouse') AS Hash;"
      },
      {
        name: 'ngramSimHashUTF8',
        title: 'ngramSimHashUTF8(string[, ngramsize])',
        description: 'Splits a UTF-8 string into n-grams of ngramsize symbols and returns the n-gram simhash. Is case sensitive.',
        example: "SELECT ngramSimHashUTF8('ClickHouse') AS Hash;"
      },
      {
        name: 'ngramSimHashCaseInsensitiveUTF8',
        title: 'ngramSimHashCaseInsensitiveUTF8(string[, ngramsize])',
        description: 'Splits a UTF-8 string into n-grams of ngramsize symbols and returns the n-gram simhash. Is case insensitive.',
        example: "SELECT ngramSimHashCaseInsensitiveUTF8('ClickHouse') AS Hash;"
      },
      {
        name: 'wordShingleSimHash',
        title: 'wordShingleSimHash(string[, shinglesize])',
        description: 'Splits a ASCII string into parts (shingles) of shinglesize words and returns the word shingle simhash. Is case sensitive.',
        example:
          "SELECT wordShingleSimHash('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Hash;"
      },
      {
        name: 'wordShingleSimHashCaseInsensitive',
        title: 'wordShingleSimHashCaseInsensitive(string[, shinglesize])',
        description: 'Splits a ASCII string into parts (shingles) of shinglesize words and returns the word shingle simhash. Is case insensitive.',
        example:
          "SELECT wordShingleSimHashCaseInsensitive('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Hash;"
      },
      {
        name: 'wordShingleSimHashUTF8',
        title: 'wordShingleSimHashUTF8(string[, shinglesize])',
        description: 'Splits a UTF-8 string into parts (shingles) of shinglesize words and returns the word shingle simhash. Is case sensitive.',
        example:
          "SELECT wordShingleSimHashUTF8('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Hash;"
      },
      {
        name: 'wordShingleSimHashCaseInsensitiveUTF8',
        title: 'wordShingleSimHashCaseInsensitiveUTF8(string[, shinglesize])',
        description: 'Splits a UTF-8 string into parts (shingles) of shinglesize words and returns the word shingle simhash. Is case insensitive.',
        example:
          "SELECT wordShingleSimHashCaseInsensitiveUTF8('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Hash;"
      },
      {
        name: 'ngramMinHashUTF8',
        title: 'ngramMinHash(string[, ngramsize, hashnum])',
        description:
          'Splits a ASCII string into n-grams of ngramsize symbols and calculates hash values for each n-gram. Uses hashnum minimum hashes to calculate the minimum hash and hashnum maximum hashes to calculate the maximum hash. Returns a tuple with these hashes. Is case sensitive.',
        example: "SELECT ngramMinHash('ClickHouse') AS Tuple;"
      },
      {
        name: 'ngramMinHashCaseInsensitiveUTF8',
        title: 'ngramMinHashCaseInsensitive(string[, ngramsize, hashnum])',
        description:
          'Splits a ASCII string into n-grams of ngramsize symbols and calculates hash values for each n-gram. Uses hashnum minimum hashes to calculate the minimum hash and hashnum maximum hashes to calculate the maximum hash. Returns a tuple with these hashes. Is case insensitive.',
        example: "SELECT ngramMinHashCaseInsensitive('ClickHouse') AS Tuple;"
      },
      {
        name: 'ngramMinHashArg',
        title: 'ngramMinHashArg(string[, ngramsize, hashnum])',
        description:
          'Splits a ASCII string into n-grams of ngramsize symbols and returns the n-grams with minimum and maximum hashes, calculated by the ngramMinHash function with the same input. Is case sensitive.',
        example: "SELECT ngramMinHashArg('ClickHouse') AS Tuple;"
      },
      {
        name: 'ngramMinHashArgCaseInsensitive',
        title: 'ngramMinHashArgCaseInsensitive(string[, ngramsize, hashnum])',
        description:
          'Splits a ASCII string into n-grams of ngramsize symbols and returns the n-grams with minimum and maximum hashes, calculated by the ngramMinHashCaseInsensitive function with the same input. Is case insensitive.',
        example: "SELECT ngramMinHashArgCaseInsensitive('ClickHouse') AS Tuple;"
      },
      {
        name: 'ngramMinHashArgUTF8',
        title: 'ngramMinHashArgUTF8(string[, ngramsize, hashnum])',
        description:
          'Splits a UTF-8 string into n-grams of ngramsize symbols and returns the n-grams with minimum and maximum hashes, calculated by the ngramMinHashUTF8 function with the same input. Is case sensitive.',
        example: "SELECT ngramMinHashArgUTF8('ClickHouse') AS Tuple;"
      },
      {
        name: 'ngramMinHashArgCaseInsensitiveUTF8',
        title: 'ngramMinHashArgCaseInsensitiveUTF8(string[, ngramsize, hashnum])',
        description:
          'Splits a UTF-8 string into n-grams of ngramsize symbols and returns the n-grams with minimum and maximum hashes, calculated by the ngramMinHashCaseInsensitiveUTF8 function with the same input. Is case insensitive.',
        example: "SELECT ngramMinHashArgCaseInsensitiveUTF8('ClickHouse') AS Tuple;"
      },
      {
        name: 'wordShingleMinHash',
        title: 'wordShingleMinHash(string[, shinglesize, hashnum])',
        description:
          'Splits a ASCII string into parts (shingles) of shinglesize words and calculates hash values for each word shingle. Uses hashnum minimum hashes to calculate the minimum hash and hashnum maximum hashes to calculate the maximum hash. Returns a tuple with these hashes. Is case sensitive.',
        example:
          "SELECT wordShingleMinHash('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Tuple;"
      },
      {
        name: 'wordShingleMinHashCaseInsensitive',
        title: 'wordShingleMinHashCaseInsensitive(string[, shinglesize, hashnum])',
        description:
          'Splits a ASCII string into parts (shingles) of shinglesize words and calculates hash values for each word shingle. Uses hashnum minimum hashes to calculate the minimum hash and hashnum maximum hashes to calculate the maximum hash. Returns a tuple with these hashes. Is case insensitive.',
        example:
          "SELECT wordShingleMinHashCaseInsensitive('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Tuple;"
      },
      {
        name: 'wordShingleMinHashUTF8',
        title: 'wordShingleMinHashUTF8(string[, shinglesize, hashnum])',
        description:
          'Splits a UTF-8 string into parts (shingles) of shinglesize words and calculates hash values for each word shingle. Uses hashnum minimum hashes to calculate the minimum hash and hashnum maximum hashes to calculate the maximum hash. Returns a tuple with these hashes. Is case sensitive.',
        example:
          "SELECT wordShingleMinHashUTF8('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Tuple;"
      },
      {
        name: 'wordShingleMinHashCaseInsensitiveUTF8',
        title: 'wordShingleMinHashCaseInsensitiveUTF8(string[, shinglesize, hashnum])',
        description:
          'Splits a UTF-8 string into parts (shingles) of shinglesize words and calculates hash values for each word shingle. Uses hashnum minimum hashes to calculate the minimum hash and hashnum maximum hashes to calculate the maximum hash. Returns a tuple with these hashes. Is case insensitive.',
        example:
          "SELECT wordShingleMinHashCaseInsensitiveUTF8('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).') AS Tuple;"
      },
      {
        name: 'wordShingleMinHashArg',
        title: 'wordShingleMinHashArg(string[, shinglesize, hashnum])',
        description:
          'Splits a ASCII string into parts (shingles) of shinglesize words each and returns the shingles with minimum and maximum word hashes, calculated by the wordshingleMinHash function with the same input. Is case sensitive.',
        example:
          "SELECT wordShingleMinHashArg('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).', 1, 3) AS Tuple;"
      },
      {
        name: 'wordShingleMinHashArgCaseInsensitive',
        title: 'wordShingleMinHashArgCaseInsensitive(string[, shinglesize, hashnum])',
        description:
          'Splits a ASCII string into parts (shingles) of shinglesize words each and returns the shingles with minimum and maximum word hashes, calculated by the wordShingleMinHashCaseInsensitive function with the same input. Is case insensitive.',
        example:
          "SELECT wordShingleMinHashArgCaseInsensitive('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).', 1, 3) AS Tuple;"
      },
      {
        name: 'wordShingleMinHashArgUTF8',
        title: 'wordShingleMinHashArgUTF8(string[, shinglesize, hashnum])',
        description:
          'Splits a UTF-8 string into parts (shingles) of shinglesize words each and returns the shingles with minimum and maximum word hashes, calculated by the wordShingleMinHashUTF8 function with the same input. Is case sensitive.',
        example:
          "SELECT wordShingleMinHashArgUTF8('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).', 1, 3) AS Tuple;"
      },
      {
        name: 'wordShingleMinHashArgCaseInsensitiveUTF8',
        title: 'wordShingleMinHashArgCaseInsensitiveUTF8(string[, shinglesize, hashnum])',
        description:
          'Splits a UTF-8 string into parts (shingles) of shinglesize words each and returns the shingles with minimum and maximum word hashes, calculated by the wordShingleMinHashCaseInsensitiveUTF8 function with the same input. Is case insensitive.',
        example:
          "SELECT wordShingleMinHashArgCaseInsensitiveUTF8('ClickHouse® is a column-oriented database management system (DBMS) for online analytical processing of queries (OLAP).', 1, 3) AS Tuple;"
      }
    ],
    'IP addresses': [
      {
        name: 'IPv4NumToString',
        title: 'IPv4NumToString(num)',
        description:
          'Takes a UInt32 number. Interprets it as an IPv4 address in big endian. Returns a string containing the corresponding IPv4 address in the format A.B.C.d (dot-separated numbers in decimal form).',
        example: "SELECT toIPv4('116.106.34.242') as ipv4;"
      },
      {
        name: 'IPv4StringToNum',
        title: 'IPv4StringToNum(s)',
        description: 'The reverse function of IPv4NumToString. If the IPv4 address has an invalid format, it throws exception.',
        example: "SELECT IPv4StringToNum('116.106.34.242') as ipv4;"
      },
      {
        name: 'IPv4NumToStringClassC',
        title: 'IPv4NumToStringClassC(num)',
        description: 'Similar to IPv4NumToString, but using xxx instead of the last octet.',
        example: "SELECT toIPv4('116.106.34.242') as ipv4;"
      },
      {
        name: 'IPv6NumToString',
        title: 'IPv6StringToNum(string)',
        description:
          'The reverse function of IPv6NumToString. If the IPv6 address has an invalid format, it throws exception.\nIf the input string contains a valid IPv4 address, returns its IPv6 equivalent. HEX can be uppercase or lowercase.',
        example: "SELECT addr, cutIPv6(IPv6StringToNum(addr), 0, 0) FROM (SELECT ['notaddress', '127.0.0.1', '1111::ffff'] AS addr) ARRAY JOIN addr;"
      },
      {
        name: 'IPv6StringToNum',
        title: 'IPv6StringToNum(string)',
        description:
          'The reverse function of IPv6NumToString. If the IPv6 address has an invalid format, it throws exception.\nIf the input string contains a valid IPv4 address, returns its IPv6 equivalent. HEX can be uppercase or lowercase.',
        example: "SELECT addr, cutIPv6(IPv6StringToNum(addr), 0, 0) FROM (SELECT ['notaddress', '127.0.0.1', '1111::ffff'] AS addr) ARRAY JOIN addr;"
      },
      {
        name: 'IPv4ToIPv6',
        title: 'IPv4ToIPv6(x)',
        description:
          'Takes a UInt32 number. Interprets it as an IPv4 address in big endian. Returns a FixedString(16) value containing the IPv6 address in binary format.',
        example: "SELECT IPv6NumToString(IPv4ToIPv6(IPv4StringToNum('192.168.0.1'))) AS addr;"
      },
      {
        name: 'cutIPv6',
        title: 'cutIPv6(x, bytesToCutForIPv6, bytesToCutForIPv4)',
        description:
          'Accepts a FixedString(16) value containing the IPv6 address in binary format. Returns a string containing the address of the specified number of bytes removed in text format.',
        example:
          "WITH\n    IPv6StringToNum('2001:0DB8:AC10:FE01:FEED:BABE:CAFE:F00D') AS ipv6,\n    IPv4ToIPv6(IPv4StringToNum('192.168.0.1')) AS ipv4\nSELECT\n    cutIPv6(ipv6, 2, 0),\n    cutIPv6(ipv4, 0, 2)"
      },
      {
        name: 'IPv4CIDRToRange',
        title: 'IPv4CIDRToRange(ipv4, Cidr)',
        description:
          'Accepts an IPv4 and an UInt8 value containing the CIDR. Return a tuple with two IPv4 containing the lower range and the higher range of the subnet.',
        example: "SELECT IPv4CIDRToRange(toIPv4('192.168.5.2'), 16);"
      },
      {
        name: 'IPv6CIDRToRange',
        title: 'IPv6CIDRToRange(ipv6, Cidr)',
        description:
          'Accepts an IPv6 and an UInt8 value containing the CIDR. Return a tuple with two IPv6 containing the lower range and the higher range of the subnet.',
        example: "SELECT IPv6CIDRToRange(toIPv6('2001:0db8:0000:85a3:0000:0000:ac1f:8001'), 32);"
      },
      {
        name: 'toIPv4',
        title: 'toIPv4(string)',
        description:
          'An alias to IPv4StringToNum() that takes a string form of IPv4 address and returns value of IPv4 type, which is binary equal to value returned by IPv4StringToNum().',
        example: "WITH\n    '171.225.130.45' as IPv4_string\nSELECT\n    toTypeName(IPv4StringToNum(IPv4_string)),\n    toTypeName(toIPv4(IPv4_string))"
      },
      {
        name: 'toIPv6',
        title: 'toIPv6(string)',
        description:
          'Converts a string form of IPv6 address to IPv6 type. If the IPv6 address has an invalid format, returns an empty value. Similar to IPv6StringToNum function, which converts IPv6 address to binary format.\nIf the input string contains a valid IPv4 address, then the IPv6 equivalent of the IPv4 address is returned.',
        example: "WITH '2001:438:ffff::407d:1bc1' AS IPv6_string\nSELECT\n    hex(IPv6StringToNum(IPv6_string)),\n    hex(toIPv6(IPv6_string));"
      },
      {
        name: 'isIPv4String',
        title: 'isIPv4String(string)',
        description: 'Determines whether the input string is an IPv4 address or not. If string is IPv6 address returns 0.',
        example: "SELECT addr, isIPv4String(addr) FROM ( SELECT ['0.0.0.0', '127.0.0.1', '::ffff:127.0.0.1'] AS addr ) ARRAY JOIN addr;"
      },
      {
        name: 'isIPv6String',
        title: 'isIPv6String(string)',
        description: 'Determines whether the input string is an IPv6 address or not. If string is IPv4 address returns 0.',
        example: "SELECT addr, isIPv6String(addr) FROM ( SELECT ['::', '1111::ffff', '::ffff:127.0.0.1', '127.0.0.1'] AS addr ) ARRAY JOIN addr;"
      },
      {
        name: 'isIPAddressInRange',
        title: 'isIPAddressInRange(address, prefix)',
        description: 'Determines if an IP address is contained in a network represented in the CIDR notation. Returns 1 if true, or 0 otherwise.',
        example: "SELECT isIPAddressInRange('127.0.0.1', '127.0.0.0/8');"
      }
    ],
    Introspection: [
      {
        name: 'addressToLine',
        title: 'addressToLine(address_of_binary_instruction)',
        description: 'Converts virtual memory address inside ClickHouse server process to the filename and the line number in ClickHouse source code.',
        example: 'SELECT addressToLine(94784076370703) \\G;'
      },
      {
        name: 'addressToSymbol',
        title: 'addressToSymbol(address_of_binary_instruction)',
        description: 'Converts virtual memory address inside ClickHouse server process to the symbol from ClickHouse object files.',
        example: 'SELECT addressToSymbol(94138803686098) \\G;'
      },
      {
        name: 'demangle',
        title: 'demangle(symbol)',
        description: 'Converts a symbol that you can get using the addressToSymbol function to the C++ function name.',
        example: 'SELECT demangle(addressToSymbol(94138803686098)) \\G;'
      },
      {
        name: 'tid',
        title: 'tid()',
        description: 'Returns id of the thread, in which current Block is processed.',
        example: 'SELECT tid();'
      },
      {
        name: 'logTrace',
        title: "logTrace('message')",
        description: 'Emits trace log message to server log for each Block.',
        example: "SELECT logTrace('logTrace message');"
      }
    ],
    JSON: [
      {
        name: 'visitParamHas',
        title: 'visitParamHas(field, name)',
        description: 'Checks whether there is a field with the name name.',
        example: "visitParamHas(students, 'class')"
      },
      {
        name: 'visitParamExtractUInt',
        title: 'visitParamExtractUInt(params, name)',
        description: 'Parses UInt64 from the value of the field named name.',
        example: "visitParamExtractUInt(students, 'age')"
      },
      {
        name: 'simpleJSONExtractUInt',
        title: 'simpleJSONExtractUInt(params, name)',
        description: 'Parses UInt64 from the value of the field named name.',
        example: "simpleJSONExtractUInt(students, 'age')"
      },
      {
        name: 'visitParamExtractInt',
        title: 'visitParamExtractInt(params, name)',
        description: 'Parses Int64 from the value of the field named name.',
        example: "visitParamExtractInt(students, 'age')"
      },
      {
        name: 'simpleJSONExtractInt',
        title: 'simpleJSONExtractInt(params, name)',
        description: 'Parses Int64 from the value of the field named name.',
        example: "simpleJSONExtractInt(students, 'age')"
      },
      {
        name: 'visitParamExtractFloat',
        title: 'visitParamExtractFloat(params, name)',
        description: 'Parses Float64 from the value of the field named name.',
        example: "visitParamExtractFloat(students, 'height')"
      },
      {
        name: 'simpleJSONExtractFloat',
        title: 'simpleJSONExtractFloat(params, name)',
        description: 'Parses Float64 from the value of the field named name.',
        example: "simpleJSONExtractFloat(students, 'height')"
      },
      {
        name: 'visitParamExtractBool',
        title: 'visitParamExtractBool(params, name)',
        description: 'Parses a true/false value. The result is UInt8.',
        example: "simpleJSONExtractFloat(students, 'age')"
      },
      {
        name: 'simpleJSONExtractBool',
        title: 'simpleJSONExtractBool(params, name)',
        description: 'Parses a true/false value. The result is UInt8.',
        example: "simpleJSONExtractBool(students, 'age')"
      },
      {
        name: 'visitParamExtractRaw',
        title: 'visitParamExtractRaw(params, name)',
        description: 'Returns the value of a field, including separators.',
        example: 'visitParamExtractRaw(\'{"abc":{"def":[1,2,3]}}\', \'abc\') = \'{"def":[1,2,3]}\';'
      },
      {
        name: 'visitParamExtractString',
        title: 'visitParamExtractString(params, name)',
        description: 'Parses the string in double quotes. The value is unescaped. If unescaping failed, it returns an empty string.',
        example: "visitParamExtractString('{\"abc\":\"\\\\u263a\"}', 'abc') = '☺';"
      },
      {
        name: 'isValidJSON',
        title: 'isValidJSON(json)',
        description: 'Checks that passed string is a valid json.',
        example: 'SELECT isValidJSON(\'{"a": "hello", "b": [-100, 200.0, 300]}\') = 1'
      },
      {
        name: 'JSONHas',
        title: 'JSONHas(json[, indices_or_keys]…)',
        description: 'If the value exists in the JSON document, 1 will be returned. If the value does not exist, 0 will be returned.',
        example: 'SELECT JSONHas(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\') = 1'
      },
      {
        name: 'JSONLength',
        title: 'JSONLength(json[, indices_or_keys]…)',
        description: 'Return the length of a JSON array or a JSON object. If the value does not exist or has a wrong type, 0 will be returned.',
        example: 'SELECT JSONLength(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\') = 3'
      },
      {
        name: 'JSONType',
        title: 'JSONType(json[, indices_or_keys]…)',
        description: 'Return the type of a JSON value. If the value does not exist, Null will be returned.',
        example: 'SELECT JSONType(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'a\') = \'String\''
      },
      {
        name: 'JSONExtractUInt',
        title: 'JSONExtractUInt(json[, indices_or_keys]…)',
        description:
          'Parses a JSON and extract a value. These functions are similar to visitParam functions. If the value does not exist or has a wrong type, 0 will be returned.',
        example: 'SELECT JSONExtractUInt(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\', -1) = 300'
      },
      {
        name: 'JSONExtractInt',
        title: 'JSONExtractInt(json[, indices_or_keys]…)',
        description:
          'Parses a JSON and extract a value. These functions are similar to visitParam functions. If the value does not exist or has a wrong type, 0 will be returned.',
        example: 'SELECT JSONExtractInt(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\', 1) = -100'
      },
      {
        name: 'JSONExtractFloat',
        title: 'JSONExtractFloat(json[, indices_or_keys]…)',
        description:
          'Parses a JSON and extract a value. These functions are similar to visitParam functions. If the value does not exist or has a wrong type, 0 will be returned.',
        example: 'SELECT JSONExtractFloat(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\', 2) = 200.0'
      },
      {
        name: 'JSONExtractBool',
        title: 'JSONExtractBool(json[, indices_or_keys]…)',
        description:
          'Parses a JSON and extract a value. These functions are similar to visitParam functions. If the value does not exist or has a wrong type, 0 will be returned.',
        example: 'SELECT JSONExtractBool(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\', 2) = 1'
      },
      {
        name: 'JSONExtractString',
        title: 'JSONExtractString(json[, indices_or_keys]…)',
        description:
          'Parses a JSON and extract a string. This function is similar to visitParamExtractString functions. If the value does not exist or has a wrong type, an empty string will be returned. The value is unescaped. If unescaping failed, it returns an empty string.',
        example: 'SELECT JSONExtractString(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'a\') = \'hello\''
      },
      {
        name: 'JSONExtract',
        title: 'JSONExtract(json[, indices_or_keys]…, Return_type)',
        description:
          "Parses a JSON and extract a value of the given ClickHouse data type. This is a generalization of the previous JSONExtract<type> functions.\nThis means\nJSONExtract(..., 'String') returns exactly the same as JSONExtractString(),\nJSONExtract(..., 'Float64') returns exactly the same as JSONExtractFloat().",
        example: 'SELECT JSONExtract(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'Tuple(String, Array(Float64))\') = (\'hello\',[-100,200,300])'
      },
      {
        name: 'JSONExtractKeysAndValues',
        title: 'JSONExtractKeysAndValues(json[, indices_or_keys…], Value_type)',
        description: 'Parses key-value pairs from a JSON where the values are of the given ClickHouse data type.',
        example: "SELECT JSONExtractKeysAndValues('{\"x\": {\"a\": 5, \"b\": 7, \"c\": 11}}', 'x', 'Int8') = [('a',5),('b',7),('c',11)];"
      },
      {
        name: 'JSONExtractKeys',
        title: 'JSONExtractKeys(json[, a, b, c...])',
        description: 'Parses a JSON string and extracts the keys.',
        example: 'SELECT JSONExtractKeys(\'{"a": "hello", "b": [-100, 200.0, 300]}\');'
      },
      {
        name: 'JSONExtractRaw',
        title: 'JSONExtractRaw(json[, indices_or_keys]…)',
        description: 'Returns a part of JSON as unparsed string.\n\nIf the part does not exist or has a wrong type, an empty string will be returned.',
        example: 'SELECT JSONExtractRaw(\'{"a": "hello", "b": [-100, 200.0, 300]}\', \'b\') = \'[-100, 200.0, 300]\';'
      },
      {
        name: 'JSONExtractArrayRaw',
        title: 'JSONExtractArrayRaw(json[, indices_or_keys…])',
        description:
          'Returns an array with elements of JSON array, each represented as unparsed string.\n\nIf the part does not exist or isn’t array, an empty array will be returned.',
        example: 'SELECT JSONExtractArrayRaw(\'{"a": "hello", "b": [-100, 200.0, "hello"]}\', \'b\') = [\'-100\', \'200.0\', \'"hello"\'];'
      },
      {
        name: 'JSONExtractKeysAndValuesRaw',
        title: 'JSONExtractKeysAndValuesRaw(json[, p, a, t, h])',
        description: 'Extracts raw data from a JSON object.',
        example: 'SELECT JSONExtractKeysAndValuesRaw(\'{"a": [-100, 200.0], "b":{"c": {"d": "hello", "f": "world"}}}\');'
      },
      {
        name: 'JSON_EXISTS',
        title: 'JSON_EXISTS(json, path)',
        description: 'If the value exists in the JSON document, 1 will be returned.\n\nIf the value does not exist, 0 will be returned.',
        example: "SELECT JSON_EXISTS('{\"hello\":1}', '$.hello');"
      },
      {
        name: 'JSON_QUERY',
        title: 'JSON_QUERY(json, path)',
        description: 'Parses a JSON and extract a value as JSON array or JSON object.\n\nIf the value does not exist, an empty string will be returned.',
        example: 'SELECT JSON_QUERY(\'{"hello":"world"}\', \'$.hello\');'
      },
      {
        name: 'JSON_VALUE',
        title: 'JSON_VALUE(json, path)',
        description: 'Parses a JSON and extract a value as JSON scalar.\n\nIf the value does not exist, an empty string will be returned.',
        example: "SELECT JSON_VALUE('{\"array\":[[0, 1, 2, 3, 4, 5], [0, -1, -2, -3, -4, -5]]}', '$.array[*][0 to 2, 4]');"
      },
      {
        name: 'toJSONString',
        title: 'toJSONString(value)',
        description: 'Serializes a value to its JSON representation. Various data types and nested structures are supported.',
        example: "SELECT toJSONString(map('key1', 1, 'key2', 2));"
      }
    ],
    Keyword: [
      {
        name: 'on',
        title: 'on (array)',
        description: 'Specifies join conditions separate from any search or filter conditions in the WHERE clause.',
        example:
          'SELECT e.employee_id, e.last_name, e.department_id,\nd.department_id, d.location_id\nFROM employees e JOIN departments d\nON (e.department_id = d.department_id);'
      },
      {
        name: 'all',
        title: 'all (array)',
        description: 'Returns TRUE if ALL of the subquery values meet the condition.',
        example: 'SELECT ALL column_name(s)\nFROM table_name\nWHERE condition;'
      },
      {
        name: 'by',
        title: 'by(data, factorlist, function)',
        description: 'Applys a function to each level of a factor or factors.',
        example: 'by(mydata, mydata$byvar, function(x) mean(x))'
      },
      {
        name: 'select',
        title: 'SELECT column1, column2, ...',
        description: 'Selects data from a database.',
        example: 'SELECT CustomerName, City FROM Customers;'
      },
      {
        name: 'distinct',
        title: 'SELECT DISTINCT column1, column2,.....columnN ',
        description: 'Removes all the duplicate records and fetches only unique records.',
        example: 'SELECT DISTINCT state  \nFROM suppliers; '
      },
      {
        name: 'from',
        title: 'FROM table_name',
        description: 'Specifies which table to select or delete data from.',
        example: 'SELECT CustomerName, City FROM Customers;'
      },
      {
        name: 'group',
        title: 'GROUP BY column_name(s)',
        description: 'Groups rows that have the same values into summary rows.',
        example: 'SELECT COUNT(CustomerID), Country\nFROM Customers\nGROUP BY Country;'
      },
      {
        name: 'having',
        title: 'HAVING condition',
        description: 'Specifies that an SQL SELECT statement must only return rows where aggregate values meet the specified conditions.',
        example: 'SELECT COUNT(CustomerID), Country\nFROM Customers\nGROUP BY Country\nHAVING COUNT(CustomerID) > 5;'
      },
      {
        name: 'into',
        title: 'INTO newtable',
        description: 'Copies data from one table into a new table.',
        example: 'SELECT * INTO CustomersBackup2017\nFROM Customers;'
      },
      {
        name: 'join',
        title: 'join table_name',
        description: 'Produces a new table by combining columns from one or multiple tables by using values common to each.',
        example: 'SELECT Customers.customer_id, Customers.first_name, Orders.amount\nFROM Customers\nJOIN Orders\nON Customers.customer_id = Orders.customer;'
      },
      {
        name: 'left',
        title: 'LEFT(string, number_of_chars)',
        description: 'Extracts a number of characters from a string (starting from left).',
        example: 'LEFT(CustomerName, 5)'
      },
      {
        name: 'right',
        title: 'RIGHT(string, number_of_chars)',
        description: 'Extracts a number of characters from a string (starting from right).',
        example: 'RIGHT(CustomerName, 5)'
      },
      {
        name: 'inner',
        title: 'inner join table_name',
        description: 'Returns records that have matching values in both tables.',
        example:
          'SELECT Customers.customer_id, Customers.first_name, Orders.amount\nFROM Customers\nINNER JOIN Orders\nON Customers.customer_id = Orders.customer;'
      },
      {
        name: 'outer',
        title: 'outer join table_name',
        description: 'Returns matched values and unmatched values from either or both tables.',
        example: 'SELECT students.name, books.title\nFROM students\nFULL OUTER JOIN books ON students.student_id=books.student_id;'
      },
      {
        name: 'outfile',
        title: 'INTO OUTFILE file_name',
        description: 'Redirects the result of a SELECT query to a file on the client side',
        example: "clickhouse-client --query=\"SELECT 1,'ABC' INTO OUTFILE 'select.gz' FORMAT CSV;\"\nzcat select.gz "
      },
      {
        name: 'offset',
        title: 'offset [Number of rows to skip]',
        description: 'Specifies the number of rows to skip before starting to return rows from the query result set.',
        example: 'SELECT * FROM test_fetch ORDER BY a LIMIT 3 OFFSET 1;'
      },
      {
        name: 'limit',
        title: 'limit [Number to Limit By]',
        description: 'Selects the first number of rows from the result.',
        example: 'SELECT *\n  FROM austin_animal_center_intakes\n LIMIT 10'
      },
      {
        name: 'prewhere',
        description:
          'Prewhere is an optimization to apply filtering more efficiently. It works by automatically moving part of WHERE condition to prewhere to control this optimization if you think you know how to do it better than it happens by default.'
      },
      {
        name: 'sample',
        title: 'sample [number of rows]',
        description: 'Returns a subset of rows sampled randomly from the specified table.',
        example: 'select * from testtable sample (10);'
      },
      {
        name: 'union',
        description: ' Combines the result-set of two or more SELECT statements.',
        example: 'SELECT City FROM Customers\nUNION\nSELECT City FROM Suppliers\nORDER BY City;'
      },
      {
        name: 'where',
        title: 'where condition',
        description: 'Filters the data that is coming from FROM clause of SELECT.',
        example: "SELECT * FROM Customers\nWHERE Country='Mexico';"
      },
      {
        name: 'with',
        title: 'WITH <expression> AS <identifier>',
        description:
          'Named subqueries can be included to the current and child query context in places where table objects are allowed. Recursion is prevented by hiding the current level CTEs from the WITH expression.',
        example:
          "WITH '2019-08-01 15:23:00' as ts_upper_bound\nSELECT *\nFROM hits\nWHERE\n    EventDate = toDate(ts_upper_bound) AND\n    EventTime <= ts_upper_bound;"
      },
      {
        name: 'is',
        title: 'WHERE expression IS (NOT) NULL',
        description: 'Checks the specified value and returns TRUE or FALSE depending on the outcome. ',
        example: 'SELECT \n    companyName, fax\nFROM\n    suppliers\nWHERE\n    fax IS NULL;'
      },
      {
        name: 'null',
        title: "null('structure')",
        description:
          'Creates a temporary table of the specified structure with the Null table engine. According to the Null-engine properties, the table data is ignored and the table itself is immediately dropped right after the query execution.',
        example: "INSERT INTO function null('x UInt64') SELECT * FROM numbers_mt(1000000000);"
      },
      {
        name: 'not',
        title: 'not(val);',
        description: 'Calculates the result of the logical negation of the value. ',
        example: 'SELECT NOT(1);'
      },
      {
        name: 'exists',
        title: 'EXISTS [TEMPORARY] [TABLE|DICTIONARY] [db.]name [INTO OUTFILE filename] [FORMAT format]',
        description:
          'Returns a single UInt8-type column, which contains the single value 0 if the table or database does not exist, or 1 if the table exists in the specified database.'
      },
      {
        name: 'user',
        title: 'USER()',
        description: 'Returns the current user name and host name for the MySQL connection.',
        example: 'SELECT USER();'
      },
      {
        name: 'watch',
        title: 'WATCH [db.]live_view EVENTS;',
        description:
          'Performs continuous data retrieval from a LIVE VIEW table. Unless the LIMIT clause is specified it provides an infinite stream of query results from a LIVE VIEW.',
        example: 'CREATE LIVE VIEW lv WITH REFRESH 5 AS SELECT now();\nWATCH lv EVENTS;'
      },
      {
        name: 'except',
        description:
          'Returns only those rows that result from the first query without the second. The queries must match the number of columns, order, and type. The result of EXCEPT can contain duplicate rows.',
        example: 'SELECT number FROM numbers(1,10) EXCEPT SELECT number FROM numbers(3,6);'
      },
      {
        name: 'intersect',
        description:
          'Returns only those rows that result from both the first and the second queries. The queries must match the number of columns, order, and type. The result of INTERSECT can contain duplicate rows.',
        example: 'SELECT number FROM numbers(1,10) INTERSECT SELECT number FROM numbers(3,6);'
      },
      {
        name: 'order',
        title: 'ORDER BY column1, column2, ...',
        description: 'Sorts the result-set in ascending or descending order.',
        example: 'SELECT * FROM Customers\nORDER BY Country, CustomerName;'
      },
      {
        name: 'between',
        title: 'between (value) and (value)',
        description: 'Selects values within a given range. The values can be numbers, text, or dates.',
        example: 'SELECT * FROM Products\nWHERE Price BETWEEN 10 AND 20;'
      },
      {
        name: 'and',
        title: 'and(val1, val2...)',
        description: 'Calculates the result of the logical conjunction between two or more values.',
        example: 'SELECT and(0, 1, -2);'
      },
      {
        name: 'in',
        title: 'in (value)',
        description: 'Specifies if an expression matches any value in a list of values.',
        example: "SELECT '1' IN (SELECT 1);"
      },
      {
        name: 'or',
        title: 'or(val1, val2...)',
        description: 'Calculates the result of the logical disjunction between two or more values.',
        example: 'SELECT or(1, 0, 0, 2, NULL);'
      },
      {
        name: 'xor',
        title: 'xor(val1, val2...)',
        description:
          'Calculates the result of the logical exclusive disjunction between two or more values. For more than two values the function works as if it calculates XOR of the first two values and then uses the result with the next value to calculate XOR and so on.',
        example: 'SELECT xor(0, 1, 1);'
      },
      {
        name: 'then',
        title: 'THEN (desired output)',
        description:
          'Goes through conditions and returns a value when the first condition is met. Once a condition is true, it will stop reading and return the result. If no conditions are true, it returns the value in the ELSE clause. If there is no ELSE part and no conditions are true, it returns NULL.',
        example: 'CASE\n    WHEN City IS NULL THEN Country\n    ELSE City\nEND;'
      },
      {
        name: 'when',
        title: 'WHEN (condition) THEN (desired output)',
        description: 'Indicates the start of a condition that should be checked by the query.',
        example: 'WHEN City = "SF" THEN "San Francisco";'
      },
      {
        name: 'as',
        title: 'as column_name',
        description: 'Renames a column or table with an alias.',
        example: 'SELECT CustomerID AS ID, CustomerName AS Customer\nFROM Customers;'
      },
      {
        name: 'over',
        title: 'OVER ([PARTITION BY columns] [ORDER BY columns])',
        description:
          'Defines a window or user-specified set of rows within a query result set. A window function then computes a value for each row in the window. You can use the OVER clause with functions to compute aggregated values such as moving averages, cumulative aggregates, running totals, or a top N per group results.',
        example: 'OVER (PARTITION BY article) AS total_units_sold'
      },
      {
        name: 'desc',
        description: 'Sorts the data returned in descending order.',
        example: 'SELECT * FROM Customers\nORDER BY CustomerName DESC;'
      },
      {
        name: 'asc',
        description: 'Sorts the data returned in descending order.',
        example: 'SELECT * FROM Customers\nORDER BY CustomerName ASC;'
      }
    ],
    'Machine learning': [
      {
        name: 'stochasticLinearRegression',
        title: "stochasticLinearRegression(1.0, 1.0, 10, 'SGD')",
        description:
          'The stochasticLinearRegression aggregate function implements stochastic gradient descent method using linear model and MSE loss function. Uses evalMLMethod to predict on new data.',
        example: 'WITH (SELECT state FROM your_model) AS model SELECT\nevalMLMethod(model, param1, param2) FROM test_data'
      },
      {
        name: 'stochasticLogisticRegression',
        title: "stochasticLogisticRegression(1.0, 1.0, 10, 'SGD')",
        description:
          'The stochasticLogisticRegression aggregate function implements stochastic gradient descent method for binary classification problem. Uses evalMLMethod to predict on new data.',
        example: 'WITH (SELECT state FROM your_model) AS model SELECT\nevalMLMethod(model, param1, param2) FROM test_data'
      },
      {
        name: 'evalMLMethod',
        title: 'evalMLMethod(model, param1, param2)',
        description: 'Prediction using fitted regression models uses evalMLMethod function. ',
        example: 'SELECT\n    evalMLMethod(model, trip_distance),\n    total_amount\nFROM trips\nLEFT JOIN models ON year = toYear(pickup_datetime)\nLIMIT 5;'
      }
    ],
    Mathematical: [
      {
        name: 'e',
        title: 'e()',
        description: 'Returns a Float64 number that is close to the number e.',
        example: 'SELECT e();'
      },
      {
        name: 'exp',
        title: 'exp(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the exponent of the argument.',
        example: 'SELECT exp(1);'
      },
      {
        name: 'log',
        title: 'log(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the natural logarithm of the argument.',
        example: 'select log(3);'
      },
      {
        name: 'ln',
        title: 'ln(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the natural logarithm of the argument.'
      },
      {
        name: 'exp2',
        title: 'exp2(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to 2 to the power of x.',
        example: 'SELECT exp2(3);'
      },
      {
        name: 'log2',
        title: 'log2(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the binary logarithm of the argument.',
        example: 'select log2(3);'
      },
      {
        name: 'exp10',
        title: 'exp10(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to 10 to the power of x.',
        example: 'SELECT exp10(3);'
      },
      {
        name: 'log10',
        title: 'log10(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the decimal logarithm of the argument.',
        example: 'SELECT log10(3);'
      },
      {
        name: 'sqrt',
        title: 'sqrt(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the square root of the argument.',
        example: 'SELECT sqrt(4);'
      },
      {
        name: 'cbrt',
        title: 'cbrt(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to the cubic root of the argument.',
        example: 'SELECT cbrt(8)'
      },
      {
        name: 'erf',
        title: 'erf(x)',
        description:
          'The error function erf(x)=2√π∫x0e−t2dt erf(x) .\n\nNote: If ‘x’ is non-negative, then erf(x / σ√2) is the probability that a random variable having a normal distribution with standard deviation ‘σ’ takes the value that is separated from the expected value by more than ‘x’.',
        example: 'SELECT erf(3 / sqrt(2));'
      },
      {
        name: 'erfc',
        title: 'erfc(x)',
        description: 'Accepts a numeric argument and returns a Float64 number close to 1 - erf(x), but without loss of precision for large x values.',
        example: 'SELECT erfc(3 / sqrt(2));'
      },
      {
        name: 'lgamma',
        title: 'lgamma(x)',
        description: 'The logarithm of the gamma function.',
        example: 'SELECT lgamma(3);'
      },
      {
        name: 'tgamma',
        title: 'tgamma(x)',
        description: 'Gamma function.',
        example: 'SELECT lgamma(3);'
      },
      {
        name: 'sin',
        title: 'sin(x)',
        description: 'The sine.',
        example: 'SELECT sin(pi()/2)'
      },
      {
        name: 'cos',
        title: 'cos(x)',
        description: 'The cosine.',
        example: 'SELECT cos(pi())'
      },
      {
        name: 'tan',
        title: 'tan(x)',
        description: 'The tangent.',
        example: 'SELECT tan(pi()/4);'
      },
      {
        name: 'asin',
        title: 'asin(x)',
        description: 'The arc sine.',
        example: 'SELECT asin(-1);'
      },
      {
        name: 'acos',
        title: 'acos(x)',
        description: 'The arc cosine.',
        example: 'SELECT acos(-1);'
      },
      {
        name: 'atan',
        title: 'atan(x)',
        description: 'The arc tangent.',
        example: 'SELECT atan(-1);'
      },
      {
        name: 'pow',
        title: 'pow(x, y)',
        description: 'Takes two numeric arguments x and y. Returns a Float64 number close to x to the power of y.',
        example: 'SELECT pow(2, 3);'
      },
      {
        name: 'power',
        title: 'pow(x, y)',
        description: 'Takes two numeric arguments x and y. Returns a Float64 number close to x to the power of y.',
        example: 'SELECT pow(2, 3);'
      },
      {
        name: 'intExp2',
        title: 'intExp2(x)',
        description: 'Accepts a numeric argument and returns a UInt64 number close to 2 to the power of x.',
        example: 'SELECT intExp2(3);'
      },
      {
        name: 'intExp10',
        title: 'intExp10(x)',
        description: 'Accepts a numeric argument and returns a UInt64 number close to 10 to the power of x.',
        example: 'SELECT intExp10(3);'
      },
      {
        name: 'cosh',
        title: 'cosh(x)',
        description: 'Hyperbolic cosine.',
        example: 'SELECT cosh(0);'
      },
      {
        name: 'acosh',
        title: 'acosh(x)',
        description: 'Inverse hyperbolic cosine.',
        example: 'SELECT acosh(1);'
      },
      {
        name: 'sinh',
        title: 'sinh(x)',
        description: 'Hyperbolic sine.',
        example: 'SELECT sinh(0);'
      },
      {
        name: 'asinh',
        title: 'asinh(x)',
        description: 'Inverse hyperbolic sine.',
        example: 'SELECT asinh(0);'
      },
      {
        name: 'atanh',
        title: 'atanh(x)',
        description: 'Inverse hyperbolic tangent.',
        example: 'SELECT atanh(0);'
      },
      {
        name: 'atan2',
        title: 'atan2(y, x)',
        description: 'Calculates the angle in the Euclidean plane, given in radians, between the positive x axis and the ray to the point (x, y) ≠ (0, 0).',
        example: 'SELECT atan2(1, 1);'
      },
      {
        name: 'hypot',
        title: 'hypot(x, y)',
        description:
          'Calculates the length of the hypotenuse of a right-angle triangle. The function avoids problems that occur when squaring very large or very small numbers.',
        example: 'SELECT hypot(1, 1);'
      },
      {
        name: 'log1p',
        title: 'log1p(x)',
        description: 'Calculates log(1+x). The function log1p(x) is more accurate than log(1+x) for small values of x.',
        example: 'SELECT log1p(0);'
      },
      {
        name: 'sign',
        title: 'sign(x)',
        description: 'Returns the sign of a real number.',
        example: 'SELECT sign(0);'
      }
    ],
    Nullable: [
      {
        name: 'isNull',
        title: 'isNull(x)',
        description: 'Checks whether the argument is NULL.',
        example: 'SELECT x FROM t_null WHERE isNull(y);'
      },
      {
        name: 'isNotNull',
        title: 'isNotNull(x)',
        description: 'Checks whether the argument is NULL.',
        example: 'SELECT x FROM t_null WHERE isNotNull(y);'
      },
      {
        name: 'coalesce',
        title: 'coalesce(x,...)',
        description: 'Checks from left to right whether NULL arguments were passed and returns the first non-NULL argument.',
        example: "SELECT name, coalesce(mail, phone, CAST(icq,'Nullable(String)')) FROM aBook;"
      },
      {
        name: 'ifNull',
        title: 'ifNull(x,alt)',
        description: 'Returns an alternative value if the main argument is NULL.',
        example: "SELECT ifNull('a', 'b');"
      },
      {
        name: 'nullIf',
        title: 'nullIf(x, y)',
        description: 'Returns NULL if the arguments are equal.',
        example: 'SELECT nullIf(1, 1);'
      },
      {
        name: 'assumeNotNull',
        title: 'assumeNotNull(x)',
        description:
          'Results in an equivalent non-Nullable value for a Nullable type. In case the original value is NULL the result is undetermined. See also ifNull and coalesce functions.',
        example: 'SELECT assumeNotNull(y) FROM t_null;'
      },
      {
        name: 'toNullable',
        title: 'toNullable(x)',
        description: 'Converts the argument type to Nullable.',
        example: 'SELECT toTypeName(toNullable(10));'
      }
    ],
    Other: [
      {
        name: 'hostName',
        title: 'hostName()',
        description:
          'Returns a string with the name of the host that this function was performed on. For distributed processing, this is the name of the remote server host, if the function is performed on a remote server. If it is executed in the context of a distributed table, then it generates a normal column with values relevant to each shard. Otherwise it produces a constant value.',
        example: 'SELECT hostName();'
      },
      {
        name: 'getMacro',
        title: 'getMacro(name);',
        description: 'Gets a named value from the macros section of the server configuration.',
        example: "SELECT getMacro('test');"
      },
      {
        name: 'FQDN',
        title: 'fqdn();',
        description: 'Returns the fully qualified domain name.',
        example: 'SELECT FQDN();'
      },
      {
        name: 'basename',
        title: 'basename( expr )',
        description:
          'Extracts the trailing part of a string after the last slash or backslash. This function if often used to extract the filename from a path.',
        example: "SELECT 'some/long/path/to/file' AS a, basename(a)"
      },
      {
        name: 'visibleWidth',
        title: 'visibleWidth(x)',
        description:
          'Calculates the approximate width when outputting values to the console in text format (tab-separated). This function is used by the system for implementing Pretty formats.\nNULL is represented as a string corresponding to NULL in Pretty formats.',
        example: 'SELECT visibleWidth(NULL)'
      },
      {
        name: 'toTypeName',
        title: 'toTypeName(x)',
        description:
          'Returns a string containing the type name of the passed argument.\nIf NULL is passed to the function as input, then it returns the Nullable(Nothing) type, which corresponds to an internal NULL representation in ClickHouse.',
        example: "SELECT toTypeName('123');"
      },
      {
        name: 'blockSize',
        title: 'blockSize()',
        description:
          'Gets the size of the block. In ClickHouse, queries are always run on blocks (sets of column parts). This function allows getting the size of the block that you called it for.',
        example: 'SELECT blockSize();'
      },
      {
        name: 'byteSize',
        title: 'byteSize(argument [, ...])',
        description: 'Returns estimation of uncompressed byte size of its arguments in memory.',
        example: "SELECT byteSize('string');"
      },
      {
        name: 'materialize',
        title: 'materialize(x)',
        description:
          'Turns a constant into a full column containing just one value. In ClickHouse, full columns and constants are represented differently in memory. Functions work differently for constant arguments and normal arguments (different code is executed), although the result is almost always the same. This function is for debugging this behavior.'
      },
      {
        name: 'ignore',
        title: 'ignore(…)',
        description: 'Accepts any arguments, including NULL. Always returns 0. However, the argument is still evaluated. This can be used for benchmarks.'
      },
      {
        name: 'sleep',
        title: 'sleep(seconds)',
        description: 'Sleeps ‘seconds’ seconds on each data block. You can specify an integer or a floating-point number.'
      },
      {
        name: 'sleepEachRow',
        title: 'sleepEachRow(seconds)',
        description: 'Sleeps ‘seconds’ seconds on each row. You can specify an integer or a floating-point number.'
      },
      {
        name: 'currentDatabase',
        title: 'currentDatabase()',
        description:
          'Returns the name of the current database. You can use this function in table engine parameters in a CREATE TABLE query where you need to specify the database.',
        example: 'SELECT currentDatabase();'
      },
      {
        name: 'currentUser',
        title: 'currentUser()',
        description: 'Returns the login of current user. Login of user, that initiated query, will be returned in case distibuted query.',
        example: 'SELECT currentUser();'
      },
      {
        name: 'isConstant',
        title: 'isConstant(x)',
        description:
          'Checks whether the argument is a constant expression.\nA constant expression means an expression whose resulting value is known at the query analysis (i.e. before execution).\nThe function is intended for development, debugging and demonstration.',
        example: 'SELECT isConstant(x + 1) FROM (SELECT 43 AS x)'
      },
      {
        name: 'isFinite',
        title: 'isFinite(x)',
        description: 'Accepts Float32 and Float64 and returns UInt8 equal to 1 if the argument is not infinite and not a NaN, otherwise 0.',
        example: 'SELECT isFinite(0);'
      },
      {
        name: 'isInfinite',
        title: 'isInfinite(x)',
        description: 'Accepts Float32 and Float64 and returns UInt8 equal to 1 if the argument is infinite, otherwise 0. Note that 0 is returned for a NaN.',
        example: 'SELECT isInFinite(0);'
      },
      {
        name: 'ifNotFinite',
        title: 'ifNotFinite(x,y)',
        description: 'Checks whether floating point value is finite.',
        example: 'SELECT 1/0 as infimum, ifNotFinite(infimum,42)'
      },
      {
        name: 'isNaN',
        title: 'isNaN(x)',
        description: 'Accepts Float32 and Float64 and returns UInt8 equal to 1 if the argument is a NaN, otherwise 0.',
        example: 'SELECT isNaN("37");'
      },
      {
        name: 'hasColumnInTable',
        title: 'hasColumnInTable([‘hostname’[, ‘username’[, ‘password’]],] ‘database’, ‘table’, ‘column’)',
        description:
          'Accepts constant strings: database name, table name, and column name. Returns a UInt8 constant expression equal to 1 if there is a column, otherwise 0. If the hostname parameter is set, the test will run on a remote server. The function throws an exception if the table does not exist. For elements in a nested data structure, the function checks for the existence of a column. For the nested data structure itself, the function returns 0.',
        example: 'SELECT hasColumnInTable(‘column’);'
      },
      {
        name: 'bar',
        title: 'bar(x, min, max, width)',
        description: 'Allows building a unicode-art diagram.',
        example: 'SELECT\n    toHour(EventTime) AS h,\n    count() AS c,\n    bar(c, 0, 600000, 20) AS bar\nFROM test.hits\nGROUP BY h\nORDER BY h ASC'
      },
      {
        name: 'transform',
        title: 'transform(x, array_from, array_to, default)',
        description: 'Transforms a value according to the explicitly defined mapping of some elements to other ones. ',
        example: "SELECT transform(SearchEngineID, [2, 3], ['Yandex', 'Google'], 'Other') AS title;"
      },
      {
        name: 'formatReadableSize',
        title: 'formatReadableSize(x)',
        description: 'Accepts the size (number of bytes). Returns a rounded size with a suffix (KiB, MiB, etc.) as a string.',
        example: 'SELECT\n    arrayJoin([1, 1024, 1024*1024, 192851925]) AS filesize_bytes,\n    formatReadableSize(filesize_bytes) AS filesize;'
      },
      {
        name: 'formatReadableQuantity',
        title: 'formatReadableQuantity(x)',
        description:
          'Accepts the number. Returns a rounded number with a suffix (thousand, million, billion, etc.) as a string.\nIt is useful for reading big numbers by human.',
        example:
          'SELECT\n    arrayJoin([1024, 1234 * 1000, (4567 * 1000) * 1000, 98765432101234]) AS number,\n    formatReadableQuantity(number) AS number_for_humans'
      },
      {
        name: 'formatReadableTimeDelta',
        title: 'formatReadableTimeDelta(column[, maximum_unit])',
        description: 'Accepts the time delta in seconds. Returns a time delta with (year, month, day, hour, minute, second) as a string.',
        example: 'SELECT\n    arrayJoin([100, 12345, 432546534]) AS elapsed,\n    formatReadableTimeDelta(elapsed) AS time_delta;'
      },
      {
        name: 'least',
        title: 'least(a, b)',
        description: 'Returns the smallest value from a and b.',
        example: 'SELECT LEAST (C1, C2, C3) FROM T1;'
      },
      {
        name: 'greatest',
        title: 'greatest(a, b)',
        description: 'Returns the largest value of a and b.',
        example: 'SELECT GREATEST (C1, C2, C3) FROM T1'
      },
      {
        name: 'uptime',
        title: 'uptime()',
        description:
          'Returns the server’s uptime in seconds. If it is executed in the context of a distributed table, then it generates a normal column with values relevant to each shard. Otherwise it produces a constant value.',
        example: 'SELCT uptime();'
      },
      {
        name: 'version',
        title: 'version()',
        description:
          'Returns the version of the server as a string. If it is executed in the context of a distributed table, then it generates a normal column with values relevant to each shard. Otherwise it produces a constant value.',
        example: 'SELECT version();'
      },
      {
        name: 'blockNumber',
        title: 'blockNumber()',
        description: 'Returns the sequence number of the data block where the row is located.',
        example: 'SELECT blockNumber();'
      },
      {
        name: 'rowNumberInBlock',
        title: 'rowNumberInBlock()',
        description: 'Returns the ordinal number of the row in the data block. Different data blocks are always recalculated.',
        example: 'SELECT rowNumberInBlock();'
      },
      {
        name: 'rowNumberInAllBlocks',
        title: 'rowNumberInAllBlocks()',
        description: 'Returns the ordinal number of the row in the data block. This function only considers the affected data blocks.',
        example: 'SELECT rowNumberInAllBlocks();'
      },
      {
        name: 'neighbor',
        title: 'neighbor(column, offset[, default_value])',
        description: 'The window function that provides access to a row at a specified offset which comes before or after the current row of a given column.',
        example: 'SELECT number, neighbor(number, 2) FROM system.numbers LIMIT 10;'
      },
      {
        name: 'runningDifference',
        title: 'runningDifference(x)',
        description:
          'Calculates the difference between successive row values ​​in the data block. Returns 0 for the first row and the difference from the previous row for each subsequent row.',
        example: 'SELECT\n    number,\n    runningDifference(number + 1) AS diff\nFROM numbers(100000)\nWHERE diff != 1'
      },
      {
        name: 'runningDifferenceStartingWithFirstValue',
        title: 'runningDifferenceStartingWithFirstValue(x)',
        description:
          'Same as for runningDifference, the difference is the value of the first row, returned the value of the first row, and each subsequent row returns the difference from the previous row.',
        example: 'SELECT\n    number,\n    runningDifference(number + 1) AS diff\nFROM numbers(100000)\nWHERE diff != 1'
      },
      {
        name: 'runningConcurrency',
        title: 'runningConcurrency(start, end)',
        description:
          'Calculates the number of concurrent events. Each event has a start time and an end time. The start time is included in the event, while the end time is excluded. Columns with a start time and an end time must be of the same data type. The function calculates the total number of active (concurrent) events for each event start time.',
        example: 'SELECT start, runningConcurrency(start, end) FROM example_table;'
      },
      {
        name: 'MACNumToString',
        title: 'MACNumToString(num)',
        description:
          'Accepts a UInt64 number. Interprets it as a MAC address in big endian. Returns a string containing the corresponding MAC address in the format AA:BB:CC:DD:EE:FF (colon-separated numbers in hexadecimal form).'
      },
      {
        name: 'MACStringToNum',
        title: 'MACStringToNum(s)',
        description: 'The inverse function of MACNumToString. If the MAC address has an invalid format, it returns 0.'
      },
      {
        name: 'MACStringToOUI',
        title: 'MACStringToOUI(s)',
        description:
          'Accepts a MAC address in the format AA:BB:CC:DD:EE:FF (colon-separated numbers in hexadecimal form). Returns the first three octets as a UInt64 number. If the MAC address has an invalid format, it returns 0.'
      },
      {
        name: 'getSizeOfEnumType',
        title: 'getSizeOfEnumType(value)',
        description: 'Returns the number of fields in Enum.',
        example: "SELECT getSizeOfEnumType( CAST('a' AS Enum8('a' = 1, 'b' = 2) ) ) AS x"
      },
      {
        name: 'blockSerializedSize',
        title: 'blockSerializedSize(value[, value[, ...]])',
        description: 'Returns size on disk (without taking into account compression).',
        example: 'SELECT blockSerializedSize(maxState(1)) as x'
      },
      {
        name: 'toColumnTypeName',
        title: 'toColumnTypeName(value)',
        description: 'Returns the name of the class that represents the data type of the column in RAM.',
        example: "SELECT toTypeName(CAST('2018-01-01 01:02:03' AS DateTime))"
      },
      {
        name: 'dumpColumnStructure',
        title: 'dumpColumnStructure(value)',
        description: 'Outputs a detailed description of data structures in RAM',
        example: "SELECT dumpColumnStructure(CAST('2018-01-01 01:02:03', 'DateTime'))"
      },
      {
        name: 'defaultValueOfArgumentType',
        title: 'defaultValueOfArgumentType(expression)',
        description: 'Outputs the default value for the data type.\nDoes not include default values for custom columns set by the user.',
        example: 'SELECT defaultValueOfArgumentType( CAST(1 AS Int8) )'
      },
      {
        name: 'defaultValueOfTypeName',
        title: 'defaultValueOfTypeName(type)',
        description: 'Outputs the default value for given type name.\nDoes not include default values for custom columns set by the user.',
        example: "SELECT defaultValueOfTypeName('Int8')"
      },
      {
        name: 'indexHint',
        title: 'indexHint(<expression>)',
        description:
          "The function is intended for debugging and introspection purposes. The function ignores it's argument and always returns 1. Arguments are not even evaluated.\nBut for the purpose of index analysis, the argument of this function is analyzed as if it was present directly without being wrapped inside indexHint function. This allows to select data in index ranges by the corresponding condition but without further filtering by this condition. The index in ClickHouse is sparse and using indexHint will yield more data than specifying the same condition directly.",
        example: "SELECT\n    FlightDate AS k,\n    count()\nFROM ontime\nWHERE indexHint(k = '2017-09-15')\nGROUP BY k\nORDER BY k ASC"
      },
      {
        name: 'replicate',
        title: 'replicate(x, arr)',
        description: 'Creates an array with a single value.\nUsed for internal implementation of arrayJoin.',
        example: "SELECT replicate(1, ['a', 'b', 'c'])"
      },
      {
        name: 'filesystemAvailable',
        title: 'filesystemAvailable()',
        description:
          'Returns amount of remaining space on the filesystem where the files of the databases located. It is always smaller than total free space (filesystemFree) because some space is reserved for OS.',
        example: 'SELECT formatReadableSize(filesystemAvailable()) AS "Available space", toTypeName(filesystemAvailable()) AS "Type";'
      },
      {
        name: 'filesystemFree',
        title: 'filesystemFree()',
        description: 'Returns total amount of the free space on the filesystem where the files of the databases located. See also filesystemAvailable',
        example: 'SELECT formatReadableSize(filesystemFree()) AS "Free space", toTypeName(filesystemFree()) AS "Type";'
      },
      {
        name: 'filesystemCapacity',
        title: 'filesystemCapacity()',
        description: 'Returns the capacity of the filesystem in bytes. For evaluation, the path to the data directory must be configured.',
        example: 'SELECT formatReadableSize(filesystemCapacity()) AS "Capacity", toTypeName(filesystemCapacity()) AS "Type"'
      },
      {
        name: 'finalizeAggregation',
        title: 'finalizeAggregation(state)',
        description: 'Takes state of aggregate function. Returns result of aggregation (or finalized state when using-State combinator).',
        example: 'SELECT finalizeAggregation(( SELECT countState(number) FROM numbers(10)));'
      },
      {
        name: 'runningAccumulate',
        title: 'runningAccumulate(agg_state[, grouping]);',
        description: 'Accumulates states of an aggregate function for each row of a data block.',
        example: 'SELECT k, runningAccumulate(sum_k) AS res FROM (SELECT number as k, sumState(k) AS sum_k FROM numbers(10) GROUP BY k ORDER BY k);'
      },
      {
        name: 'joinGet',
        title: 'joinGet(join_storage_table_name, `value_column`, join_keys)',
        description: 'Lets you extract data from the table the same way as from a dictionary.',
        example: "SELECT joinGet(db_test.id_val,'val',toUInt32(number)) from numbers(4) SETTINGS join_use_nulls = 1"
      },
      {
        name: 'catboostEvaluate',
        title: 'catboostEvaluate(path_to_model, feature_1, feature_2, …, feature_n)',
        description:
          'Evaluate external catboost model. CatBoost is an open-source gradient boosting library developed by Yandex for machine learing. Accepts a path to a catboost model and model arguments (features). Returns Float64.'
      },
      {
        name: 'throwIf',
        title: 'throwIf(x[, message[, error_code]])',
        description:
          'ThrowS an exception if the argument is non zero. message - is an optional parameter: a constant string providing a custom error message error_code - is an optional parameter: a constant integer providing a custom error code\nTo use the error_code argument, configuration parameter allow_custom_error_code_in_throwif must be enabled.',
        example: "SELECT throwIf(number = 3, 'Too many') FROM numbers(10);"
      },
      {
        name: 'identity',
        title: 'identity(x)',
        description:
          'Returns the same value that was used as its argument. Used for debugging and testing, allows to cancel using index, and get the query performance of a full scan. When query is analyzed for possible use of index, the analyzer does not look inside identity functions. Also constant folding is not applied too.',
        example: 'SELECT identity(42);'
      },
      {
        name: 'getSetting',
        title: "getSetting('custom_setting');",
        description: 'Returns the current value of a custom setting.',
        example: "SET custom_a = 123;\nSELECT getSetting('custom_a');"
      },
      {
        name: 'isDecimalOverflow',
        title: 'isDecimalOverflow(d, [p])',
        description: 'Checks whether the Decimal value is out of its (or specified) precision.',
        example: 'SELECT isDecimalOverflow(toDecimal32(1000000000, 0), 9);'
      },
      {
        name: 'countDigits',
        title: 'countDigits(x)',
        description: 'Returns number of decimal digits you need to represent the value.',
        example: 'SELECT countDigits(toDecimal32(1, 9));'
      },
      {
        name: 'errorCodeToName',
        title: 'errorCodeToName(x)',
        description: 'Returned value: Variable name for the error code.',
        example: 'errorCodeToName(1)'
      },
      {
        name: 'tcpPort',
        title: 'tcpPort()',
        description:
          'Returns native interface TCP port number listened by this server. If it is executed in the context of a distributed table, then it generates a normal column, otherwise it produces a constant value.',
        example: 'SELECT tcpPort();'
      }
    ],
    'Random numbers and strings': [
      {
        name: 'rand',
        title: 'rand()',
        description: 'Returns a random decimal number between 0 and 1',
        example: 'SELECT rand();'
      },
      {
        name: 'rand32',
        title: 'rand32()',
        description: 'Returns a pseudo-random UInt32 number, evenly distributed among all UInt32-type numbers.',
        example: 'uint32 rand32();'
      },
      {
        name: 'rand64',
        title: 'rand64()',
        description: 'Returns a pseudo-random UInt64 number, evenly distributed among all UInt64-type numbers.',
        example: 'uint32 rand64();'
      },
      {
        name: 'randConstant',
        title: 'randConstant([x])',
        description: 'Produces a constant column with a random value.',
        example: 'SELECT randConstant(1);'
      },
      {
        name: 'randomString',
        title: 'randomString(length)',
        description: 'Generates a binary string of the specified length filled with random bytes (including zero bytes).',
        example: 'SELECT randomString(30) AS str, length(str) AS len FROM numbers(2) FORMAT Vertical;'
      },
      {
        name: 'randomFixedString',
        title: 'randomFixedString(length);',
        description: 'Generates a binary string of the specified length filled with random bytes (including zero bytes).',
        example: 'SELECT randomFixedString(13) as rnd, toTypeName(rnd)'
      },
      {
        name: 'randomPrintableASCII',
        title: 'randomPrintableASCII(length)',
        description: 'Generates a string with a random set of ASCII printable characters.',
        example: 'SELECT number, randomPrintableASCII(30) as str, length(str) FROM system.numbers LIMIT 3'
      },
      {
        name: 'randomStringUTF8',
        title: 'randomStringUTF8(length);',
        description:
          'Generates a random string of a specified length. Result string contains valid UTF-8 code points. The value of code points may be outside of the range of assigned Unicode.',
        example: 'SELECT randomStringUTF8(13)'
      },
      {
        name: 'fuzzBits',
        title: 'fuzzBits([s], [prob])',
        description: 'Inverts bits of s, each with probability prob.',
        example: "SELECT fuzzBits(materialize('abacaba'), 0.1)\nFROM numbers(3);"
      }
    ],
    'Replace in strings': [
      {
        name: 'replaceOne',
        title: 'replaceOne(haystack, pattern, replacement)',
        description:
          'Replaces the first occurrence, if it exists, of the ‘pattern’ substring in ‘haystack’ with the ‘replacement’ substring. Hereafter, ‘pattern’ and ‘replacement’ must be constants.',
        example: "SELECT replaceOne('Hello World', 'o', 'x')\n//Hellx World"
      },
      {
        name: 'replaceAll',
        title: 'replaceAll(haystack, pattern, replacement)',
        description: 'Replaces all occurrences of the ‘pattern’ substring in ‘haystack’ with the ‘replacement’ substring.',
        example: "SELECT replaceAll('Hello World', 'o', 'x')\n//Hellx Wxrld"
      },
      {
        name: 'replace',
        title: 'replace(haystack, pattern, replacement)',
        description: 'Replaces all occurrences of the ‘pattern’ substring in ‘haystack’ with the ‘replacement’ substring.',
        example: "SELECT replace('Hello World', 'o', 'x')\n//Hellx Wxrld"
      },
      {
        name: 'replaceRegexpOne',
        title: 'replaceRegexpOne(haystack, pattern, replacement)',
        description:
          'Replacement using the ‘pattern’ regular expression. A re2 regular expression. Replaces only the first occurrence, if it exists. A pattern can be specified as ‘replacement’. This pattern can include substitutions \\0-\\9. The substitution \\0 includes the entire regular expression. Substitutions \\1-\\9 correspond to the subpattern numbers.To use the \\ character in a template, escape it using \\. Also keep in mind that a string literal requires an extra escape.',
        example: "SELECT replaceRegexpOne('Hello, World!', '.*', '\\0\\0')\n//Hello, World!Hello, World!"
      },
      {
        name: 'replaceRegexpAll',
        title: 'replaceRegexpAll(haystack, pattern, replacement)',
        description: 'This does the same thing, but replaces all the occurrences. Example:',
        example: "SELECT replaceRegexpAll('Hello, World!', '.', '\\0\\0')\n//HHeelllloo,,  WWoorrlldd!!"
      },
      {
        name: 'regexpQuoteMeta',
        title: 'regexpQuoteMeta(string)',
        description:
          'The function adds a backslash before some predefined characters in the string. Predefined characters: \\0, \\, |, (, ), ^, $, ., [, ], ?, *, +, {, :, -. This implementation slightly differs from re2::RE2::QuoteMeta. It escapes zero byte as \\0 instead of \\x00 and it escapes only required characters. For more information, see the link: RE2.',
        example: "SELECT regexpQuoteMeta('Hello, World!*')\n//Hello, World!\\*"
      }
    ],
    Rounding: [
      {
        name: 'floor',
        title: 'floor(x[, N])',
        description:
          'Returns the largest round number that is less than or equal to x. A round number is a multiple of 1/10N, or the nearest number of the appropriate data type if 1 / 10N isn’t exact. ‘N’ is an integer constant, optional parameter. By default it is zero, which means to round to an integer. ‘N’ may be negative.',
        example: 'floor(123.45, 1) = 123.4;'
      },
      {
        name: 'ceil',
        title: 'ceil(x[, N])',
        description: 'Returns the smallest round number that is greater than or equal to x . In every other way, it is the same as the floor function',
        example: 'SELECT ceil(1.99,2);'
      },
      {
        name: 'ceiling',
        title: 'ceiling(x[, N])',
        description: 'Returns the smallest round number that is greater than or equal to x . In every other way, it is the same as the floor function',
        example: 'SELECT ceiling(1.99,2);'
      },
      {
        name: 'trunc',
        title: 'trunc(x[, N])',
        description:
          'Returns the round number with largest absolute value that has an absolute value less than or equal to x‘s. In every other way, it is the same as the ’floor’ function',
        example: 'SELECT trunc(100.11, 1)'
      },
      {
        name: 'truncate',
        title: 'truncate(x[, N])',
        description:
          'Returns the round number with largest absolute value that has an absolute value less than or equal to x‘s. In every other way, it is the same as the ’floor’ function',
        example: 'SELECT truncate(100.11, 1)'
      },
      {
        name: 'round',
        title: 'round(expression [, decimal_places])',
        description:
          'Rounds a value to a specified number of decimal places.\nThe function returns the nearest number of the specified order. In case when given number has equal distance to surrounding numbers, the function uses banker’s rounding for float number types and rounds away from zero for the other number types (Decimal).',
        example: 'SELECT number / 2 AS x, round(x) FROM system.numbers LIMIT 3'
      },
      {
        name: 'roundBankers',
        title: 'roundBankers(expression [, decimal_places])',
        description:
          'Rounds a number to a specified decimal position.\nIf the rounding number is halfway between two numbers, the function uses banker’s rounding. In other cases, the function rounds numbers to the nearest integer.',
        example: ' SELECT number / 2 AS x, roundBankers(x, 0) AS b fROM system.numbers limit 10'
      },
      {
        name: 'roundToExp2',
        title: 'roundToExp2(num)',
        description:
          'Accepts a number. If the number is less than one, it returns 0. Otherwise, it rounds the number down to the nearest (whole non-negative) degree of two.',
        example: 'roundToExp2(31) = 16;'
      },
      {
        name: 'roundDuration',
        title: 'roundDuration(num)',
        description:
          'Accepts a number. If the number is less than one, it returns 0. Otherwise, it rounds the number down to numbers from the set: 1, 10, 30, 60, 120, 180, 240, 300, 600, 1200, 1800, 3600, 7200, 18000, 36000.',
        example: 'roundDuration(230) = 180;'
      },
      {
        name: 'roundAge',
        title: 'roundAge(num)',
        description:
          'Accepts a number. If the number is less than 18, it returns 0. Otherwise, it rounds the number down to a number from the set: 18, 25, 35, 45, 55.',
        example: 'roundAge(50) = 45;'
      },
      {
        name: 'roundDown',
        title: 'roundDown(num, arr)',
        description:
          'Accepts a number and rounds it down to an element in the specified array. If the value is less than the lowest bound, the lowest bound is returned.',
        example: 'roundDown(2, [6, 7, 8]) = 6;'
      }
    ],
    'Searching in string': [
      {
        name: 'position',
        title: 'position(haystack, needle [, start_pos]),\n position(needle in haystack)',
        description:
          'Searches for the substring `needle` in the string `haystack`.Returns the position (in bytes) of the found substring in the string, starting from 1.',
        example: "position('Hello, world!', '!') = 13"
      },
      {
        name: 'locate',
        title: 'locate(haystack, needle [, start_pos])',
        description:
          'Searches for the substring `needle` in the string `haystack`.Returns the position (in bytes) of the found substring in the string, starting from 1.',
        example: "locate('Hello, world!', '!') = 13"
      },
      {
        name: 'positionCaseInsensitive',
        title: 'positionCaseInsensitive(haystack, needle[, start_pos])',
        description:
          'The same as position returns the position (in bytes) of the found substring in the string, starting from 1. Use the function for a case-insensitive search. Works under the assumption that the string contains a set of bytes representing a single-byte encoded text. If this assumption is not met and a character can’t be represented using a single byte, the function doesn’t throw an exception and returns some unexpected result. If character can be represented using two bytes, it will use two bytes and so on.',
        example: "positionCaseInsensitive('Hello, world!', 'hello') = 1"
      },
      {
        name: 'positionUTF8',
        title: 'positionUTF8(haystack, needle[, start_pos])',
        description: 'Returns the position (in Unicode points) of the found substring in the string, starting from 1.',
        example: "positionUTF8('Hello, world!', '!') = 13"
      },
      {
        name: 'positionCaseInsensitiveUTF8',
        title: 'positionCaseInsensitiveUTF8(haystack, needle[, start_pos])',
        description: 'same as positionUTF8 but is case-insensitive',
        example: "positionCaseInsensitiveUTF8('Hello, world!', '!') = 13"
      },
      {
        name: 'multiSearchAllPositions',
        title: 'multiSearchAllPositions(haystack, [needle1, needle2, ..., needlen])',
        description:
          'The same as position but returns Array of positions (in bytes) of the found corresponding substrings in the string. Positions are indexed starting from 1.',
        example: "multiSearchAllPositions('Hello, world!', ['!', 'world']) = [13, 8]"
      },
      {
        name: 'multiSearchAllPositionsUTF8',
        title: 'multiSearchAllPositionsUTF8(haystack, [needle1, needle2, ..., needlen])',
        description:
          'The same as position but returns Array of positions (in Unicode points) of the found corresponding substrings in the string. Positions are indexed starting from 1.',
        example: "multiSearchAllPositionsUTF8('Hello, world!', ['!', 'world']) = [13, 8]"
      },
      {
        name: 'multiSearchFirstIndex',
        title: 'multiSearchFirstIndex(haystack, [needle1, needle2, ..., needlen])',
        description: 'Returns the index i (starting from 1) of the leftmost found needle i in the string haystack and 0 otherwise.',
        example: "multiSearchFirstIndex('Hello, world!', ['!', 'world']) = 1"
      },
      {
        name: 'multiSearchAny',
        title: 'multiSearchAny(haystack, [needle1, needle2, ..., needlen])',
        description: 'Returns 1, if at least one string needle i matches the string haystack and 0 otherwise.',
        example: "multiSearchAny('Hello, world!', ['!', 'test']) = 1"
      },
      {
        name: 'match',
        title: 'match(haystack, pattern)',
        description: 'Checks whether the string matches the pattern regular expression. ',
        example: "match('Hello World 12', '[0-9]') = 1"
      },
      {
        name: 'multiMatchAny',
        title: 'multiMatchAny(haystack, [pattern1, pattern2, …, patternn])',
        description:
          'The same as match, but returns 0 if none of the regular expressions are matched and 1 if any of the patterns matches. It uses hyperscan library. For patterns to search substrings in a string, it is better to use multiSearchAny since it works much faster.',
        example: "multiMatchAny('Hello World',['[0-9]','[a-z]') = 1"
      },
      {
        name: 'multiMatchAnyIndex',
        title: 'multiMatchAnyIndex(haystack, [pattern1, pattern2, …, patternn])',
        description: 'The same as multiMatchAny, but returns any index that matches the haystack.',
        example: "multiMatchAnyIndex('Hello World',['[0-9]','[a-z]') = 2"
      },
      {
        name: 'multiMatchAllIndices',
        title: 'multiMatchAllIndices(haystack, [pattern1, pattern2, …, patternn])',
        description: 'The same as multiMatchAny, but returns the array of all indicies that match the haystack in any order.',
        example: "multiMatchAllIndices('Hello World',['[0-9]','[a-z]') = 2"
      },
      {
        name: 'multiFuzzyMatchAny',
        title: 'multiFuzzyMatchAny(haystack, distance, [pattern1, pattern2, …, patternn])',
        description:
          "The same as multiMatchAny, but returns 1 if any pattern matches the haystack within a constant edit distance. This function relies on the experimental feature of hyperscan library, and can be slow for some corner cases. The performance depends on the edit distance value and patterns used, but it's always more expensive compared to a non-fuzzy variants.",
        example: "SELECT multiFuzzyMatchAny('123ab12cdef',2,['abcd']) =1"
      },
      {
        name: 'multiFuzzyMatchAnyIndex',
        title: 'multiFuzzyMatchAnyIndex(haystack, distance, [pattern1, pattern2, …, patternn])',
        description: 'The same as multiFuzzyMatchAny, but returns any index that matches the haystack within a constant edit distance.',
        example: "SELECT multiFuzzyMatchAnyIndex('111333444CN1CH',1,['abc','def','CNCH']) = 3"
      },
      {
        name: 'multiFuzzyMatchAllIndices',
        title: 'multiFuzzyMatchAllIndices(haystack, distance, [pattern1, pattern2, …, patternn])',
        description:
          'The same as multiFuzzyMatchAny, but returns the array of all indices in any order that match the haystack within a constant edit distance.'
      },
      {
        name: 'extract',
        title: 'extract(haystack, pattern)',
        description:
          'Extracts a fragment of a string using a regular expression. If ‘haystack’ doesn’t match the ‘pattern’ regex, an empty string is returned. If the regex doesn’t contain subpatterns, it takes the fragment that matches the entire regex. Otherwise, it takes the fragment that matches the first subpattern.',
        example: "SELECT extract('Hello World 12', '[a-z]+') = 'ello'"
      },
      {
        name: 'extractAll',
        title: 'extractAll(haystack, pattern)',
        description:
          'Extracts all the fragments of a string using a regular expression. If ‘haystack’ doesn’t match the ‘pattern’ regex, an empty string is returned. Returns an array of strings consisting of all matches to the regex. In general, the behavior is the same as the ‘extract’ function (it takes the first subpattern, or the entire expression if there isn’t a subpattern).',
        example: "SELECT extract('Hello World 12', '[a-z]+') = ['ello', 'orld']"
      },
      {
        name: 'extractAllGroupsHorizontal',
        title: 'extractAllGroupsHorizontal(haystack, pattern)',
        description:
          'Matches all groups of the haystack string using the pattern regular expression. Returns an array of arrays, where the first array includes all fragments matching the first group, the second array - matching the second group, etc.',
        example:
          "SELECT extractAllGroupsHorizontal('abc=111, def=222, ghi=333', '(\"[^\"]+\"|\\\\w+)=(\"[^\"]+\"|\\\\w+)')\n//[['abc','def','ghi'],['111','222','333']]"
      },
      {
        name: 'extractAllGroupsVertical',
        title: 'extractAllGroupsVertical(haystack, pattern)',
        description:
          'Matches all groups of the haystack string using the pattern regular expression. Returns an array of arrays, where each array includes matching fragments from every group. Fragments are grouped in order of appearance in the haystack.',
        example:
          "SELECT extractAllGroupsVertical('abc=111, def=222, ghi=333', '(\"[^\"]+\"|\\\\w+)=(\"[^\"]+\"|\\\\w+)')\n//[['abc','111'],['def','222'],['ghi','333']] "
      },
      {
        name: 'like',
        title: 'like(haystack, pattern),',
        description:
          'Checks whether a string matches a simple regular expression.The regular expression can contain the metasymbols `%` and `_`.`%` indicates any quantity of any bytes (including zero characters).',
        example: "SELECT like('a%b', '%')\n//1"
      },
      {
        name: 'notLike',
        title: 'notLike(haystack, pattern)',
        description: 'The same thing as ‘like’, but negative',
        example: "SELECT like('a%b', '%')\n//0"
      },
      {
        name: 'ilike',
        title: 'ilike(haystack,pattern)',
        description: 'Case insensitive variant of like function',
        example: "SELECT ilike('abc','__c')\n//1"
      },
      {
        name: 'ngramDistance',
        title: 'ngramDistance(haystack, needle)',
        description:
          'Calculates the 4-gram distance between haystack and needle: counts the symmetric difference between two multisets of 4-grams and normalizes it by the sum of their cardinalities',
        example: "SELECT ngramDistance('Hello World', 'ello')\n//0.78"
      },
      {
        name: 'ngramSearch',
        title: 'ngramSearch(haystack, needle)',
        description:
          'Same as ngramDistance but calculates the non-symmetric difference between needle and haystack – the number of n-grams from needle minus the common number of n-grams normalized by the number of needle n-grams. The closer to one, the more likely needle is in the haystack. Can be useful for fuzzy string search.',
        example: "SELECT ngramDistance('Hello World', 'ello')\n//0.78"
      },
      {
        name: 'countSubstrings',
        title: 'countSubstrings(haystack, needle[, start_pos])',
        description: 'Returns the number of substring occurrences.',
        example: "SELECT countSubstrings('aaaa', 'aa')\n//2"
      },
      {
        name: 'countSubstringsCaseInsensitive',
        title: 'countSubstringsCaseInsensitive(haystack, needle[, start_pos])',
        description: 'same as countSubstrings but case insensitive.',
        example: "SELECT countSubstringsCaseInsensitive('abc', 'Bc')\n//1"
      },
      {
        name: 'countSubstringsCaseInsensitiveUTF8',
        title: 'countSubstringsCaseInsensitiveUTF8(haystack, needle[, start_pos])',
        description: 'Returns the number of substring occurrences in UTF-8 case-insensitive.',
        example: "SELECT countSubstringsCaseInsensitiveUTF8('абв', 'A')\n//1"
      },
      {
        name: 'countMatches',
        title: 'countMatches(haystack, pattern)',
        description: 'Returns the number of regular expression matches for a pattern in a haystack.',
        example: "SELECT countMatches('foobar.com', 'o+')\n//2"
      }
    ],
    'Splitting and merging strings and arrays': [
      {
        name: 'splitByChar',
        title: 'splitByChar(separator, s[, max_substrings]))',
        description:
          'Splits a string into substrings separated by a specified character. It uses a constant string separator which consists of exactly one character. Returns an array of selected substrings. Empty substrings may be selected if the separator occurs at the beginning or end of the string, or if there are multiple consecutive separators.',
        example: "splitByChar(',', '1,2,3,abcde') = '1','2','3','abcde';"
      },
      {
        name: 'splitByString',
        title: 'splitByString(separator, s[, max_substrings]))',
        description:
          'Splits a string into substrings separated by a string. It uses a constant string separator of multiple characters as the separator. If the string separator is empty, it will split the string s into an array of single characters.',
        example: "splitByString('', 'abcde') = 'a','b','c','d','e';"
      },
      {
        name: 'arrayStringConcat',
        title: 'arrayStringConcat(arr[, separator])',
        description:
          'Concatenates string representations of values listed in the array with the separator. separator is an optional parameter: a constant string, set to an empty string by default. Returns the string.',
        example: "arrayStringConcat(['abc','123']) = abc123;"
      },
      {
        name: 'alphaTokens',
        title: 'alphaTokens(s[, max_substrings]))',
        description: 'Selects substrings of consecutive bytes from the ranges a-z and A-Z.Returns an array of substrings.',
        example: "alphaTokens('abca1abc') = 'abca','abc';"
      },
      {
        name: 'extractAllGroups',
        title: 'extractAllGroups(text, regexp)',
        description: 'Extracts all groups from non-overlapping substrings matched by a regular expression.',
        example: 'SELECT extractAllGroups(\'abc=123, 8="hkl"\', \'("[^"]+"|\\\\w+)=("[^"]+"|\\\\w+)\');'
      }
    ],
    String: [
      {
        name: 'empty',
        title: 'empty(string): int',
        description: 'Returns 1 for an empty string or 0 for a non-empty string.',
        example: "empty('HelloWorld') == 0"
      },
      {
        name: 'notEmpty',
        title: 'notEmpty(string): int',
        description: 'Returns 0 for an empty string or 1 for a non-empty string.',
        example: "notEmpty('Hello World') == 1"
      },
      {
        name: 'length',
        title: 'length(string): long',
        description: 'Returns the length of a string in bytes (not in characters, and not in code points).',
        example: "length('Hello World') == 11"
      },
      {
        name: 'lengthUTF8',
        title: 'lengthUTF8(string): long',
        description: 'Returns the length of a string in Unicode code points (not in characters).',
        example: "length('Hello World') == 11"
      },
      {
        name: 'char_length',
        title: 'char_length(string): long',
        description: 'Returns the length of a string in Unicode code points (not in characters)',
        example: "char_length('Hello World') == 11"
      },
      {
        name: 'character_length',
        title: 'character_length(string): long',
        description: 'Returns the length of a string in Unicode code points (not in characters).',
        example: "character_length('Hello World') == 11"
      },
      {
        name: 'leftPad',
        title: 'leftPad(string, int[, string]): string',
        description:
          'Pads the current string from the left with spaces or a specified string (multiple times, if needed) until the resulting string reaches the given length. Similarly to the MySQL LPAD function.',
        example: "leftPad('abc', 7, '*') == '****abc', leftPad('def', 7) == 'def'"
      },
      {
        name: 'leftPadUTF8',
        title: 'leftPadUTF8(string,int[, string])',
        description:
          'Pads the current string from the left with spaces or a specified string (multiple times, if needed) until the resulting string reaches the given length. Similarly to the MySQL LPAD function. While in the leftPad function the length is measured in bytes, here in the leftPadUTF8 function it is measured in code points.',
        example: "leftPadUTF8('абвг', 7, '*') == '***абвг', leftPadUTF8('дежз', 7) == 'дежз'"
      },
      {
        name: 'rightPad',
        title: 'rightPad(string, int[, string]): string',
        description:
          'Pads the current string from the right with spaces or a specified string (multiple times, if needed) until the resulting string reaches the given length. Similarly to the MySQL RPAD function.',
        example: "rightPad('abc', 7, '*') == 'abc****', rightPad('abc', 7) == 'abc'"
      },
      {
        name: 'rightPadUTF8',
        title: 'rightPadUTF8(string,int[, string])',
        description:
          'Pads the current string from the right with spaces or a specified string (multiple times, if needed) until the resulting string reaches the given length. Similarly to the MySQL RPAD function. While in the rightPad function the length is measured in bytes, here in the rightPadUTF8 function it is measured in code points.',
        example: "rightPadUTF8('абвг', 7, '*') == 'абвг***', rightPadUTF8('абвг', 7) == 'абвг'"
      },
      {
        name: 'lower',
        title: 'lower(string): string',
        description: 'Converts ASCII Latin symbols in a string to lowercase.',
        example: "lower('Hello World') == 'hello world'"
      },
      {
        name: 'lcase',
        title: 'lcase(string): string',
        description: 'Converts ASCII Latin symbols in a string to lowercase.',
        example: "lcase('Hello World') == 'hello world'"
      },
      {
        name: 'upper',
        title: 'upper(string): string',
        description: 'Converts ASCII Latin symbols in a string to uppercase.',
        example: "upper('Hello World') == HELLO WORLD"
      },
      {
        name: 'ucase',
        title: 'ucase(string): string',
        description: 'Converts ASCII Latin symbols in a string to uppercase.',
        example: "ucase('Hello World') == HELLO WORLD"
      },
      {
        name: 'lowerUTF8',
        title: 'lowerUTF8(string): string',
        description: 'Converts a string to lowercase, assuming the string contains a set of bytes that make up a UTF-8 encoded text.',
        example: "lowerUTF8('Hello World') == 'hello world'"
      },
      {
        name: 'upperUTF8',
        title: 'upperUTF8(string): string',
        description: 'Converts a string to uppercase, assuming the string contains a set of bytes that make up a UTF-8 encoded text.',
        example: "upperUTF8('Hello World') == HELLO WORLD"
      },
      {
        name: 'isValidUTF8',
        title: 'isValidUTF8(string): int',
        description: 'Returns 1, if the set of bytes is valid UTF-8 encoded, otherwise 0.'
      },
      {
        name: 'toValidUTF8',
        title: 'toValidUTF8(string): string',
        description:
          'Replaces invalid UTF-8 characters by the � (U+FFFD) character. All running in a row invalid characters are collapsed into the one replacement character.',
        example: "toValidUTF8('a����b') == 'a�b'"
      },
      {
        name: 'repeat',
        title: 'repeat(string, int)',
        description: 'Repeats a string as many times as specified and concatenates the replicated values as a single string',
        example: "repeat('abc',2) == abcabc"
      },
      {
        name: 'reverseUTF8',
        title: 'reverseUTF8(string): string',
        description:
          'Reverses a sequence of Unicode code points, assuming that the string contains a set of bytes representing a UTF-8 text. Otherwise, it does something else (it does not throw an exception).',
        example: "reverseUTF8('abcd1234') = 4321dcba"
      },
      {
        name: 'format',
        title: 'format(pattern, s0, s1, …)',
        description:
          'Formatting constant pattern with the string listed in the arguments. `pattern` is a simplified Python format pattern. Format string contains “replacement fields” surrounded by curly braces `{}`. Anything that is not contained in braces is considered literal text, which is copied unchanged to the output. If you need to include a brace character in the literal text, it can be escaped by doubling: `{{` and `}}`. Field names can be numbers (starting from zero) or empty (then they are treated as consequence numbers).',
        example: "format('{1} {0} {1}', 'World', 'Hello') = Hello World Hello"
      },
      {
        name: 'concat',
        title: 'concat(string1, string2, ...)',
        description: 'Concatenates the strings listed in the arguments, without a separator.',
        example: "concat('Hello',' ','World') = 'Hello World'"
      },
      {
        name: 'concatAssumeInjective',
        title: 'concatAssumeInjective(string1, string2, ...)',
        description:
          'Same as concat, the difference is that you need to ensure that concat(s1, s2, ...) → sn is injective, it will be used for optimization of GROUP BY. The function is named “injective” if it always returns different result for different values of arguments. In other words: different arguments never yield identical result.',
        example: 'SELECT concat(key1, key2), sum(value) FROM test.key_val GROUP BY concatAssumeInjective(key1, key2);'
      },
      {
        name: 'substring',
        title: 'substring(s, offset, length)',
        description:
          'Returns a substring starting with the byte from the ‘offset’ index that is ‘length’ bytes long. Character indexing starts from one . The ‘offset’ and ‘length’ arguments must be constants.',
        example: "substring('Hello World', 1, 5) == 'Hello'"
      },
      {
        name: 'mid',
        title: 'mid(s, offset, length)',
        description:
          'Returns a substring starting with the byte from the ‘offset’ index that is ‘length’ bytes long. Character indexing starts from one . The ‘offset’ and ‘length’ arguments must be constants.',
        example: "mid('Hello World', 1, 5) == 'Hello'"
      },
      {
        name: 'substr',
        title: 'substr(s, offset, length)',
        description:
          'Returns a substring starting with the byte from the ‘offset’ index that is ‘length’ bytes long. Character indexing starts from one . The ‘offset’ and ‘length’ arguments must be constants.',
        example: "substr('Hello World', 1, 5) == 'Hello'"
      },
      {
        name: 'substringUTF8',
        title: 'substringUTF8(s, offset, length)',
        description:
          'The same as ‘substring’, but for Unicode code points. Works under the assumption that the string contains a set of bytes representing a UTF-8 encoded text. If this assumption is not met, it returns some result (it does not throw an exception).',
        example: "substringUTF8('Hello CNCHH', 7, 4) = CNCH"
      },
      {
        name: 'appendTrailingCharIfAbsent',
        title: 'appendTrailingCharIfAbsent(s, c)',
        description: 'If the ‘s’ string is non-empty and does not contain the ‘c’ character at the end, it appends the ‘c’ character to the end.',
        example: "appendTrailingCharIfAbsent('string', 'c') == 'stringc'"
      },
      {
        name: 'convertCharset',
        title: 'convertCharset(s, from, to)',
        description: 'Returns the string ‘s’ that was converted from the encoding in ‘from’ to the encoding in ‘to’.',
        example: "convertCharset('data-insider', 'utf-8', 'utf-16') == '��data-insider'"
      },
      {
        name: 'TO_BASE64',
        title: 'TO_BASE64(s)',
        description: 'Encodes string into base64',
        example: "TO_BASE64('data-insider') == 'ZGF0YS1pbnNpZGVy'"
      },
      {
        name: 'base64Encode',
        title: 'base64Encode(s)',
        description: 'Encodes string into base64',
        example: "base64Encode('data-insider') == 'ZGF0YS1pbnNpZGVy'"
      },
      {
        name: 'base64Decode',
        title: 'base64Decode(s)',
        description: 'Decode base64-encoded string ‘s’ into original string. In case of failure raises an exception.',
        example: "base64Decode('ZGF0YS1pbnNpZGVy') == 'data-insider'"
      },
      {
        name: 'FROM_BASE64',
        title: 'FROM_BASE64(s)',
        description: 'Decode base64-encoded string ‘s’ into original string. In case of failure raises an exception.',
        example: "FROM_BASE64('ZGF0YS1pbnNpZGVy') == 'data-insider'"
      },
      {
        name: 'tryBase64Decode',
        title: 'tryBase64Decode(s)',
        description: 'Similar to base64Decode, but in case of error an empty string would be returned.',
        example: "tryBase64Decode('ZGF0YS1pbnNpZGVy') == 'data-insider'"
      },
      {
        name: 'endsWith',
        title: 'endsWith(s, suffix)',
        description: 'Returns whether to end with the specified suffix. Returns 1 if the string ends with the specified suffix, otherwise it returns 0.',
        example: "endsWith ('Data Insider', 'Insider') == 1"
      },
      {
        name: 'startsWith',
        title: 'startsWith(str, prefix)',
        description: 'Returns 1 whether string starts with the specified prefix, otherwise it returns 0.',
        example: "startsWith('Data Insider', 'Data') == 1"
      },
      {
        name: 'trim',
        title: 'trim([[LEADING|TRAILING|BOTH] trim_character FROM] input_string)',
        description:
          'Removes all specified characters from the start or end of a string.By default removes all consecutive occurrences of common whitespace (ASCII character 32) from both ends of a string.',
        example: "trim(BOTH ' ()' FROM '(   Hello, world!   )') = Hello, world!"
      },
      {
        name: 'trimLeft',
        title: 'trimLeft(input_string)',
        description:
          'Removes all consecutive occurrences of common whitespace (ASCII character 32) from the beginning of a string. It doesn’t remove other kinds of whitespace characters (tab, no-break space, etc.).',
        example: "trimLeft('     Hello, world!     ') == 'Hello, world!     '"
      },
      {
        name: 'trimRight',
        title: 'trimRight(input_string)',
        description:
          'Removes all consecutive occurrences of common whitespace (ASCII character 32) from the end of a string. It doesn’t remove other kinds of whitespace characters (tab, no-break space, etc.).',
        example: "trimRight('     Hello, world!     ') == '     Hello, world!'"
      },
      {
        name: 'trimBoth',
        title: 'trimBoth(input_string)',
        description:
          'Removes all consecutive occurrences of common whitespace (ASCII character 32) from the end of a string. It doesn’t remove other kinds of whitespace characters (tab, no-break space, etc.).',
        example: "trimBoth('     Hello, world!     ') == 'Hello, world!'"
      },
      {
        name: 'CRC32',
        title: 'CRC32(s)',
        description: 'Returns the CRC32 checksum of a string, using CRC-32-IEEE 802.3 polynomial and initial value 0xffffffff.',
        example: "CRC32 ('Data Insider') == 1716011347"
      },
      {
        name: 'CRC32IEEE',
        title: 'CRC32IEEE(s)',
        description: 'Returns the CRC32 checksum of a string, using CRC-32-IEEE 802.3 polynomial.',
        example: "CRC32IEEE ('Data Insider') == 496863036"
      },
      {
        name: 'CRC64',
        title: 'CRC64(s)',
        description: 'Returns the CRC64 checksum of a string, using CRC-64-ECMA polynomial.',
        example: "CRC64('Data Insider') == 8923905652228474000"
      },
      {
        name: 'normalizeQuery',
        title: 'normalizeQuery(s)',
        description: 'Replaces literals, sequences of literals and complex aliases with placeholders.',
        example: "normalizeQuery('[1, 2, 3, x]') == '[?.., x]'"
      },
      {
        name: 'normalizedQueryHash',
        title: 'normalizedQueryHash(string)',
        description: 'Returns identical 64bit hash values without the values of literals for similar queries. It helps to analyze query log.',
        example: "normalizedQueryHash('SELECT 1 AS `xyz`') == 8735023017302213000"
      },
      {
        name: 'normalizeUTF8NFC',
        title: 'normalizeUTF8NFC(string)',
        description: 'Converts a string to NFC normalized form, assuming the string contains a set of bytes that make up a UTF-8 encoded text.',
        example: "SELECT length('â'), normalizeUTF8NFC('â') AS nfc, length(nfc) AS nfc_len \n//2 â 2"
      },
      {
        name: 'normalizeUTF8NFD',
        title: 'normalizeUTF8NFD(string)',
        description: 'Converts a string to NFD normalized form, assuming the string contains a set of bytes that make up a UTF-8 encoded text.',
        example: "SELECT length('â'), normalizeUTF8NFD('â') AS nfd, length(nfd) AS nfd_len \n//2 â 3 "
      },
      {
        name: 'normalizeUTF8NFKC',
        title: 'normalizeUTF8NFKC(string)',
        description: 'Converts a string to NFKC normalized form, assuming the string contains a set of bytes that make up a UTF-8 encoded text.',
        example: "SELECT length('â'), normalizeUTF8NFKC('â') AS nfkc, length(nfkc) AS nfkc_len \n//2 â 2 "
      },
      {
        name: 'normalizeUTF8NFKD',
        title: 'normalizeUTF8NFKD(string)',
        description: 'Converts a string to NFKD normalized form, assuming the string contains a set of bytes that make up a UTF-8 encoded text.',
        example: "SELECT length('â'), normalizeUTF8NFKD('â') AS nfkd, length(nfkd) AS nfkd_len\n//2 â 3 "
      },
      {
        name: 'encodeXMLComponent',
        title: 'encodeXMLComponent(s)',
        description: 'Escapes characters to place string into XML text node or attribute.',
        example: 'SELECT encodeXMLComponent(\'Hello, "world"!\') \n//Hello, &quot;world&quot;!'
      },
      {
        name: 'decodeXMLComponent',
        title: 'decodeXMLComponent(s)',
        description:
          'Replaces XML predefined entities with characters. Predefined entities are &quot; &amp; &apos; &gt; &lt;This function also replaces numeric character references with Unicode characters. Both decimal (like &#10003;) and hexadecimal (&#x2713;) forms are supported.',
        example: 'SELECT decodeXMLComponent(\'Hello, &quot;world&quot;!\')\n//Hello, "world"!'
      },
      {
        name: 'extractTextFromHTML',
        title: 'extractTextFromHTML(htmlString)',
        description:
          'A function to extract text from HTML or XHTML. It does not necessarily 100% conform to any of the HTML, XML or XHTML standards, but the implementation is reasonably accurate and it is fast. The rules are the following: https://clickhouse.com/docs/en/sql-reference/functions/string-functions#extracttextfromhtml',
        example: "SELECT extractTextFromHTML(' <p> A text <i>with</i><b>tags</b>. <!-- comments --> </p> ')\n//A text with tags ."
      }
    ],
    Tuples: [
      {
        name: 'tuple',
        title: 'tuple(x, y, …)',
        description:
          'A function that allows grouping multiple columns. For columns with the types T1, T2, …, it returns a Tuple(T1, T2, …) type tuple containing these columns. There is no cost to execute the function. Tuples are normally used as intermediate values for an argument of IN operators, or for creating a list of formal parameters of lambda functions. Tuples can’t be written to a table.\nThe function implements the operator (x, y, …).',
        example: 'tuple(1, 2, 3);'
      },
      {
        name: 'tupleElement',
        title: 'tupleElement(tuple, n)',
        description:
          'A function that allows getting a column from a tuple. ‘N’ is the column index, starting from 1. ‘N’ must be a constant. ‘N’ must be a strict postive integer no greater than the size of the tuple. There is no cost to execute the function.\nThe function implements the operator x.N.',
        example: 'tupleElement((1, 2, 3(, 1))'
      },
      {
        name: 'untuple',
        title: 'untuple(x)',
        description: 'Performs syntactic substitution of tuple elements in the call location.',
        example: 'SELECT untuple(v6) FROM kv;'
      },
      {
        name: 'tupleHammingDistance',
        title: 'tupleHammingDistance(tuple1, tuple2)',
        description: 'Returns the Hamming Distance between two tuples of the same size.',
        example: 'SELECT tupleHammingDistance((1, 2, 3), (3, 2, 1)) AS HammingDistance;'
      }
    ],
    URLs: [
      {
        name: 'protocol',
        title: 'protocol(URL)',
        description: 'Extracts the protocol from a URL.\nExamples of typical returned values: http, https, ftp, mailto, tel, magnet…',
        example: "protocol('http://example.com') = http;"
      },
      {
        name: 'domain',
        title: 'domain(url)',
        description: 'Extracts the hostname from a URL.',
        example: "domain('svn+ssh://some.svn-hosting.com:80/repo/trunk') = some.svn-hosting.com;"
      },
      {
        name: 'domainWithoutWWW',
        title: 'domainWithoutWWW(url)',
        description: 'Returns the domain and removes no more than one ‘www.’ from the beginning of it, if present.',
        example: "domainWithoutWWW('http://www.example.com#fragment') = example.com;"
      },
      {
        name: 'topLevelDomain',
        title: 'topLevelDomain(url)',
        description: 'Extracts the the top-level domain from a URL.',
        example: "topLevelDomain('svn+ssh://www.some.svn-hosting.com:80/repo/trunk') = com;"
      },
      {
        name: 'firstSignificantSubdomain',
        title: 'firstSignificantSubdomain(URL)',
        description:
          'Returns the “first significant subdomain”. The first significant subdomain is a second-level domain if it is ‘com’, ‘net’, ‘org’, or ‘co’. Otherwise, it is a third-level domain.',
        example: "firstSignificantSubdomain('https://www.example.com.cn/') = example;"
      },
      {
        name: 'cutToFirstSignificantSubdomain',
        title: 'cutToFirstSignificantSubdomain(URL)',
        description: 'Returns the part of the domain that includes top-level subdomains up to the “first significant subdomain” (see the explanation above).',
        example: "cutToFirstSignificantSubdomain('https://www.example.com.cn/') = example.com.cn;"
      },
      {
        name: 'cutToFirstSignificantSubdomainWithWWW',
        title: 'cutToFirstSignificantSubdomainWithWWW(URL)',
        description: 'Returns the part of the domain that includes top-level subdomains up to the “first significant subdomain”, without stripping "www".',
        example: "cutToFirstSignificantSubdomain('https://news.clickhouse.com.tr/') = 'clickhouse.com.tr';"
      },
      {
        name: 'cutToFirstSignificantSubdomainCustom',
        title: 'cutToFirstSignificantSubdomain(URL, TLD)',
        description: 'Returns the part of the domain that includes top-level subdomains up to the first significant subdomain. Accepts custom TLD list name.',
        example: "SELECT cutToFirstSignificantSubdomainCustom('bar.foo.there-is-no-such-domain', 'public_suffix_list');"
      },
      {
        name: 'cutToFirstSignificantSubdomainCustomWithWWW',
        title: 'cutToFirstSignificantSubdomainCustomWithWWW(URL, TLD)',
        description:
          'Returns the part of the domain that includes top-level subdomains up to the first significant subdomain without stripping www. Accepts custom TLD list name.',
        example: "SELECT cutToFirstSignificantSubdomainCustomWithWWW('www.foo', 'public_suffix_list');"
      },
      {
        name: 'firstSignificantSubdomainCustom',
        title: 'firstSignificantSubdomainCustom(URL, TLD)',
        description: 'Returns the first significant subdomain. Accepts customs TLD list name.',
        example: "SELECT firstSignificantSubdomainCustom('bar.foo.there-is-no-such-domain', 'public_suffix_list');"
      },
      {
        name: 'port',
        title: 'port(URL[, default_port = 0])',
        description: 'Returns the port or default_port if there is no port in the URL (or in case of validation error).',
        example: "port('https://news.clickhouse.com.tr/')"
      },
      {
        name: 'path',
        title: 'path(URL)',
        description: 'Returns the path. The path does not include the query string.',
        example: "path('http://example.com/top/news.html') = /top/news.html;"
      },
      {
        name: 'pathFull',
        title: 'path(URL)',
        description: 'Returns the path. The path includes the query string.',
        example: "pathfull('http://example.com/top/news.html?page=2#comments') = /top/news.html?page=2#comments;"
      },
      {
        name: 'queryString',
        title: 'queryString(URL)',
        description: 'Returns the query string. query-string does not include the initial question mark, as well as # and everything after #.',
        example: "queryString('http://example.com/?page=1&lr=213') = page=1&lr=213;"
      },
      {
        name: 'fragment',
        title: 'fragment(URL)',
        description: 'Returns the fragment identifier. fragment does not include the initial hash symbol.',
        example: "fragment('http://example.com/?page=1&lr=213#fragment') = fragment;"
      },
      {
        name: 'queryStringAndFragment',
        title: 'queryStringAndFragment(URL)',
        description: 'Returns the query string and fragment identifier.',
        example: "queryStringAndFragment('http://example.com/?page=1&lr=213#fragment') = page=1&lr=213#fragment;"
      },
      {
        name: 'extractURLParameter',
        title: 'extractURLParameter(URL, name)',
        description:
          'Returns the value of the ‘name’ parameter in the URL, if present. Otherwise, an empty string. If there are many parameters with this name, it returns the first occurrence. This function works under the assumption that the parameter name is encoded in the URL exactly the same way as in the passed argument.',
        example: "extractURLParameter('http://example.com/?page=1&lr=213','page') = 1;"
      },
      {
        name: 'extractURLParameters',
        title: 'extractURLParameters(URL)',
        description: 'Returns an array of name=value strings corresponding to the URL parameters. The values are not decoded in any way.',
        example: "extractURLParameters('http://example.com/?page=1&lr=213') = 'page=1', 'lr=213';"
      },
      {
        name: 'extractURLParameterNames',
        title: 'extractURLParameterNames(URL)',
        description: 'Returns an array of name strings corresponding to the names of URL parameters. The values are not decoded in any way.',
        example: "extractURLParameterNames('http://example.com/?page=1&lr=213') = 'page', 'lr';"
      },
      {
        name: 'URLHierarchy',
        title: 'URLHierarchy(URL)',
        description:
          'Returns an array containing the URL, truncated at the end by the symbols /,? in the path and query-string. Consecutive separator characters are counted as one. The cut is made in the position after all the consecutive separator characters.',
        example: "SELECT URLHierarchy('https://example.com/browse/CONV-6788');"
      },
      {
        name: 'URLPathHierarchy',
        title: 'URLPathHierarchy(URL)',
        description:
          'Returns an array containing the URL, truncated at the end by the symbols /,? in the path and query-string. Consecutive separator characters are counted as one. The cut is made in the position after all the consecutive separator characters, but without the protocol and host in the result. The / element (root) is not included.',
        example: "SELECT URLPathHierarchy('https://example.com/browse/CONV-6788');"
      },
      {
        name: 'decodeURLComponent',
        title: 'decodeURLComponent(URL)',
        description: 'Returns the decoded URL.',
        example: "decodeURLComponent('http://127.0.0.1:8123/?query=SELECT%201%3B') AS DecodedURL = http://127.0.0.1:8123/?query=SELECT 1;;"
      },
      {
        name: 'netloc',
        title: 'netloc(URL)',
        description: 'Extracts network locality (username:password@host:port) from a URL',
        example: "netloc('http://paul@www.example.com:80/') = paul@www.example.com:80"
      },
      {
        name: 'cutWWW',
        title: 'cutWWW(URL)',
        description: 'Removes no more than one ‘www.’ from the beginning of the URL’s domain, if present.',
        example: "cutWWW('http://www.example.com/?page=1&lr=213') = http://example.com/?page=1&lr=213;"
      },
      {
        name: 'cutQueryString',
        title: 'cutQueryString(URL)',
        description: 'Removes query string. The question mark is also removed.',
        example: "cutQueryString('http://example.com/?page=1&lr=213') = http://example.com/;"
      },
      {
        name: 'cutFragment',
        title: 'cutFragment(URL)',
        description: 'Removes the fragment identifier. The number sign is also removed.',
        example: "SELECT cutFragment('http://example.com#fragment') = http://example.com;"
      },
      {
        name: 'cutQueryStringAndFragment',
        title: 'cutQueryStringAndFragment(URL)',
        description: 'Removes the query string and fragment identifier. The question mark and number sign are also removed.',
        example: "cutQueryStringAndFragment('http://example.com/?page=1&lr=213#fragment') = http://example.com/;"
      },
      {
        name: 'cutURLParameter',
        title: 'cutURLParameter(URL, name)',
        description:
          'Removes the name parameter from URL, if present. This function does not encode or decode characters in parameter names, e.g. Client ID and Client%20ID are treated as different parameter names.',
        example: "SELECT\n    cutURLParameter('http://bigmir.net/?a=b&c=d&e=f#g', 'a') as url_without_a;"
      }
    ],
    UUID: [
      {
        name: 'generateUUIDv4',
        title: 'generateUUIDv4([x])',
        description: 'Generates the UUID of version 4.',
        example: 'CREATE TABLE t_uuid (x UUID) ENGINE=TinyLog\nINSERT INTO t_uuid SELECT generateUUIDv4()\nSELECT * FROM t_uuid'
      },
      {
        name: 'toUUID',
        title: 'toUUID(String)',
        description: 'Converts String type value to UUID type.',
        example: "SELECT toUUID('61f0c404-5cb3-11e7-907b-a6006ad3dba0') AS uuid"
      },
      {
        name: 'toUUIDOrNull',
        title: 'toUUIDOrNull(String)',
        description: 'It takes an argument of type String and tries to parse it into UUID. If failed, returns NULL.',
        example: "SELECT toUUIDOrNull('61f0c404-5cb3-11e7-907b-a6006ad3dba0T') AS uuid"
      },
      {
        name: 'toUUIDOrZero',
        title: 'toUUIDOrZero(String)',
        description: 'It takes an argument of type String and tries to parse it into UUID. If failed, returns zero UUID.',
        example: "SELECT toUUIDOrZero('61f0c404-5cb3-11e7-907b-a6006ad3dba0T') AS uuid"
      },
      {
        name: 'UUIDStringToNum',
        title: 'UUIDStringToNum(string[, variant = 1])',
        description:
          'Accepts string containing 36 characters in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, and returns a FixedString(16) as its binary representation, with its format optionally specified by variant (Big-endian by default).',
        example: "SELECT\n    '612f3c40-5d3b-217e-707b-6a546a3d7b29' AS uuid,\n    UUIDStringToNum(uuid) AS bytes"
      },
      {
        name: 'UUIDNumToString',
        title: 'UUIDNumToString(binary[, variant = 1])',
        description:
          'Accepts binary containing a binary representation of a UUID, with its format optionally specified by variant (Big-endian by default), and returns a string containing 36 characters in text format.',
        example: "SELECT\n    'a/<@];!~p{jTj={)' AS bytes,\n    UUIDNumToString(toFixedString(bytes, 16)) AS uuid;"
      }
    ],
    'Working with maps': [
      {
        name: 'map',
        title: 'map(key1, value1[, key2, value2, ...])',
        description: 'Arranges key:value pairs into Map(key, value) data type.',
        example: "SELECT map('key1', number, 'key2', number * 2) FROM numbers(3);"
      },
      {
        name: 'mapAdd',
        title: 'mapAdd(arg1, arg2 [, ...])',
        description: 'Collects all the keys and sum corresponding values.',
        example: 'SELECT mapAdd(([toUInt8(1), 2], [1, 1]), ([toUInt8(1), 2], [1, 1])) as res, toTypeName(res) as type;'
      },
      {
        name: 'mapSubtract',
        title: 'mapSubtract(Tuple(Array, Array), Tuple(Array, Array) [, ...])',
        description: 'Collects all the keys and subtract corresponding values.',
        example: 'SELECT mapSubtract(([toUInt8(1), 2], [toInt32(1), 1]), ([toUInt8(1), 2], [toInt32(2), 1])) as res, toTypeName(res) as type;'
      },
      {
        name: 'mapPopulateSeries',
        title: 'mapPopulateSeries(map[, max])',
        description:
          'Fills missing keys in the maps (key and value array pair), where keys are integers. Also, it supports specifying the max key, which is used to extend the keys array.',
        example: 'SELECT mapPopulateSeries(map(1, 10, 5, 20), 6);'
      },
      {
        name: 'mapContains',
        title: 'mapContains(map, key)',
        description: 'Determines whether the map contains the key parameter.',
        example: "SELECT mapContains(a, 'name') FROM test;"
      },
      {
        name: 'mapKeys',
        title: 'mapKeys(map)',
        description: 'Returns all keys from the map parameter.',
        example: 'SELECT mapKeys(a) FROM test;'
      },
      {
        name: 'mapValues',
        title: 'mapValues(map)',
        description: 'Returns all values from the map parameter.',
        example: 'SELECT mapValues(a) FROM test;'
      }
    ]
  }
});
