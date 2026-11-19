# Too many grants on one key

Code: `grant_limit_reached`
HTTP status: 409
Retryable: no, not without a change

An access key can hold grants on at most 32 buckets.

## What to do

Create a second access key for the remaining buckets.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/grant_limit_reached",
  "title": "Too many grants on one key",
  "status": 409,
  "code": "grant_limit_reached",
  "detail": "The key already has grants on 32 buckets.",
  "hint": "Create a second access key for the remaining buckets.",
  "docs_url": "https://kofra.app/docs/errors/grant_limit_reached.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
