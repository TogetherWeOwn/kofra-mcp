// Tokenizer shared by the build-time search index (tools/generate.mjs) and the
// runtime query path (src/search.ts). Both sides must split text the same way,
// so this file is plain, erasable TypeScript that Node runs directly.

/** Words too common to help ranking. Kept short on purpose. */
const STOPWORDS = new Set([
	'a',
	'an',
	'and',
	'are',
	'as',
	'at',
	'be',
	'by',
	'for',
	'from',
	'how',
	'i',
	'in',
	'is',
	'it',
	'of',
	'on',
	'or',
	'that',
	'the',
	'this',
	'to',
	'what',
	'with',
	'you',
	'your'
]);

/** Lower-cased word tokens: runs of letters and digits, stopwords removed. */
export function tokenize(text: string): string[] {
	const out: string[] = [];
	for (const m of text
		.normalize('NFKC')
		.toLowerCase()
		.matchAll(/[\p{L}\p{N}]+/gu)) {
		const t = m[0];
		if (!STOPWORDS.has(t)) out.push(t);
	}
	return out;
}
