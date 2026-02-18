const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');
const importPlugin = require('eslint-plugin-import');
const sonarjs = require('eslint-plugin-sonarjs');

module.exports = tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            import: importPlugin,
            sonarjs,
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.mocha,
                chrome: 'writable',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',

            // Some legacy reducers use declarations within switch/case blocks.
            'no-case-declarations': 'off',

            // Not enforced during this refactor pass.
            '@typescript-eslint/no-wrapper-object-types': 'off',

            // Keep lint stable for legacy fixtures/older code.
            'no-undef': 'off',
            'no-extra-boolean-cast': 'off',
            'no-useless-catch': 'off',
            'prefer-spread': 'off',
            'prefer-const': 'off',

            'no-console': 'warn',
        },
    },
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.turbo/**',
            '**/coverage/**',
            '**/.nyc_output/**',
            '**/.coverage/**',
            '**/c8-cov/**',
            'docs/**',
            'utils/**',
            'scripts/**',
            'packages/devtool-frontend/**',
            'packages/devtool-extension/**',
            'packages/e2e-test-app/**',
            'packages/download-collector-crx/**',
        ],
    },
);
