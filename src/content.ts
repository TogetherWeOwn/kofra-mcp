// The documentation bundle, built by tools/generate.mjs from content/ and
// compiled into the Worker. Nothing is fetched at run time. It is imported as
// text (a wrangler Text rule, mirrored in vitest.config.ts), so the Worker
// ships the JSON file verbatim as its own module and parses it once at start-up.
import raw from '../generated/content.json';

export interface Page {
	slug: string;
	title: string;
	description: string;
	text: string;
}

export interface ErrorEntry {
	code: string;
	status: number;
	title: string;
	retryable: boolean;
	hint: string;
	meaning: string;
	type: string;
	docs_url: string;
}

export interface SearchIndex {
	avgLength: number;
	lengths: number[];
	/** term -> [page index, weighted term frequency][] */
	postings: Record<string, [number, number][]>;
}

export interface Bundle {
	source: string;
	publicBase: string;
	pages: Page[];
	index: SearchIndex;
	errors: ErrorEntry[];
	openapi: string;
	discovery: { llmsTxt: string; mcpJson: string; robotsTxt: string };
}

export const content = JSON.parse(raw as unknown as string) as Bundle;

export const pagesBySlug: ReadonlyMap<string, Page> = new Map(
	content.pages.map((p) => [p.slug, p])
);

export const errorsByCode: ReadonlyMap<string, ErrorEntry> = new Map(
	content.errors.map((e) => [e.code, e])
);
