import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config({ ignores: ['dist', '.agents', '.claude', '.impeccable', 'design-system', '.github/skills', 'mobile'] }, js.configs.recommended, ...tseslint.configs.recommended, { languageOptions: { globals: globals.browser } });
