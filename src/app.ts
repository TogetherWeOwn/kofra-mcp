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
 * Browser origins allowed to call the MCP endpoint. Requests without an
 * Origin (non-browser MCP clients) are always allowed; a browser page on any
 * other origin is refused with 403 before the request reaches the server.
 * Local origins stay allowed so browser-based MCP inspectors work in
 * development; the documentation is public, so they gain nothing else.
 */
export const ALLOWED_ORIGIN_HOSTNAMES = [
	...localhostAllowedOrigins(),
	'kofra.app',
	'www.kofra.app',
	'console.kofra.app',
	'mcp.kofra.app'
];

const mcp = createMcpHandler(createServer, {
	route: MCP_ROUTE,
	allowedOriginHostnames: ALLOWED_ORIGIN_HOSTNAMES
});

const STATIC_HEADERS = {
	'Cache-Control': 'public, max-age=3600',
	'X-Content-Type-Options': 'nosniff'
};

function text(body: string, type: string, status = 200, extra: HeadersInit = {}): Response {
	return new Response(body, {
		status,
		headers: { 'Content-Type': `${type}; charset=utf-8`, ...STATIC_HEADERS, ...extra }
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
	if (url.pathname === MCP_ROUTE) return mcp(request, env, ctx);
	return staticRoute(request, url) ?? notFound();
}

/** Copies a response with X-Robots-Tag set (handler responses may be immutable). */
export function withNoindex(response: Response): Response {
	const headers = new Headers(response.headers);
	headers.set('X-Robots-Tag', ROBOTS_HEADER_VALUE);
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
