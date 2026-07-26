// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Guard against the Zustand v5 footgun: a selector that returns a freshly
    // built reference on every call makes useSyncExternalStore loop forever
    // ("Maximum update depth exceeded"). Heuristic — select raw state and
    // derive with useMemo, or read imperatively via getState().
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.name=/Store$/] > ArrowFunctionExpression > ArrayExpression',
          message:
            'Zustand selector returns a NEW array every render -> infinite re-render. Select raw state and derive with useMemo.',
        },
        {
          selector:
            'CallExpression[callee.name=/Store$/] > ArrowFunctionExpression > ObjectExpression',
          message:
            'Zustand selector returns a NEW object every render -> infinite re-render. Select fields individually or wrap with useShallow.',
        },
        {
          selector:
            'CallExpression[callee.name=/Store$/] > ArrowFunctionExpression > CallExpression[callee.property.name=/^(get[A-Z].*|map|filter|slice|sort|concat|flatMap|reverse|splice)$/]',
          message:
            'Zustand selector calls a method that allocates a new value each render -> infinite re-render. Select raw state and derive with useMemo, or call it via useAppStore.getState().',
        },
      ],
    },
  },
]);
