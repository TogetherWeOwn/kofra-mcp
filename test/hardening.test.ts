import type { Client } from '@modelcontextprotocol/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { stripControls } from '../src/sanitize';
import { search } from '../src/search';
import { unsanitisedStrings } from '../tools/generate.mjs';
import { BASE, call, connect, type Era } from './helpers';

const INIT = JSON.stringify({
	jsonrpc: '2.0',
	id: 1,
	method: 'initialize',
	params: {
		protocolVersion: '2025-06-18',
		capabilities: {},
		clientInfo: { name: 'raw', version: '0' }
	}
});
const MCP_HEADERS = {
	'Content-Type': 'application/json',
	Accept: 'application/json, text/event-stream'
};

describe('search over inherited property names', () => {
	it('treats Object.prototype names as ordinary words', () => {
		for (const q of ['constructor', '__proto__', 'toString hasOwnProperty']) {
			expect(() => search(q, 5), q).not.toThrow();
		}
		expect(search('constructor', 5).total).toBe(0);
		const mixed = search('constructor bucket', 5);
		expect(mixed.total).toBe(search('bucket', 5).total);
		expect(mixed.hits.map((h) => h.page.slug)).toEqual(
			search('bucket', 5).hits.map((h) => h.page.slug)
		);
	});

	for (const era of ['modern', 'legacy'] as Era[]) {
		describe(`docs_search, ${era} era`, () => {
			let client: Client;
			beforeAll(async () => {
				client = await connect(era);
			});
			afterAll(async () => {
				await client.close();
			});

			it('answers "constructor" and "constructor bucket" without an error', async () => {
				const empty = (await client.callTool({
					name: 'docs_search',
					arguments: { query: 'constructor' }
				})) as { isError?: boolean; structuredContent?: { total: number } };
				expect(empty.isError ?? false).toBe(false);
				expect(empty.structuredContent?.total).toBe(0);
				const mixed = (await client.callTool({
					name: 'docs_search',
					arguments: { query: 'constructor bucket' }
				})) as { isError?: boolean; structuredContent?: { total: number } };
				expect(mixed.isError ?? false).toBe(false);
				expect(mixed.structuredContent?.total).toBeGreaterThan(0);
			});
		});
	}
});

describe('stripControls, invisible and formatting characters', () => {
	it('removes tag characters, zero-width and other invisible format characters', () => {
		const tags = String.fromCodePoint(0xe0001, 0xe0068, 0xe0069, 0xe007f);
		expect(stripControls(`a${tags}b`)).toBe('ab');
		expect(stripControls('a​b‌c‍d‎e‏f')).toBe('abcdef');
		expect(stripControls('a⁠b⁡c⁢d⁣e⁤f')).toBe('abcdef');
		expect(stripControls('﻿a­b')).toBe('ab');
		expect(stripControls('a b c')).toBe('abc');
	});

	it('keeps ordinary non-ASCII text, including astral characters', () => {
		const t = 'café 日本 \u{1F600} 𝒳';
		expect(stripControls(t)).toBe(t);
	});
});

describe('stripControls, unterminated strings', () => {
	it('removes an unterminated OSC or DCS payload up to the end of its line', () => {
		expect(stripControls('a\u001b]0;evil title')).toBe('a');
		expect(stripControls('a\u001b]0;evil\nnext')).toBe('a\nnext');
		expect(stripControls('a\u001bPq#0;payload\nz')).toBe('a\nz');
		expect(stripControls('a\u009dpayload\nz')).toBe('a\nz');
		// An unterminated string ends where the next sequence begins.
		expect(stripControls('a\u001b]0;one\u001b[31mred')).toBe('ared');
	});

	it('strips a 1 MiB unterminated introducer quickly and completely', () => {
		const big = `start\u001b]${'x'.repeat(1024 * 1024)}`;
		const t0 = performance.now();
		const out = stripControls(big);
		const ms = performance.now() - t0;
		expect(out).toBe('start');
		expect(ms).toBeLessThan(500);
		const many = `${'\u001b]x'.repeat(100_000)}end`;
		const t1 = performance.now();
		expect(stripControls(many)).toBe('');
		expect(performance.now() - t1).toBeLessThan(500);
	});
});

describe('build-time sanitising check', () => {
	const clean = {
		pages: [{ slug: 'a', title: 'A', description: 'd', text: '# A\n\ntext\tcell\n' }],
		errors: [{ code: 'x', hint: 'fine' }],
		openapi: JSON.stringify({ info: { title: 'ok' } })
	};

	it('accepts the committed bundle', () => {
		expect(unsanitisedStrings(content)).toEqual([]);
	});

	it('accepts clean input', () => {
		expect(unsanitisedStrings(clean)).toEqual([]);
	});

	it('names every field that differs from its sanitised form', () => {
		const bad = {
			pages: [
				{ slug: 'a', title: 'A​', description: 'd', text: '# A\n' },
				{ slug: 'b', title: 'B', description: 'd\u001b[31m', text: '# B\n‮' }
			],
			errors: [{ code: 'x', hint: 'h\u0007', nested: { detail: 'y﻿' } }],
			openapi: JSON.stringify({ info: { description: 'z ' }, paths: { '/­': {} } })
		};
		expect(unsanitisedStrings(bad)).toEqual([
			'pages[a].title',
			'pages[b].description',
			'pages[b].text',
			'errors[0].hint',
			'errors[0].nested.detail',
			'openapi.info.description',
			'openapi.paths key "/­"'
		]);
	});
});

describe('Cache-Control', () => {
	it('is public only on successful static responses', async () => {
		for (const path of [
			'/',
			'/robots.txt',
			'/llms.txt',
			'/.well-known/mcp.json',
			'/docs/overview.md'
		]) {
			const res = await call(path);
			expect(res.status, path).toBe(200);
			expect(res.headers.get('Cache-Control'), path).toBe('public, max-age=3600');
			await res.body?.cancel();
		}
	});

	it('is no-store on 403, 404, 405 and MCP errors', async () => {
		const cases: [string, RequestInit | undefined, number][] = [
			['/nope', undefined, 404],
			['/docs/no-such-page.md', undefined, 404],
			['/robots.txt', { method: 'POST' }, 405],
			[
				'/docs',
				{ method: 'POST', headers: { ...MCP_HEADERS, Origin: 'https://evil.example' }, body: INIT },
				403
			],
			['/docs', { method: 'POST', headers: MCP_HEADERS, body: '{not json' }, 400]
		];
		for (const [path, init, status] of cases) {
			const res = await call(path, init);
			expect(res.status, path).toBe(status);
			expect(res.headers.get('Cache-Control'), `${init?.method ?? 'GET'} ${path}`).toBe('no-store');
			await res.body?.cancel();
		}
	});
});

describe('Origin, exact match', () => {
	const post = (url: string, origin: string) =>
		call(url, { method: 'POST', headers: { ...MCP_HEADERS, Origin: origin }, body: INIT });
	const REMOTE = 'https://kofra-mcp-docs.example.workers.dev/docs';

	it('refuses an allow-listed hostname over plain http or on another port', async () => {
		for (const origin of ['http://kofra.app', 'https://kofra.app:8443', 'https://KOFRA.app.']) {
			const res = await post('/docs', origin);
			expect(res.status, origin).toBe(403);
			await res.body?.cancel();
		}
	});

	it('refuses local origins when the server itself is not local', async () => {
		for (const origin of ['http://localhost:6274', 'http://127.0.0.1:6274', 'http://[::1]:6274']) {
			const res = await post(REMOTE, origin);
			expect(res.status, origin).toBe(403);
			await res.body?.cancel();
		}
	});

	it('echoes the accepted origin in Access-Control-Allow-Origin, never *', async () => {
		for (const origin of ['https://kofra.app', 'http://localhost:6274']) {
			const res = await post(`${BASE}/docs`, origin);
			expect(res.status, origin).toBe(200);
			expect(res.headers.get('Access-Control-Allow-Origin'), origin).toBe(origin);
			expect(res.headers.get('Vary') ?? '', origin).toMatch(/Origin/);
			await res.body?.cancel();
		}
		const pre = await call('/docs', {
			method: 'OPTIONS',
			headers: { Origin: 'https://console.kofra.app', 'Access-Control-Request-Method': 'POST' }
		});
		expect(pre.headers.get('Access-Control-Allow-Origin')).toBe('https://console.kofra.app');
		const none = await call('/docs', { method: 'POST', headers: MCP_HEADERS, body: INIT });
		expect(none.status).toBe(200);
		expect(none.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
		await none.body?.cancel();
	});
});
