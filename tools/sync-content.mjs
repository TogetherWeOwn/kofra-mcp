#!/usr/bin/env node
// Copies the published contract and error pages from a kofra-api checkout into
// content/, records the source commit in content/SOURCE, then regenerates
// everything derived from content/ (tools/generate.mjs).
//
// Usage: node tools/sync-content.mjs <path to a kofra-api checkout>
//
// Only kofra-api's generated/ output is read: generated/openapi.json,
// generated/errors.json and generated/docs/errors/*.md. Files that kofra-api
// no longer publishes are removed from content/ so the two never drift.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CONTENT_DIR, generate, readText } from './generate.mjs';

/** Copies a text file with LF line endings, whatever the source checkout used. */
const copyText = (from, to) => writeFileSync(to, readText(from));

function fail(message) {
	console.error(`sync-content: ${message}`);
	process.exit(1);
}

const source = process.argv[2];
if (!source) fail('usage: node tools/sync-content.mjs <path to a kofra-api checkout>');
const root = resolve(source);
const generated = join(root, 'generated');
for (const f of ['openapi.json', 'errors.json', 'docs/errors']) {
	if (!existsSync(join(generated, f))) fail(`missing generated/${f} in the kofra-api checkout`);
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
if (!/^[0-9a-f]{40}$/.test(sha)) fail('could not read the kofra-api commit');
// A dirty generated/ would record a commit that does not contain the copied bytes.
if (git('status', '--porcelain', '--', 'generated')) {
	fail('generated/ in the kofra-api checkout has uncommitted changes; commit or stash them first');
}

mkdirSync(join(CONTENT_DIR, 'docs'), { recursive: true });
copyText(join(generated, 'openapi.json'), join(CONTENT_DIR, 'openapi.json'));
copyText(join(generated, 'errors.json'), join(CONTENT_DIR, 'errors.json'));

const errorsOut = join(CONTENT_DIR, 'docs', 'errors');
rmSync(errorsOut, { recursive: true, force: true });
mkdirSync(errorsOut, { recursive: true });
const pages = readdirSync(join(generated, 'docs', 'errors'))
	.filter((f) => f.endsWith('.md'))
	.sort();
for (const f of pages) copyText(join(generated, 'docs', 'errors', f), join(errorsOut, f));

writeFileSync(
	join(CONTENT_DIR, 'SOURCE'),
	[
		'# Copied from TogetherWeOwn/kofra-api by tools/sync-content.mjs. Do not edit by hand.',
		'repository=TogetherWeOwn/kofra-api',
		`commit=${sha}`,
		'files=generated/openapi.json generated/errors.json generated/docs/errors/*.md',
		''
	].join('\n')
);

const { written } = generate({ check: false });
console.log(
	`sync-content: copied ${pages.length} error pages and the contract at ${sha.slice(0, 12)}; ${written} generated files`
);
