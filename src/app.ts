// The Worker's routing, headers and Origin policy. Kept out of src/index.ts
// because the runtime treats every named export of the main module as an
// entrypoint, so constants exported from there stop the Worker loading.
import { localhostAllowedOrigins } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { content, pagesBySlug } from './content';
import { createServer } from './server';

export const MCP_ROUTE = '/docs';

/** Header value that keeps every response out of search indexes. */
export const ROBOTS_HEADER_VALUE = 'noindex';

/**
 * Browser origins allowed to call the MCP endpoint, compared as whole
 * origins (scheme, host and port), so plain http or another port on an
 * allow-listed host is refused. Requests without an Origin (non-browser MCP
 * clients) are always allowed.
 */
export const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
	'https://kofra.app',
	'https://www.kofra.app',
	'https://console.kofra.app',
	'https://mcp.kofra.app'
]);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Local origins (any scheme of http/https and any port) are accepted only
 * when the server itself is reached on a local host, so browser-based MCP
 * inspectors work in development while a deployed Worker refuses them.
 */
function isLocalOrigin(origin: URL): boolean {
	return (
		(origin.protocol === 'http:' || origin.protocol === 'https:') &&
		LOCAL_HOSTNAMES.has(origin.hostname)
	);
}

/** The accepted Origin, null when there is none, or false when it is refused. */
export function acceptedOrigin(request: Request, url: URL): string | null | false {
	const raw = request.headers.get('Origin');
	if (raw === null) return null;
	if (ALLOWED_ORIGINS.has(raw)) return raw;
	let origin: URL;
	try {
		origin = new URL(raw);
	} catch {
		return false;
	}
	// Only a serialised origin is accepted: no path, credentials or trailing dot tricks.
	if (origin.origin !== raw) return false;
	if (isLocalOrigin(origin) && LOCAL_HOSTNAMES.has(url.hostname)) return raw;
	return false;
}

// The SDK's own hostname check stays on as a second layer behind
// acceptedOrigin(). Its CORS headers are off: they carry one fixed origin per
// handler, while this Worker echoes the origin it accepted (see withCors).
const mcp = createMcpHandler(createServer, {
	route: MCP_ROUTE,
	allowedOriginHostnames: [
		...localhostAllowedOrigins(),
		...[...ALLOWED_ORIGINS].map((o) => new URL(o).hostname)
	],
	corsOptions: false
});

const CORS_HEADERS = {
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers':
		'Content-Type, Accept, Authorization, Last-Event-ID, Mcp-Session-Id, Mcp-Protocol-Version, Mcp-Method, Mcp-Name',
	'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
	'Access-Control-Max-Age': '86400'
};

/** Adds CORS headers for an accepted browser origin; Vary: Origin always. */
function withCors(response: Response, origin: string | null): Response {
	const headers = new Headers(response.headers);
	headers.append('Vary', 'Origin');
	if (origin !== null) {
		headers.set('Access-Control-Allow-Origin', origin);
		for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

const PUBLIC_CACHE = 'public, max-age=3600';
const NO_STORE = 'no-store';

/** Only a successful static answer may be cached; anything else is no-store. */
function text(body: string, type: string, status = 200, extra: HeadersInit = {}): Response {
	return new Response(body, {
		status,
		headers: {
			'Content-Type': `${type}; charset=utf-8`,
			'Cache-Control': status === 200 ? PUBLIC_CACHE : NO_STORE,
			'X-Content-Type-Options': 'nosniff',
			...extra
		}
	});
}

const notFound = () => text('Not found\n', 'text/plain', 404);

/** Discovery files name the production origin; a preview serves its own. */
function rebase(body: string, origin: string): string {
	return origin === content.publicBase ? body : body.replaceAll(content.publicBase, origin);
}

const INDEX_TEXT =
	'Kofra documentation MCP server.\n\n' +
	'MCP endpoint (Streamable HTTP, no login): /docs\n' +
	'Pages as Markdown: /llms.txt\n' +
	'MCP discovery: /.well-known/mcp.json\n';

function staticRoute(request: Request, url: URL): Response | undefined {
	const path = url.pathname;
	let res: Response | undefined;
	if (path === '/') res = text(INDEX_TEXT, 'text/plain');
	else if (path === '/robots.txt') res = text(content.discovery.robotsTxt, 'text/plain');
	else if (path === '/llms.txt')
		res = text(rebase(content.discovery.llmsTxt, url.origin), 'text/markdown');
	else if (path === '/.well-known/mcp.json')
		res = text(rebase(content.discovery.mcpJson, url.origin), 'application/json');
	else if (path.startsWith(`${MCP_ROUTE}/`) && path.endsWith('.md')) {
		const page = pagesBySlug.get(path.slice(MCP_ROUTE.length + 1, -'.md'.length));
		res = page ? text(page.text, 'text/markdown') : notFound();
	}
	if (!res) return undefined;
	if (request.method === 'GET') return res;
	if (request.method === 'HEAD')
		return new Response(null, { status: res.status, headers: res.headers });
	return text('Method not allowed\n', 'text/plain', 405, { Allow: 'GET, HEAD' });
}

async function route(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	if (url.pathname === MCP_ROUTE) {
		const origin = acceptedOrigin(request, url);
		if (origin === false) return text('Forbidden: Origin not allowed\n', 'text/plain', 403);
		if (request.method === 'OPTIONS')
			return withCors(
				new Response(null, { status: 204, headers: { 'Cache-Control': NO_STORE } }),
				origin
			);
		return withCors(await mcp(request, env, ctx), origin);
	}
	return staticRoute(request, url) ?? notFound();
}

/**
 * Copies a response with X-Robots-Tag set (handler responses may be
 * immutable). Error answers, including the MCP handler's, are never cached.
 */
export function withNoindex(response: Response): Response {
	const headers = new Headers(response.headers);
	headers.set('X-Robots-Tag', ROBOTS_HEADER_VALUE);
	if (response.status >= 400) headers.set('Cache-Control', NO_STORE);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

/** The Worker's fetch handler; src/index.ts exports it as the default. */
export const handler = {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			return withNoindex(await route(request, env, ctx));
		} catch {
			return withNoindex(text('Internal error\n', 'text/plain', 500));
		}
	}
} satisfies ExportedHandler;
