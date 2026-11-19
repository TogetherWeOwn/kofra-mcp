import type { Client } from '@modelcontextprotocol/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { MAX_RESULTS, TEXT_UNKNOWN_SLUG } from '../src/server';
import { connect, type Era } from './helpers';

const READ_ONLY = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

type ToolResult = {
	isError?: boolean;
	content: { type: string; text?: string }[];
	structuredContent?: Record<string, unknown>;
};

for (const era of ['modern', 'legacy'] as Era[]) {
	describe(`MCP over the ${era} protocol era`, () => {
		let client: Client;
		const tool = (name: string, args: Record<string, unknown>) =>
			client.callTool({ name, arguments: args }) as Promise<ToolResult>;

		beforeAll(async () => {
			client = await connect(era);
		});
		afterAll(async () => {
			await client.close();
		});

		it('negotiates the expected era', () => {
			expect(client.getProtocolEra()).toBe(era);
			if (era === 'modern') expect(client.getNegotiatedProtocolVersion()).toBe('2026-07-28');
		});

		it('lists exactly two tools, in a fixed order, with schemas and read-only annotations', async () => {
			const { tools } = await client.listTools();
			expect(tools.map((t) => t.name)).toEqual(['docs_search', 'docs_read']);
			for (const t of tools) {
				expect(t.description).toMatch(/Read-only; uses no account data\.$/);
				expect(t.inputSchema.type).toBe('object');
				expect(t.outputSchema?.type).toBe('object');
				expect(t.annotations).toMatchObject(READ_ONLY);
			}
			const [search, read] = tools;
			expect(Object.keys(search?.inputSchema.properties ?? {})).toEqual(['query', 'limit']);
			expect(search?.inputSchema.required).toEqual(['query']);
			expect(search?.inputSchema.properties?.limit).toMatchObject({
				minimum: 1,
				maximum: MAX_RESULTS
			});
			expect(read?.inputSchema.required).toEqual(['slug']);
			// The same list twice: nothing in it depends on the request.
			expect((await client.listTools()).tools).toEqual(tools);
		});

		it('docs_search ranks the page about the thing first', async () => {
			const cases: [string, string][] = [
				['bucket not found', 'errors/bucket_not_found'],
				['bucket_not_found', 'errors/bucket_not_found'],
				['create a bucket', 'api/buckets.create'],
				['revoke access key', 'api/keys.revoke'],
				['connect claude mcp', 'ai-agents'],
				['idempotency key reused', 'errors/idempotency_key_reused']
			];
			for (const [query, slug] of cases) {
				const r = await tool('docs_search', { query });
				expect(r.isError ?? false, query).toBe(false);
				const results = r.structuredContent?.results as { slug: string }[];
				expect(results[0]?.slug, query).toBe(slug);
			}
		});

		it('docs_search returns slug, title, uri and snippet, honours limit and is deterministic', async () => {
			const r = await tool('docs_search', { query: 'bucket', limit: 3 });
			const sc = r.structuredContent as {
				results: { slug: string; title: string; uri: string; snippet: string; score: number }[];
				total: number;
			};
			expect(sc.results).toHaveLength(3);
			expect(sc.total).toBeGreaterThan(3);
			for (const hit of sc.results) {
				expect(hit.uri).toBe(`kofra://docs/${hit.slug}`);
				expect(hit.title.length).toBeGreaterThan(0);
				expect(hit.snippet.length).toBeGreaterThan(0);
				expect(hit.snippet.length).toBeLessThanOrEqual(240);
			}
			const scores = sc.results.map((h) => h.score);
			expect([...scores].sort((a, b) => b - a)).toEqual(scores);
			expect((await tool('docs_search', { query: 'bucket', limit: 3 })).structuredContent).toEqual(
				sc
			);
			expect(r.content[0]?.text).toContain(`(slug: ${sc.results[0]?.slug})`);

			const all = await tool('docs_search', { query: 'error' });
			expect((all.structuredContent?.results as unknown[]).length).toBe(5);
			const max = await tool('docs_search', { query: 'error', limit: MAX_RESULTS });
			expect((max.structuredContent?.results as unknown[]).length).toBe(MAX_RESULTS);
		});

		it('docs_search refuses a limit above the cap and answers no match with an empty list', async () => {
			const tooMany = await tool('docs_search', { query: 'bucket', limit: MAX_RESULTS + 1 });
			expect(tooMany.isError).toBe(true);
			const none = await tool('docs_search', { query: 'zzqqxxnomatch' });
			expect(none.isError ?? false).toBe(false);
			expect(none.structuredContent).toEqual({ results: [], total: 0 });
		});

		it('docs_read returns a real error page as Markdown', async () => {
			const r = await tool('docs_read', { slug: 'errors/bucket_not_found' });
			expect(r.isError ?? false).toBe(false);
			expect(r.structuredContent).toMatchObject({
				slug: 'errors/bucket_not_found',
				title: 'Bucket not found',
				uri: 'kofra://docs/errors/bucket_not_found',
				mimeType: 'text/markdown',
				truncated: false
			});
			const text = r.structuredContent?.text as string;
			expect(text).toMatch(/^# Bucket not found\n/);
			expect(text).toContain('Code: `bucket_not_found`');
			expect(r.content[0]?.text).toBe(text);
			// A trailing ".md" is accepted, as in the page URLs.
			const md = await tool('docs_read', { slug: 'errors/bucket_not_found.md' });
			expect(md.structuredContent?.slug).toBe('errors/bucket_not_found');
		});

		it('docs_read of an API reference page opens with a runnable curl example', async () => {
			const r = await tool('docs_read', { slug: 'api/buckets.create' });
			const text = r.structuredContent?.text as string;
			expect(text).toMatch(
				/^# Create a bucket\n\n```sh\ncurl -sS -X POST 'https:\/\/api\.kofra\.app\/v1\/buckets'/
			);
			expect(text).toContain('## Error codes');
		});

		it('docs_read of an unknown slug is a tool error with a fixed text', async () => {
			for (const slug of ['errors/no_such_code', '../secret', 'x'.repeat(200)]) {
				const r = await tool('docs_read', { slug });
				expect(r.isError).toBe(true);
				expect(r.content).toEqual([{ type: 'text', text: TEXT_UNKNOWN_SLUG }]);
				expect(r.structuredContent).toBeUndefined();
			}
		});

		it('lists every page, the contract and every error code as resources, in a fixed order', async () => {
			const { resources } = await client.listResources();
			const uris = resources.map((r) => r.uri);
			const expected = [
				...content.pages.map((p) => `kofra://docs/${p.slug}`),
				'kofra://openapi',
				...content.errors.map((e) => `kofra://errors/${e.code}`).sort()
			];
			expect(uris).toEqual(expected);
			expect(uris).toContain('kofra://docs/overview');
			expect(uris).toContain('kofra://docs/ai-agents');
			expect(uris).toContain('kofra://errors/bucket_not_found');
		});

		it('reads a docs page, the contract and an error entry', async () => {
			const page = await client.readResource({ uri: 'kofra://docs/errors/bucket_not_found' });
			expect(page.contents[0]).toMatchObject({ mimeType: 'text/markdown' });
			expect((page.contents[0] as { text: string }).text).toMatch(/^# Bucket not found/);

			const api = await client.readResource({ uri: 'kofra://openapi' });
			const doc = JSON.parse((api.contents[0] as { text: string }).text);
			expect(doc.openapi).toMatch(/^3\.1\./);
			expect(doc.info.title).toBe('Kofra API');

			const err = await client.readResource({ uri: 'kofra://errors/rate_limited' });
			expect(JSON.parse((err.contents[0] as { text: string }).text)).toMatchObject({
				code: 'rate_limited',
				status: 429,
				retryable: true
			});
		});

		it('refuses an unknown resource', async () => {
			await expect(client.readResource({ uri: 'kofra://docs/nope' })).rejects.toThrow();
		});
	});
}
