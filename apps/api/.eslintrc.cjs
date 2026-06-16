/* ESLint config for the API package (Node + TypeScript, ESM).
 * Mirrors the project's hard rules from AGENTS.md — notably: no `any`. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', 'pglite-data/', '*.config.ts'],
  rules: {
    // AGENTS.md forbids `any` — enforce it as an error, not a warning.
    '@typescript-eslint/no-explicit-any': 'error',
    // Allow intentionally-unused args/vars when prefixed with `_`.
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
  },
  overrides: [
    {
      // Test files lean on mocks/fixtures; relax the strictest rules there.
      files: ['tests/**/*.ts', '**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
