# Authentication required

Code: `unauthenticated`
HTTP status: 401
Retryable: no, not without a change

The request has no `Authorization` header, or the bearer token in it is not a valid Kofra API token.

## What to do

Send `Authorization: Bearer <token>` with an API token from the console (Account, API tokens).

## Example

```http
HTTP/1.1 401
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/unauthenticated",
  "title": "Authentication required",
  "status": 401,
  "code": "unauthenticated",
  "detail": "The request has no valid bearer token.",
  "hint": "Send `Authorization: Bearer <token>` with an API token from the console (Account, API tokens).",
  "docs_url": "https://kofra.app/docs/errors/unauthenticated.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
