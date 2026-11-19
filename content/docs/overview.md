# Kofra API conventions

The Kofra API manages a storage workspace: buckets, S3 access keys, usage, the account's state and its
event feed. Object data never goes through this API; read and write objects through the S3 endpoint with
any S3 tool, or with a presigned URL from `POST /v1/objects/presign`.

```sh
export KOFRA_API_TOKEN='...'   # an API token from the console
curl -sS https://api.kofra.app/v1/buckets -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

**Status: draft.** The contract is published ahead of the service.

## Authentication

Send `Authorization: Bearer <API token>`. A token belongs to exactly one workspace, so paths carry no
workspace ID. Tokens carry scopes such as `buckets:read` or `keys:write`; each reference page names the
scopes its operation needs.

## Errors

Every error is an RFC 9457 `application/problem+json` body with a stable `code`, a one-sentence `hint`
that says what to do next, a `docs_url`, the `request_id` and `retryable`. Branch on `code`, never on
`title` or `detail`. The [error catalogue](errors/index.md) lists every code.

## Lists

Lists use cursor pagination: `limit` (1 to 200, default 50) and `cursor`. The body has `data` and
`next_cursor`, which is `null` on the last page, and a `Link: <...>; rel="next"` header repeats it.

## Writes

`POST`, `PATCH` and `DELETE` accept an `Idempotency-Key` header, kept for 24 hours: a retry with the same
key and the same request returns the first answer. Destructive operations accept `dry_run=true`, which
answers with the plan and changes nothing.

## Headers on every response

`Kofra-Request-Id` identifies the request; quote it to support. `RateLimit` and `RateLimit-Policy`
describe the rate limits. `429` and `503` answers also carry `Retry-After`.

## Compatibility within /v1

Unknown request fields are refused with `unknown_field`. Clients must ignore unknown response fields:
new fields are added within `/v1`. Timestamps are RFC 3339 UTC. Sizes are integers in bytes, in fields
whose names end in `_bytes`.

## Reference

The [API reference](api/index.md) has one page per operation, each opening with a runnable `curl`
example. The machine-readable contract is at `https://api.kofra.app/openapi.json`.
