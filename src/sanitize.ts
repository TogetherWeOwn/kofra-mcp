// Text renderings shown to a model or a terminal carry no control characters
// and no terminal escape sequences. Exact values stay in structured fields.

// ANSI/VT escape sequences: CSI (ESC [ or 0x9b), OSC (ESC ] ... BEL or ST),
// DCS/SOS/PM/APC strings, and the remaining two-byte ESC sequences.
const ESCAPES =
	// eslint-disable-next-line no-control-regex
	/(?:\u001b\[|\u009b)[0-?]*[ -/]*[@-~]|(?:\u001b[\]PX^_]|[\u0090\u0098\u009d-\u009f])[\s\S]*?(?:\u0007|\u001b\\|\u009c)|\u001b[ -~]?/g;

// C0 and C1 controls except tab and newline, DEL, and the bidirectional
// overrides and isolates that can make text display differently from how it
// reads.
// eslint-disable-next-line no-control-regex
const CONTROLS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g;

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
