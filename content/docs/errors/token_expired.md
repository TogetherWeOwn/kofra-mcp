# API token has expired

Code: `token_expired`
HTTP status: 401
Retryable: no, not without a change

The API token was valid but has passed its expiry time.

## What to do

Create a new API token in the console and use it in place of the expired one.

## Example

```http
HTTP/1.1 401
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/token_expired",
  "title": "API token has expired",
  "status": 401,
  "code": "token_expired",
  "detail": "The API token expired at 2026-11-01T00:00:00Z.",
  "hint": "Create a new API token in the console and use it in place of the expired one.",
  "docs_url": "https://kofra.app/docs/errors/token_expired.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
