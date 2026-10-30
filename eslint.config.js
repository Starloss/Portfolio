import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const files = ['**/*.{ts,tsx}'];
const ignores = ['dist', 'build', 'coverage', 'node_modules'];
const reactRecommended = eslintReact.configs['recommended-typescript'];

export default [
  {
    files,
    ignores,
    ...reactRecommended,
    rules: {
      ...reactRecommended.rules,
      // Las reglas de hooks y del React Compiler las lleva react-hooks; estas son sus copias.
      // set-state-in-effect se queda: ve el setState dentro de un listener que el efecto llama
      // al montar (así encontró el scroll del header), y la de react-hooks no.
      '@eslint-react/error-boundaries': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/set-state-in-render': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/unsupported-syntax': 'off',
      '@eslint-react/use-memo': 'off',
      // No vienen en recommended; eslint-plugin-react las aplicaba.
      '@eslint-react/dom-no-unsafe-target-blank': 'error',
      '@eslint-react/dom-no-unknown-property': 'error',
    },
  },
  {
    files,
    ignores,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        // Browser globals (subset)
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        Node: 'readonly',
        MouseEvent: 'readonly',
        // ES2021 globals (subset)
        Promise: 'readonly',
        Symbol: 'readonly',
        BigInt: 'readonly',
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      'react-hooks': pluginReactHooks,
      '@typescript-eslint': ts,
      prettier: prettierPlugin,
      'import-x': importPlugin,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Reglas de hooks de React 19, incluidas las del React Compiler (pureza, refs, efectos).
      ...pluginReactHooks.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      // TypeScript ya detecta identificadores indefinidos; la lista fija de globals no cubre DOM ni Node.
      'no-undef': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
