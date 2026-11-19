import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

const CONTENT_ID = '\0kofra-content-text';

export default defineConfig({
	plugins: [
		{
			// Mirror wrangler's Text rule: generated/content.json is imported as a string.
			name: 'kofra-content-as-text',
			enforce: 'pre',
			resolveId(source) {
				return source.endsWith('/generated/content.json') ? CONTENT_ID : null;
			},
			load(id) {
				if (id !== CONTENT_ID) return null;
				const text = readFileSync(join(import.meta.dirname, 'generated', 'content.json'), 'utf8');
				return `export default ${JSON.stringify(text)};`;
			}
		}
	],
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'node'
	}
});
