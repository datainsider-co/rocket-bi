module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    jquery: true
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/typescript/recommended', '@vue/prettier', '@vue/prettier/@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'error',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    'max-len': ['warn', { code: 200 }],
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-constant-condition': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/camelcase': 'off'
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        mocha: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['**/*.js', '**/*.worker.ts', '**/workers/**/*.ts'],
      rules: {
        'no-var': 'off',
        'no-fallthrough': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['**/shared/**/Icon/*.vue'],
      rules: {
        'max-length': 'off'
      }
    }
  ]
};
