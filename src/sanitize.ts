// Text renderings shown to a model or a terminal carry no control characters
// and no terminal escape sequences. Exact values stay in structured fields.

// ANSI/VT escape sequences: CSI (ESC [ or 0x9b), OSC (ESC ] ... BEL or ST),
// DCS/SOS/PM/APC strings, and the remaining two-byte ESC sequences.
//
// A string sequence (OSC, DCS, SOS, PM, APC) ends at its terminator (BEL,
// ESC \ or 0x9c), at the next escape sequence, or at the end of the line, so
// an unterminated payload is removed with its introducer instead of left
// behind as text. The body class excludes every character that can end it,
// and one of the endings always matches right after the body, so the match
// never backtracks: the cost is linear in the input however long the
// payload is.
const ESCAPES =
	// eslint-disable-next-line no-control-regex
	/(?:\u001b\[|\u009b)[0-?]*[ -/]*[@-~]|(?:\u001b[\]PX^_]|[\u0090\u0098\u009d-\u009f])[^\u0007\u001b\u009c\n]*(?:\u0007|\u001b\\|\u009c|(?=\u001b)|$)|\u001b[ -~]?/gm;

// Characters that are invisible or change how text displays: C0 and C1
// controls except tab and newline, DEL, the soft hyphen, zero-width and
// directional marks (U+200B-200F), the line and paragraph separators, the
// bidirectional embeddings, overrides and isolates, the invisible operators
// (U+2060-2064), the byte-order mark and the tag characters (U+E0000-E007F),
// which can carry hidden text. tools/generate.mjs applies the same set at
// build time.
const CONTROLS =
	// eslint-disable-next-line no-control-regex
	/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff\u{e0000}-\u{e007f}]/gu;

/** Removes escape sequences and control characters; keeps tabs and newlines. */
export function stripControls(text: string): string {
	return text.replace(/\r\n/g, '\n').replace(ESCAPES, '').replace(CONTROLS, '');
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Cuts text to at most maxBytes of UTF-8 without splitting a character. */
export function capUtf8(text: string, maxBytes: number): { text: string; truncated: boolean } {
	const bytes = encoder.encode(text);
	if (bytes.length <= maxBytes) return { text, truncated: false };
	let end = maxBytes;
	// Step back over continuation bytes (10xxxxxx) to a character boundary.
	while (end > 0 && ((bytes[end] ?? 0) & 0xc0) === 0x80) end--;
	return { text: decoder.decode(bytes.subarray(0, end)), truncated: true };
}
