import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
    ignores: ['dist/**'],
    files: ['**/*.ts', 'fastify-request.d.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
        parserOptions: {
            project: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
});
