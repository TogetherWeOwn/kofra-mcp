import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { content, errorsByCode, pagesBySlug } from './content';
import { capUtf8, stripControls } from './sanitize';
import { search } from './search';

export const SERVER_NAME = 'kofra-docs';
export const SERVER_VERSION = '0.1.0';

/** Largest page text returned inline (1 MiB). */
export const MAX_PAGE_BYTES = 1024 * 1024;
/** Most search results returned in one call. */
export const MAX_RESULTS = 20;
const DEFAULT_RESULTS = 5;

/** Public documentation: shared caches may keep it for an hour. */
const PUBLIC_HOUR = { ttlMs: 60 * 60 * 1000, cacheScope: 'public' } as const;

// Every tool only reads static, bundled documentation.
const READ_ONLY = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
} as const;

// Fixed texts. No request value is ever spliced into them.
export const TEXT_UNKNOWN_SLUG =
	'No documentation page has this slug. Use docs_search to find the slug of a page.';
export const TEXT_FAILED = 'The documentation server could not complete this request.';
const TEXT_NO_RESULTS = 'No documentation page matches this query.';

const INSTRUCTIONS =
	'Kofra documentation: API conventions, a reference page per API operation and the error catalogue. ' +
	'Use docs_search to find pages, then docs_read with a slug to read one. ' +
	'This server needs no login, holds no account data and cannot change anything.';

// Tool descriptions are static and reviewed; nothing from a request or from
// page content ever becomes part of one.
const SEARCH_DESCRIPTION =
	'Search the Kofra documentation: API conventions, the API reference (one page per operation, ' +
	'each with a runnable curl example) and the error catalogue (one page per error code). ' +
	'Returns pages ranked by relevance, each with its slug, title and a short snippet. ' +
	'Read a full page with docs_read. Read-only; uses no account data.';
const READ_DESCRIPTION =
	'Read one Kofra documentation page as Markdown, by the slug that docs_search returns, ' +
	'for example "errors/bucket_not_found" or "api/buckets.create". Read-only; uses no account data.';

const searchInput = z.object({
	query: z.string().min(1).max(500).describe('Words to look for, for example "create bucket".'),
	limit: z
		.number()
		.int()
		.min(1)
		.max(MAX_RESULTS)
		.optional()
		.describe(`Most results to return, 1 to ${MAX_RESULTS}. Default ${DEFAULT_RESULTS}.`)
});

const searchOutput = z.object({
	results: z.array(
		z.object({
			slug: z.string(),
			title: z.string(),
			uri: z.string(),
			snippet: z.string(),
			score: z.number()
		})
	),
	total: z.number().int().describe('Pages that matched, before the limit.')
});

const readInput = z.object({
	slug: z.string().min(1).max(200).describe('Page slug from docs_search, without ".md".')
});

const readOutput = z.object({
	slug: z.string(),
	title: z.string(),
	uri: z.string(),
	mimeType: z.literal('text/markdown'),
	text: z.string(),
	truncated: z.boolean().describe('True when the page was cut at 1 MiB.')
});

export const docUri = (slug: string) => `kofra://docs/${slug}`;

const failure = (text: string): CallToolResult => ({
	content: [{ type: 'text', text }],
	isError: true
});

/** A fresh server per request: no state survives between requests. */
export function createServer(): McpServer {
	const server = new McpServer(
		{ name: SERVER_NAME, title: 'Kofra documentation', version: SERVER_VERSION },
		{
			instructions: INSTRUCTIONS,
			cacheHints: {
				'tools/list': PUBLIC_HOUR,
				'resources/list': PUBLIC_HOUR,
				'resources/templates/list': PUBLIC_HOUR,
				'resources/read': PUBLIC_HOUR,
				'server/discover': PUBLIC_HOUR
			}
		}
	);

	// Registration order is the tools/list order.
	server.registerTool(
		'docs_search',
		{
			title: 'Search the Kofra documentation',
			description: SEARCH_DESCRIPTION,
			inputSchema: searchInput,
			outputSchema: searchOutput,
			annotations: { title: 'Search the Kofra documentation', ...READ_ONLY }
		},
		async ({ query, limit }) => {
			try {
				const { hits, total } = search(query, limit ?? DEFAULT_RESULTS);
				const results = hits.map((h) => ({
					slug: h.page.slug,
					title: h.page.title,
					uri: docUri(h.page.slug),
					snippet: h.snippet,
					score: h.score
				}));
				const text =
					results.length === 0
						? TEXT_NO_RESULTS
						: results
								.map(
									(r, i) =>
										`${i + 1}. ${stripControls(r.title)} (slug: ${stripControls(r.slug)})\n   ${r.snippet}`
								)
								.join('\n');
				return {
					content: [{ type: 'text', text }],
					structuredContent: { results, total }
				};
			} catch {
				return failure(TEXT_FAILED);
			}
		}
	);

	server.registerTool(
		'docs_read',
		{
			title: 'Read a Kofra documentation page',
			description: READ_DESCRIPTION,
			inputSchema: readInput,
			outputSchema: readOutput,
			annotations: { title: 'Read a Kofra documentation page', ...READ_ONLY }
		},
		async ({ slug }) => {
			try {
				const page = pagesBySlug.get(slug.replace(/\.md$/, ''));
				if (!page) return failure(TEXT_UNKNOWN_SLUG);
				const { text, truncated } = capUtf8(page.text, MAX_PAGE_BYTES);
				return {
					content: [{ type: 'text', text: stripControls(text) }],
					structuredContent: {
						slug: page.slug,
						title: page.title,
						uri: docUri(page.slug),
						mimeType: 'text/markdown' as const,
						text,
						truncated
					}
				};
			} catch {
				return failure(TEXT_FAILED);
			}
		}
	);

	// Resources, in a fixed order: docs pages by slug, the contract, errors by code.
	for (const page of content.pages) {
		const uri = docUri(page.slug);
		server.registerResource(
			`docs/${page.slug}`,
			uri,
			{
				title: page.title,
				description: page.description,
				mimeType: 'text/markdown',
				cacheHint: PUBLIC_HOUR
			},
			async () => ({ contents: [{ uri, mimeType: 'text/markdown', text: page.text }] })
		);
	}

	server.registerResource(
		'openapi',
		'kofra://openapi',
		{
			title: 'Kofra API contract (OpenAPI 3.1)',
			description: 'The OpenAPI 3.1 description of the Kofra API.',
			mimeType: 'application/json',
			cacheHint: PUBLIC_HOUR
		},
		async () => ({
			contents: [{ uri: 'kofra://openapi', mimeType: 'application/json', text: content.openapi }]
		})
	);

	for (const code of [...errorsByCode.keys()].sort()) {
		const entry = errorsByCode.get(code);
		if (!entry) continue;
		const uri = `kofra://errors/${code}`;
		const text = `${JSON.stringify(entry, null, 2)}\n`;
		server.registerResource(
			`errors/${code}`,
			uri,
			{
				title: entry.title,
				description: `Error catalogue entry for \`${code}\` (HTTP ${entry.status}).`,
				mimeType: 'application/json',
				cacheHint: PUBLIC_HOUR
			},
			async () => ({ contents: [{ uri, mimeType: 'application/json', text }] })
		);
	}

	return server;
}
