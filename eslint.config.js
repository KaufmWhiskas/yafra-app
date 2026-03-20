import expo from 'eslint-config-expo';
import prettier from 'eslint-config-prettier';

export default [
  ...expo,
  prettier,
  {
    // Tell ESLint not to worry about Jest commands in test files
    files: ['**/*.test.js', '__tests__/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
];
