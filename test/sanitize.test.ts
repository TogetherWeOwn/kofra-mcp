import { describe, expect, it } from 'vitest';
import { capUtf8, stripControls } from '../src/sanitize';

describe('stripControls', () => {
	it('removes terminal escape sequences', () => {
		expect(stripControls('a\u001b[31mred\u001b[0m b')).toBe('ared b');
		expect(stripControls('x\u001b]8;;https://e.example\u0007link\u001b]8;;\u0007y')).toBe('xlinky');
		expect(stripControls('t\u001b]0;title\u001b\\u')).toBe('tu');
		expect(stripControls('\u009b2Jz')).toBe('z');
		expect(stripControls('a\u001bcb')).toBe('ab');
	});

	it('removes control and bidi characters but keeps tabs and newlines', () => {
		expect(stripControls('a\u0000b\u0007c\u007fd\u0085e')).toBe('abcde');
		expect(stripControls('l‮evil‬r ⁦i⁩')).toBe('levilr i');
		expect(stripControls('one\ttwo\nthree\r\nfour\rfive')).toBe('one\ttwo\nthree\nfourfive');
	});

	it('leaves ordinary text alone', () => {
		const t = '# Title\n\n`code` | table | ✓ café 日本';
		expect(stripControls(t)).toBe(t);
	});
});

describe('capUtf8', () => {
	it('returns short text unchanged', () => {
		expect(capUtf8('abc', 3)).toEqual({ text: 'abc', truncated: false });
	});

	it('cuts at the byte limit without splitting a character', () => {
		// "é" is 2 bytes, "日" is 3 bytes.
		expect(capUtf8('aé', 2)).toEqual({ text: 'a', truncated: true });
		expect(capUtf8('a日b', 3)).toEqual({ text: 'a', truncated: true });
		expect(capUtf8('a日b', 4)).toEqual({ text: 'a日', truncated: true });
		const big = 'x'.repeat(1024 * 1024 + 5);
		const capped = capUtf8(big, 1024 * 1024);
		expect(capped.truncated).toBe(true);
		expect(capped.text.length).toBe(1024 * 1024);
	});
});
