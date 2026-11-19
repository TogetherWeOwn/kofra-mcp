import { content, type Page } from './content';
import { stripControls } from './sanitize';
import { tokenize } from './tokenize';

// BM25 parameters (the usual defaults).
const K1 = 1.2;
const B = 0.75;
const SNIPPET_CHARS = 240;
// BM25 saturates term frequency, so the build-time title weight alone lets a
// short overview page that mentions every operation outrank the page whose
// title is the query. Each query term in a page's title adds this many times
// its idf on top.
const TITLE_BOOST = 1;

export interface SearchHit {
	page: Page;
	score: number;
	snippet: string;
}

/**
 * Ranks pages for a free-text query with BM25 over the build-time index.
 * Ties break on slug, so the order is deterministic.
 */
export function search(query: string, limit: number): { hits: SearchHit[]; total: number } {
	const terms = [...new Set(tokenize(query))];
	const { index, pages } = content;
	const n = pages.length;
	const scores = new Map<number, number>();
	for (const term of terms) {
		const postings = index.postings[term];
		if (!postings) continue;
		const idf = Math.log(1 + (n - postings.length + 0.5) / (postings.length + 0.5));
		for (const [doc, tf] of postings) {
			const len = index.lengths[doc] ?? index.avgLength;
			let s = (idf * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * len) / index.avgLength));
			if (titleTerms(doc).has(term)) s += TITLE_BOOST * idf;
			scores.set(doc, (scores.get(doc) ?? 0) + s);
		}
	}
	const ranked = [...scores]
		.map(([doc, score]) => ({ page: pages[doc] as Page, score: Math.round(score * 1e4) / 1e4 }))
		.sort((a, b) => b.score - a.score || (a.page.slug < b.page.slug ? -1 : 1));
	return {
		total: ranked.length,
		hits: ranked.slice(0, limit).map((h) => ({ ...h, snippet: snippet(h.page, terms) }))
	};
}

const titleCache = new Map<number, Set<string>>();
function titleTerms(doc: number): Set<string> {
	let t = titleCache.get(doc);
	if (!t) {
		t = new Set(tokenize(content.pages[doc]?.title ?? ''));
		titleCache.set(doc, t);
	}
	return t;
}

/** The first body line that contains a query term, as plain one-line text. */
function snippet(page: Page, terms: string[]): string {
	const wanted = new Set(terms);
	let inFence = false;
	let best: string | undefined;
	for (const raw of page.text.split('\n')) {
		if (raw.startsWith('```')) {
			inFence = !inFence;
			continue;
		}
		const line = raw.trim();
		if (!line || line.startsWith('# ') || /^\|?[-| ]+\|?$/.test(line)) continue;
		if (tokenize(line).some((t) => wanted.has(t))) {
			best = inFence ? line : line.replace(/^#+\s*|[*`]/g, '');
			break;
		}
	}
	const text = stripControls(best ?? page.description)
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > SNIPPET_CHARS ? `${text.slice(0, SNIPPET_CHARS - 3)}...` : text;
}
