import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { ROBOTS_HEADER_VALUE } from '../src/app';
import { BASE, call, connect } from './helpers';

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

describe('HTTP routes', () => {
	it('sets X-Robots-Tag: noindex on every route, status and method', async () => {
		const requests: [string, RequestInit?][] = [
			['/'],
			['/robots.txt'],
			['/llms.txt'],
			['/.well-known/mcp.json'],
			['/docs/overview.md'],
			['/docs/errors/bucket_not_found.md'],
			['/docs/no-such-page.md'],
			['/no-such-route'],
			['/robots.txt', { method: 'HEAD' }],
			['/robots.txt', { method: 'POST' }],
			['/docs', { method: 'GET' }],
			['/docs', { method: 'OPTIONS' }],
			['/docs', { method: 'POST', headers: MCP_HEADERS, body: INIT }],
			[
				'/docs',
				{ method: 'POST', headers: { ...MCP_HEADERS, Origin: 'https://evil.example' }, body: INIT }
			],
			['/docs', { method: 'POST', headers: MCP_HEADERS, body: '{not json' }]
		];
		const statuses = new Set<number>();
		for (const [path, init] of requests) {
			const res = await call(path, init);
			statuses.add(res.status);
			expect(res.headers.get('X-Robots-Tag'), `${init?.method ?? 'GET'} ${path}`).toBe(
				ROBOTS_HEADER_VALUE
			);
			await res.body?.cancel();
		}
		// The list above covers successes, client errors and refusals.
		expect([...statuses].filter((s) => s >= 400).length).toBeGreaterThanOrEqual(3);
	});

	it('serves robots.txt that disallows everything', async () => {
		const res = await call('/robots.txt');
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
		expect(await res.text()).toBe('User-agent: *\nDisallow: /\n');
	});

	it('serves /.well-known/mcp.json naming only the docs endpoint, on this origin', async () => {
		const res = await call('/.well-known/mcp.json');
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
		const doc = (await res.json()) as { servers: Record<string, unknown>[] };
		expect(doc.servers).toHaveLength(1);
		expect(doc.servers[0]).toMatchObject({
			name: 'kofra-docs',
			url: `${BASE}/docs`,
			transport: 'streamable-http',
			authentication: 'none'
		});
	});

	it('serves llms.txt with a Markdown link to every docs page, and the pages themselves', async () => {
		const res = await call('/llms.txt');
		const text = await res.text();
		expect(text).toMatch(/^# Kofra documentation\n/);
		for (const p of content.pages) expect(text).toContain(`](${BASE}/docs/${p.slug}.md)`);
		expect(text).not.toContain(content.publicBase);

		const page = await call('/docs/errors/bucket_not_found.md');
		expect(page.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
		expect(await page.text()).toMatch(/^# Bucket not found/);
		expect((await call('/docs/no-such-page.md')).status).toBe(404);
	});

	it('answers HEAD without a body and refuses other methods on static routes', async () => {
		const head = await call('/llms.txt', { method: 'HEAD' });
		expect(head.status).toBe(200);
		expect(await head.text()).toBe('');
		const post = await call('/llms.txt', { method: 'POST' });
		expect(post.status).toBe(405);
		expect(post.headers.get('Allow')).toBe('GET, HEAD');
	});
});

describe('Origin validation on the MCP endpoint', () => {
	const post = (origin?: string) =>
		call('/docs', {
			method: 'POST',
			headers: origin ? { ...MCP_HEADERS, Origin: origin } : MCP_HEADERS,
			body: INIT
		});

	it('accepts a request without Origin (non-browser clients)', async () => {
		const res = await post();
		expect(res.status).toBe(200);
		await res.body?.cancel();
	});

	it('accepts allow-listed browser origins', async () => {
		for (const origin of [
			'https://kofra.app',
			'https://console.kofra.app',
			'http://localhost:6274'
		]) {
			const res = await post(origin);
			expect(res.status, origin).toBe(200);
			await res.body?.cancel();
		}
	});

	it('refuses cross-origin browser requests and malformed origins with 403', async () => {
		for (const origin of [
			'https://evil.example',
			'https://kofra.app.evil.example',
			'https://evilkofra.app',
			'null',
			'file://'
		]) {
			const res = await post(origin);
			expect(res.status, origin).toBe(403);
			await res.body?.cancel();
		}
	});
});

describe('Cache hints (2026-07-28)', () => {
	it('marks resource reads and lists as public for one hour', async () => {
		const bodies: string[] = [];
		const client = await connect('modern', bodies);
		await client.readResource({ uri: 'kofra://openapi' });
		await client.listTools();
		await client.close();
		const results = bodies
			.filter((b) => b.trim().startsWith('{'))
			.map((b) => JSON.parse(b).result)
			.filter((r) => r && 'ttlMs' in r);
		expect(results.length).toBeGreaterThanOrEqual(2);
		for (const r of results) expect(r).toMatchObject({ ttlMs: 3600000, cacheScope: 'public' });
	});
});
