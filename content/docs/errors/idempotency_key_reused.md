# Idempotency key used with another request

Code: `idempotency_key_reused`
HTTP status: 422
Retryable: no, not without a change

An `Idempotency-Key` is bound to the first request sent with it for 24 hours, that is to its method, path, query and body. The same key with a different method, path, query or body is refused, so `dry_run=true` and the same request without it need different keys (`dry_run=false` and an omitted `dry_run` are the same request).

## What to do

Use a new Idempotency-Key for a different request; reuse a key only to repeat the identical request.

## Example

```http
HTTP/1.1 422
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/idempotency_key_reused",
  "title": "Idempotency key used with another request",
  "status": 422,
  "code": "idempotency_key_reused",
  "detail": "This Idempotency-Key was first used with a different body.",
  "hint": "Use a new Idempotency-Key for a different request; reuse a key only to repeat the identical request.",
  "docs_url": "https://kofra.app/docs/errors/idempotency_key_reused.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
