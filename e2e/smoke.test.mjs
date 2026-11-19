// End-to-end smoke test: starts the Worker with `wrangler dev` (local mode, no
// Cloudflare account, no metrics) and talks to it over real HTTP with the MCP
// SDK client, in both protocol eras. Run with `pnpm run test:e2e`.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const ROOT = new URL('..', import.meta.url);
const WRANGLER = new URL('node_modules/.bin/wrangler', ROOT);
const READY_TIMEOUT_MS = 60_000;

function freePort() {
	return new Promise((resolve, reject) => {
		const srv = createServer();
		srv.unref();
		srv.on('error', reject);
		srv.listen(0, '127.0.0.1', () => {
			const { port } = srv.address();
			srv.close(() => resolve(port));
		});
	});
}

/** The parent environment without any Cloudflare credentials. */
function localEnv() {
	const env = {};
	for (const [k, v] of Object.entries(process.env))
		if (!k.startsWith('CLOUDFLARE_') && !k.startsWith('CF_')) env[k] = v;
	return { ...env, WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' };
}

let base;
let dev;
let devLog = '';

async function waitReady() {
	const deadline = Date.now() + READY_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (dev.exitCode !== null) throw new Error(`wrangler dev exited early:\n${devLog}`);
		try {
			const res = await fetch(`${base}/robots.txt`);
			if (res.ok) return;
		} catch {
			// not listening yet
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`wrangler dev was not ready in ${READY_TIMEOUT_MS} ms:\n${devLog}`);
}

before(async () => {
	const port = await freePort();
	const inspectorPort = await freePort();
	base = `http://127.0.0.1:${port}`;
	dev = spawn(
		WRANGLER.pathname,
		[
			'dev',
			'--ip',
			'127.0.0.1',
			'--port',
			String(port),
			'--inspector-port',
			String(inspectorPort),
			'--local',
			'--show-interactive-dev-session=false'
		],
		{ cwd: ROOT, env: localEnv(), stdio: ['ignore', 'pipe', 'pipe'] }
	);
	dev.stdout.on('data', (d) => (devLog += d));
	dev.stderr.on('data', (d) => (devLog += d));
	await waitReady();
});

after(async () => {
	if (dev && dev.exitCode === null) {
		const exited = new Promise((r) => dev.once('exit', r));
		dev.kill('SIGTERM');
		await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))]);
		if (dev.exitCode === null) dev.kill('SIGKILL');
	}
});

function assertNoindex(res, what) {
	assert.equal(res.headers.get('x-robots-tag'), 'noindex', `${what}: X-Robots-Tag`);
}

/** A real SDK client over HTTP; every response it receives is checked for noindex. */
async function connect(era, seen) {
	const client = new Client(
		{ name: 'kofra-mcp-e2e', version: '0.0.0' },
		era === 'modern' ? { versionNegotiation: { mode: { pin: '2026-07-28' } } } : {}
	);
	const transport = new StreamableHTTPClientTransport(new URL(`${base}/docs`), {
		fetch: async (url, init) => {
			const res = await fetch(url, init);
			seen.push(res);
			return res;
		}
	});
	await client.connect(transport);
	return client;
}

for (const era of ['modern', 'legacy']) {
	describe(`MCP client, ${era} era, over wrangler dev`, () => {
		const seen = [];
		let client;

		before(async () => {
			client = await connect(era, seen);
		});
		after(async () => {
			await client?.close();
		});

		it('negotiates the era', () => {
			assert.equal(client.getProtocolEra(), era);
			if (era === 'modern') assert.equal(client.getNegotiatedProtocolVersion(), '2026-07-28');
		});

		it('lists the two documentation tools', async () => {
			const { tools } = await client.listTools();
			assert.deepEqual(
				tools.map((t) => t.name),
				['docs_search', 'docs_read']
			);
		});

		it('searches, then reads the top result', async () => {
			const search = await client.callTool({
				name: 'docs_search',
				arguments: { query: 'create bucket', limit: 3 }
			});
			assert.notEqual(search.isError, true);
			const { results } = search.structuredContent;
			assert.ok(results.length > 0, 'docs_search returned no results');
			assert.ok(results.length <= 3);

			const read = await client.callTool({
				name: 'docs_read',
				arguments: { slug: results[0].slug }
			});
			assert.notEqual(read.isError, true);
			assert.equal(read.structuredContent.slug, results[0].slug);
			assert.equal(read.structuredContent.mimeType, 'text/markdown');
			assert.ok(read.structuredContent.text.startsWith('# '));
		});

		it('reads resources', async () => {
			const openapi = await client.readResource({ uri: 'kofra://openapi' });
			const doc = JSON.parse(openapi.contents[0].text);
			assert.match(doc.openapi, /^3\./);

			const { resources } = await client.listResources();
			const page = resources.find((r) => r.uri.startsWith('kofra://docs/'));
			assert.ok(page, 'no kofra://docs/ resource listed');
			const read = await client.readResource({ uri: page.uri });
			assert.ok(read.contents[0].text.length > 0);
		});

		it('sent noindex on every MCP response', () => {
			assert.ok(seen.length > 0);
			for (const res of seen) assertNoindex(res, `MCP ${res.status}`);
		});
	});
}

describe('HTTP surface over wrangler dev', () => {
	it('robots.txt disallows everything', async () => {
		const res = await fetch(`${base}/robots.txt`);
		assert.equal(res.status, 200);
		assertNoindex(res, 'robots.txt');
		assert.equal(await res.text(), 'User-agent: *\nDisallow: /\n');
	});

	it('serves discovery files that name this origin', async () => {
		const mcp = await fetch(`${base}/.well-known/mcp.json`);
		assert.equal(mcp.status, 200);
		assertNoindex(mcp, 'mcp.json');
		const doc = await mcp.json();
		assert.equal(doc.servers[0].url, `${base}/docs`);

		const llms = await fetch(`${base}/llms.txt`);
		assert.equal(llms.status, 200);
		assertNoindex(llms, 'llms.txt');
		assert.ok((await llms.text()).includes(`${base}/docs/`));
	});

	it('sends noindex on /docs, pages and errors', async () => {
		const cases = [
			['GET', '/', 200],
			['GET', '/docs', null],
			['GET', '/docs/ai-agents.md', 200],
			['GET', '/docs/no-such-page.md', 404],
			['GET', '/nope', 404],
			['POST', '/robots.txt', 405]
		];
		for (const [method, path, status] of cases) {
			const res = await fetch(`${base}${path}`, { method });
			await res.arrayBuffer();
			if (status !== null) assert.equal(res.status, status, `${method} ${path}`);
			assertNoindex(res, `${method} ${path} (${res.status})`);
		}
	});

	it('refuses a browser request from a foreign Origin', async () => {
		const init = (origin) => ({
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json, text/event-stream',
				Origin: origin
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: '2025-06-18',
					capabilities: {},
					clientInfo: { name: 'e2e', version: '0' }
				}
			})
		});
		const foreign = await fetch(`${base}/docs`, init('https://evil.example'));
		await foreign.arrayBuffer();
		assert.equal(foreign.status, 403);
		assertNoindex(foreign, 'foreign Origin');
		assert.equal(foreign.headers.get('cache-control'), 'no-store');

		const plain = await fetch(`${base}/docs`, init('http://kofra.app'));
		await plain.arrayBuffer();
		assert.equal(plain.status, 403);

		const own = await fetch(`${base}/docs`, init('https://kofra.app'));
		await own.arrayBuffer();
		assert.equal(own.status, 200);
		assertNoindex(own, 'allowed Origin');
		assert.equal(own.headers.get('access-control-allow-origin'), 'https://kofra.app');
	});
});
