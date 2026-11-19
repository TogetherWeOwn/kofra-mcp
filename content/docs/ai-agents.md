# AI agents

Connect an AI client to the Kofra documentation MCP server so it can search and read these pages, the
API reference and the error catalogue while it helps you. The server needs no login and holds no
account data.

```sh
claude mcp add --transport http kofra-docs https://mcp.kofra.app/docs
```

## The documentation server

| | |
|---|---|
| Endpoint | `https://mcp.kofra.app/docs` |
| Transport | Streamable HTTP, stateless; protocol revision `2026-07-28` and 2025-era clients |
| Login | None |
| Tools | `docs_search`, `docs_read` |
| Resources | `kofra://docs/<slug>`, `kofra://openapi`, `kofra://errors/<code>` |

For any other MCP client, add a remote server with the endpoint above and the Streamable HTTP
transport. The list of endpoints is also published at `/.well-known/mcp.json`.

### Tools

- `docs_search`: find pages by words. Takes `query` and an optional `limit` (1 to 20, default 5).
  Answers with ranked matches, each with a `slug`, `title` and `snippet`.
- `docs_read`: read one page by its `slug`. Answers with the page in Markdown.

Both tools only read. They never change anything and never fetch other sites.

### Resources

- `kofra://docs/<slug>`: each documentation page in Markdown, for example
  `kofra://docs/errors/bucket_not_found`.
- `kofra://openapi`: the OpenAPI 3.1 contract of the Kofra API.
- `kofra://errors/<code>`: one entry of the error catalogue as JSON.

## Prompts to try

- "Using the Kofra docs, show me the curl command that creates a bucket."
- "What does the Kofra error `idempotency_key_reused` mean, and how do I fix it?"
- "Which scopes does an API token need to list access keys?"

## The account server

A second MCP server, for managing buckets, keys and usage in your own workspace with your sign-in, comes
later. Until then, use the API with a token.
