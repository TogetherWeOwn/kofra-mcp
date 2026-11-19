#!/usr/bin/env node
// Builds everything derived from content/:
//
//   content/docs/api/*.md          one reference page per API operation, from
//                                  content/openapi.json and content/errors.json
//   generated/content.json         the pages, the search index, the contract and
//                                  the error catalogue, bundled into the Worker
//   discovery/llms.txt             Markdown links to every docs page
//   discovery/robots.txt           disallow everything (pre-launch)
//   discovery/.well-known/mcp.json the MCP endpoints of this host
//
// Usage: node tools/generate.mjs [--check]
// --check writes nothing and exits 1 when any output is missing, stale or
// extra (CI runs this so a hand edit or a forgotten regeneration fails).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize } from '../src/tokenize.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = join(ROOT, 'content');
const DOCS_DIR = join(CONTENT_DIR, 'docs');
const API_DIR = join(DOCS_DIR, 'api');

/** Production origin of this server. The Worker swaps it for the request origin. */
export const PUBLIC_BASE = 'https://mcp.kofra.app';
const API_BASE_FALLBACK = 'https://api.kofra.app';

// BM25 over title, slug and body. Title and slug words count extra so that a
// page about a thing outranks pages that mention it.
const TITLE_WEIGHT = 3;
const SLUG_WEIGHT = 2;

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------------------------------------------------------------------------
// API reference pages

function resolveRef(doc, node) {
	let n = node;
	const seen = new Set();
	while (n && typeof n === 'object' && typeof n.$ref === 'string') {
		if (seen.has(n.$ref)) throw new Error(`circular $ref ${n.$ref}`);
		seen.add(n.$ref);
		if (!n.$ref.startsWith('#/')) throw new Error(`external $ref ${n.$ref}`);
		n = n.$ref
			.slice(2)
			.split('/')
			.reduce((acc, k) => acc?.[k.replace(/~1/g, '/').replace(/~0/g, '~')], doc);
		if (n === undefined) throw new Error(`unresolved $ref ${[...seen].pop()}`);
	}
	return n;
}

function typeName(doc, schema) {
	if (!schema) return '';
	if (schema.$ref) {
		const name = schema.$ref.split('/').pop();
		const target = resolveRef(doc, schema);
		return target?.type ? `${target.type} (${name})` : name;
	}
	if (schema.type === 'array') return `array of ${typeName(doc, schema.items)}`;
	const t = Array.isArray(schema.type) ? schema.type.join(' or ') : (schema.type ?? 'any');
	return schema.format ? `${t} (${schema.format})` : t;
}

/** Table cell text: one line, pipes escaped. */
const cell = (s) =>
	String(s ?? '')
		.replace(/\s*\n\s*/g, ' ')
		.replace(/\|/g, '\\|')
		.trim();

const shellQuote = (s) => `'${s.replace(/'/g, `'\\''`)}'`;

function firstExample(media) {
	if (!media) return undefined;
	if (media.example !== undefined) return media.example;
	const ex = media.examples && Object.values(media.examples)[0];
	return ex?.value;
}

function paramExample(doc, p) {
	if (p.example !== undefined) return p.example;
	const s = resolveRef(doc, p.schema ?? {});
	return s?.example ?? s?.default;
}

function curlExample(doc, base, method, path, op, params) {
	let url = path;
	const query = [];
	for (const p of params) {
		if (p.in === 'path') {
			url = url.replace(`{${p.name}}`, encodeURIComponent(String(paramExample(doc, p))));
		} else if (p.in === 'query' && p.name === 'dry_run') {
			// The runnable example of a destructive operation only plans the change.
			query.push('dry_run=true');
		} else if (p.in === 'query' && p.required) {
			query.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(paramExample(doc, p))}`);
		}
	}
	if (query.length) url += `?${query.join('&')}`;
	const lines = [`curl -sS -X ${method} ${shellQuote(base + url)}`];
	lines.push(`-H "Authorization: Bearer $KOFRA_API_TOKEN"`);
	for (const p of params) {
		if (p.in === 'header' && p.required) {
			lines.push(`-H ${shellQuote(`${p.name}: ${paramExample(doc, p)}`)}`);
		}
	}
	const body = firstExample(op.requestBody?.content?.['application/json']);
	if (body !== undefined) {
		lines.push(`-H 'Content-Type: application/json'`);
		lines.push(`-d ${shellQuote(JSON.stringify(body))}`);
	}
	return lines.join(' \\\n  ');
}

function operationPage(doc, errorsByCode, base, path, method, op, pathParams) {
	const params = [...(pathParams ?? []), ...(op.parameters ?? [])].map((p) => resolveRef(doc, p));
	const M = method.toUpperCase();
	const out = [];
	out.push(`# ${op.summary}`, '');
	out.push('```sh', curlExample(doc, base, M, path, op, params), '```', '');
	if (op['x-kofra-dry-run']) {
		out.push(
			'The example sends `dry_run=true`: the answer shows what would change and nothing changes. Remove it to make the change.',
			''
		);
	}
	const scopes = (op['x-kofra-scopes'] ?? []).map((s) => `\`${s}\``).join(', ') || 'none';
	// Most descriptions end with their own "Scopes:" line; do not repeat it.
	const scopeNote = /^Scopes:/m.test(op.description ?? '') ? '' : ` Scopes: ${scopes}.`;
	out.push(`Operation \`${op.operationId}\`: \`${M} ${path}\`.${scopeNote}`, '');
	if (op.description) out.push(op.description.trim(), '');

	out.push('## Parameters', '');
	if (params.length === 0) {
		out.push('None.', '');
	} else {
		out.push('| Name | In | Required | Type | Description |', '|---|---|---|---|---|');
		for (const p of params) {
			out.push(
				`| \`${cell(p.name)}\` | ${p.in} | ${p.required ? 'yes' : 'no'} | ${cell(typeName(doc, p.schema))} | ${cell(p.description)} |`
			);
		}
		out.push('');
	}

	if (op.requestBody) {
		const media = op.requestBody.content?.['application/json'];
		out.push('## Request body', '');
		out.push(
			`\`application/json\`, ${op.requestBody.required ? 'required' : 'optional'}: ${cell(typeName(doc, media?.schema))}.`,
			''
		);
		const ex = firstExample(media);
		if (ex !== undefined) out.push('```json', JSON.stringify(ex, null, 2), '```', '');
	}

	out.push('## Responses', '');
	out.push('| Status | Description |', '|---|---|');
	for (const [status, resp] of Object.entries(op.responses ?? {})) {
		out.push(`| ${status} | ${cell(resolveRef(doc, resp).description)} |`);
	}
	out.push('');
	const success = String(op['x-kofra-success'] ?? '');
	const ok = op.responses?.[success] && resolveRef(doc, op.responses[success]);
	const okExample = firstExample(ok?.content?.['application/json']);
	if (okExample !== undefined) {
		out.push(`Example \`${success}\` body:`, '');
		out.push('```json', JSON.stringify(okExample, null, 2), '```', '');
	}

	const codes = [...(op['x-kofra-errors'] ?? [])].sort();
	out.push('## Error codes', '');
	if (codes.length === 0) {
		out.push('None.', '');
	} else {
		out.push('| Code | Status | Retryable | Title |', '|---|---|---|---|');
		for (const code of codes) {
			const e = errorsByCode.get(code);
			if (!e) throw new Error(`${op.operationId}: error code ${code} is not in errors.json`);
			out.push(
				`| [\`${code}\`](../errors/${code}.md) | ${e.status} | ${e.retryable ? 'yes' : 'no'} | ${cell(e.title)} |`
			);
		}
		out.push('');
	}
	return out.join('\n');
}

function apiPages(doc, errors) {
	const errorsByCode = new Map(errors.map((e) => [e.code, e]));
	const base = (doc.servers?.[0]?.url ?? API_BASE_FALLBACK).replace(/\/$/, '');
	const pages = new Map();
	const ops = [];
	for (const [path, item] of Object.entries(doc.paths ?? {})) {
		for (const [method, op] of Object.entries(item)) {
			if (method === 'parameters' || typeof op !== 'object' || !op.operationId) continue;
			if (!/^[a-z0-9_.]+$/.test(op.operationId))
				throw new Error(`operationId ${op.operationId} is not slug-safe`);
			ops.push({ path, method: method.toUpperCase(), op });
			pages.set(
				`${op.operationId}.md`,
				operationPage(doc, errorsByCode, base, path, method, op, item.parameters)
			);
		}
	}
	const index = ['# Kofra API reference', ''];
	index.push(
		`One page per operation. Every page opens with a runnable \`curl\` example; set \`KOFRA_API_TOKEN\` to an API token first. Base URL: \`${base}\`. The contract itself is the \`kofra://openapi\` resource of this server.`,
		''
	);
	const tags = doc.tags?.map((t) => t.name) ?? [];
	const byTag = new Map(tags.map((t) => [t, []]));
	for (const o of ops) {
		const tag = o.op.tags?.[0] ?? 'Other';
		if (!byTag.has(tag)) byTag.set(tag, []);
		byTag.get(tag).push(o);
	}
	for (const [tag, list] of byTag) {
		if (list.length === 0) continue;
		index.push(`## ${tag}`, '', '| Operation | Method and path | Summary |', '|---|---|---|');
		for (const o of list) {
			index.push(
				`| [\`${o.op.operationId}\`](${o.op.operationId}.md) | \`${o.method} ${o.path}\` | ${cell(o.op.summary)} |`
			);
		}
		index.push('');
	}
	pages.set('index.md', index.join('\n'));
	return pages;
}

// ---------------------------------------------------------------------------
// Pages, descriptions and the search index

function walk(dir) {
	const out = [];
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else if (e.name.endsWith('.md')) out.push(p);
	}
	return out;
}

function titleOf(slug, text) {
	const m = text.match(/^# (.+)$/m);
	if (!m) throw new Error(`content/docs/${slug}.md has no "# " title`);
	return m[1].trim();
}

/** First prose paragraph after the title, as one line. */
function firstParagraph(text) {
	const blocks = text.split(/\n\s*\n/).map((b) => b.trim());
	for (const b of blocks) {
		if (!b || /^(#|```|\||Code:|- |\d+\. )/.test(b)) continue;
		return b.replace(/\s*\n\s*/g, ' ');
	}
	return '';
}

function describe(slug, text, errorsByCode, opsById) {
	const [section, name] = slug.split('/');
	if (section === 'errors' && errorsByCode.has(name)) {
		const e = errorsByCode.get(name);
		return `Error \`${e.code}\` (HTTP ${e.status}): ${e.title}`;
	}
	if (section === 'api' && opsById.has(name)) {
		const o = opsById.get(name);
		return `\`${o.method} ${o.path}\`: ${o.op.summary}`;
	}
	const p = firstParagraph(text);
	return p.length > 200 ? `${p.slice(0, 197)}...` : p;
}

function buildIndex(pages) {
	const postings = {};
	const lengths = [];
	pages.forEach((page, i) => {
		const tf = new Map();
		const add = (tokens, w) => {
			for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + w);
		};
		add(tokenize(page.title), TITLE_WEIGHT);
		add(tokenize(page.slug), SLUG_WEIGHT);
		add(tokenize(page.text), 1);
		let len = 0;
		for (const [t, n] of [...tf].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
			(postings[t] ??= []).push([i, n]);
			len += n;
		}
		lengths.push(len);
	});
	const sorted = {};
	for (const t of Object.keys(postings).sort()) sorted[t] = postings[t];
	const avg = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
	return { avgLength: Math.round(avg * 1000) / 1000, lengths, postings: sorted };
}

// ---------------------------------------------------------------------------
// Discovery files

const GROUPS = [
	{ heading: 'Guides', match: (slug) => !slug.includes('/') },
	{ heading: 'API reference', match: (slug) => slug.startsWith('api/') },
	{ heading: 'Errors', match: (slug) => slug.startsWith('errors/') }
];

function llmsTxt(pages) {
	const out = ['# Kofra documentation', ''];
	out.push(
		`> Markdown copies of the Kofra API documentation. The same pages are searchable through the no-login documentation MCP server at ${PUBLIC_BASE}/docs (tools \`docs_search\` and \`docs_read\`).`,
		''
	);
	for (const g of GROUPS) {
		const list = pages.filter((p) => g.match(p.slug));
		if (list.length === 0) continue;
		out.push(`## ${g.heading}`, '');
		for (const p of list) {
			out.push(
				`- [${p.title}](${PUBLIC_BASE}/docs/${p.slug}.md)${p.description ? `: ${p.description}` : ''}`
			);
		}
		out.push('');
	}
	out.push('## Optional', '');
	out.push(
		'- [OpenAPI 3.1 contract](https://api.kofra.app/openapi.json): every operation, schema, example and error',
		''
	);
	return out.join('\n');
}

function mcpJson() {
	const doc = {
		name: 'Kofra',
		description: 'Model Context Protocol servers for Kofra.',
		servers: [
			{
				name: 'kofra-docs',
				title: 'Kofra documentation',
				description:
					'Search and read the Kofra API documentation, API reference and error catalogue. No login and no account data.',
				url: `${PUBLIC_BASE}/docs`,
				transport: 'streamable-http',
				authentication: 'none'
			}
		]
	};
	return `${JSON.stringify(doc, null, '\t')}\n`;
}

const ROBOTS = 'User-agent: *\nDisallow: /\n';

// ---------------------------------------------------------------------------

function readSource() {
	const text = readFileSync(join(CONTENT_DIR, 'SOURCE'), 'utf8');
	const m = text.match(/^commit=([0-9a-f]{40})$/m);
	if (!m) throw new Error('content/SOURCE has no commit= line');
	return m[1];
}

/**
 * Regenerates every derived file. With check true nothing is written and the
 * differences are returned instead.
 */
export function generate({ check }) {
	const doc = readJson(join(CONTENT_DIR, 'openapi.json'));
	const errors = readJson(join(CONTENT_DIR, 'errors.json')).errors;
	const errorsByCode = new Map(errors.map((e) => [e.code, e]));
	const opsById = new Map();
	for (const [path, item] of Object.entries(doc.paths ?? {}))
		for (const [method, op] of Object.entries(item))
			if (method !== 'parameters' && op?.operationId)
				opsById.set(op.operationId, { path, method: method.toUpperCase(), op });

	const outputs = new Map();
	for (const [name, text] of apiPages(doc, errors)) outputs.set(join(API_DIR, name), text);

	// Pages: the hand-written ones and the copied error pages on disk, plus
	// the API pages from memory (so --check sees what would be written).
	const onDisk = walk(DOCS_DIR).filter((p) => !p.startsWith(API_DIR + '/'));
	const sources = new Map(onDisk.map((p) => [p, readFileSync(p, 'utf8')]));
	for (const [p, text] of outputs) sources.set(p, text);
	const pages = [...sources]
		.map(([p, text]) => {
			const slug = relative(DOCS_DIR, p).replace(/\\/g, '/').replace(/\.md$/, '');
			if (!/^[a-z0-9_.-]+(\/[a-z0-9_.-]+)*$/.test(slug)) throw new Error(`bad slug ${slug}`);
			return { slug, title: titleOf(slug, text), text };
		})
		.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
	for (const p of pages) p.description = describe(p.slug, p.text, errorsByCode, opsById);

	const bundle = {
		source: readSource(),
		publicBase: PUBLIC_BASE,
		pages: pages.map(({ slug, title, description, text }) => ({ slug, title, description, text })),
		index: buildIndex(pages),
		errors,
		openapi: readFileSync(join(CONTENT_DIR, 'openapi.json'), 'utf8'),
		discovery: { llmsTxt: llmsTxt(pages), mcpJson: mcpJson(), robotsTxt: ROBOTS }
	};
	outputs.set(join(ROOT, 'generated', 'content.json'), `${JSON.stringify(bundle)}\n`);
	outputs.set(join(ROOT, 'discovery', 'llms.txt'), bundle.discovery.llmsTxt);
	outputs.set(join(ROOT, 'discovery', 'robots.txt'), ROBOTS);
	outputs.set(join(ROOT, 'discovery', '.well-known', 'mcp.json'), bundle.discovery.mcpJson);

	const problems = [];
	const existingApi = existsSync(API_DIR) ? walk(API_DIR) : [];
	for (const p of existingApi) {
		if (!outputs.has(p)) problems.push(`extra: ${relative(ROOT, p)}`);
	}
	for (const [p, text] of outputs) {
		if (!existsSync(p)) problems.push(`missing: ${relative(ROOT, p)}`);
		else if (readFileSync(p, 'utf8') !== text) problems.push(`stale: ${relative(ROOT, p)}`);
	}
	if (!check) {
		rmSync(API_DIR, { recursive: true, force: true });
		for (const [p, text] of outputs) {
			mkdirSync(dirname(p), { recursive: true });
			writeFileSync(p, text);
		}
	}
	return { problems, written: outputs.size, pages: pages.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const check = process.argv.includes('--check');
	const { problems, written, pages } = generate({ check });
	if (check && problems.length) {
		for (const p of problems) console.error(`generate --check: ${p}`);
		console.error('generate --check: outputs are out of date; run `pnpm run gen` and commit');
		process.exit(1);
	}
	console.log(
		`generate${check ? ' --check' : ''}: ${pages} pages, ${written} outputs ${check ? 'up to date' : 'written'}`
	);
}
