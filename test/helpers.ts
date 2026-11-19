import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import worker from '../src/index';

/** The Worker under test, called in-process with a stub execution context. */
export const BASE = 'http://localhost:8787';

const ctx = {
	waitUntil() {},
	passThroughOnException() {},
	props: {}
} as unknown as ExecutionContext;

export function call(input: string | URL | Request, init?: RequestInit): Promise<Response> {
	const request = new Request(
		typeof input === 'string' && input.startsWith('/') ? BASE + input : input,
		init
	);
	// The Workers runtime always sets Host; Node's Request does not.
	if (!request.headers.has('Host')) request.headers.set('Host', new URL(request.url).host);
	return worker.fetch(request as Request<unknown, IncomingRequestCfProperties>, {}, ctx);
}

export type Era = 'modern' | 'legacy';

/** A real SDK client whose HTTP requests go straight to the Worker's fetch. */
export async function connect(era: Era, bodies?: string[]): Promise<Client> {
	const client = new Client(
		{ name: 'kofra-mcp-test', version: '0.0.0' },
		era === 'modern' ? { versionNegotiation: { mode: { pin: '2026-07-28' } } } : {}
	);
	const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/docs`), {
		fetch: async (url, init) => {
			const res = await call(url instanceof URL ? url.href : url, init);
			if (bodies) bodies.push(await res.clone().text());
			return res;
		}
	});
	await client.connect(transport);
	return client;
}
