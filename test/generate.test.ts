import { parsers } from 'prettier/plugins/markdown';
import { describe, expect, it } from 'vitest';
import { operationPage } from '../tools/generate.mjs';

type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[] };

function visibleText(node: MarkdownNode): string {
	return node.value ?? node.children?.map(visibleText).join('') ?? '';
}

describe('generated Markdown table cells', () => {
	it('preserves rendered text and column counts by cell context', async () => {
		const name = String.raw`path\name|suffix`;
		const format = String.raw`left\|right | path\name`;
		const description = String.raw`\*literal\* \| **bold** | tail`;
		const page = operationPage(
			{},
			new Map(),
			'https://example.com',
			'/example',
			'get',
			{
				operationId: 'example',
				summary: 'Example',
				parameters: [{ name, in: 'query', schema: { type: 'string', format }, description }],
				responses: { 200: { description } }
			},
			[]
		);
		// The Markdown parser needs the dialect, not Prettier's printer settings.
		const { parse } = parsers.markdown;
		const tree: MarkdownNode = await parse(page, { parser: 'markdown' } as Parameters<
			typeof parse
		>[1]);
		const [params, responses] = tree.children?.filter((node) => node.type === 'table') ?? [];
		const paramCells = params?.children?.[1]?.children ?? [];
		const responseCells = responses?.children?.[1]?.children ?? [];
		const descriptionText = '*literal* | bold | tail';

		expect(paramCells).toHaveLength(5);
		expect(responseCells).toHaveLength(2);
		expect.soft(paramCells[0]?.children?.[0]).toMatchObject({ type: 'inlineCode', value: name });
		expect.soft(paramCells[3] && visibleText(paramCells[3])).toBe(`string (${format})`);
		expect.soft(paramCells[4] && visibleText(paramCells[4])).toBe(descriptionText);
		expect.soft(responseCells.map(visibleText)).toEqual(['200', descriptionText]);
		for (const cell of [paramCells[4], responseCells[1]]) {
			expect.soft(cell?.children?.find((node) => node.type === 'strong')).toMatchObject({
				children: [{ type: 'text', value: 'bold' }]
			});
		}
	});
});
