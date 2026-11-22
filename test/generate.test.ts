import { describe, expect, it } from 'vitest';
import { cell } from '../tools/generate.mjs';

describe('generated Markdown table cells', () => {
	it('escapes literal backslashes before escaping pipes', () => {
		expect(cell(String.raw`left\|right | path\name`)).toBe(String.raw`left\\\|right \| path\\name`);
	});
});
