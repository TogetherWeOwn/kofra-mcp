# Same request is still running

Code: `idempotency_key_in_use`
HTTP status: 409
Retryable: yes, after `Retry-After`

A request with this `Idempotency-Key` is still being processed.

## What to do

Wait for the number of seconds in `Retry-After`, then send the identical request again with the same key.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/idempotency_key_in_use",
  "title": "Same request is still running",
  "status": 409,
  "code": "idempotency_key_in_use",
  "detail": "A request with this Idempotency-Key is still in progress.",
  "hint": "Wait for the number of seconds in `Retry-After`, then send the identical request again with the same key.",
  "docs_url": "https://kofra.app/docs/errors/idempotency_key_in_use.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": true
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
