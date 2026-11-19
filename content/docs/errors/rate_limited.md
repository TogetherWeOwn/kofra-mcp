# Too many requests

Code: `rate_limited`
HTTP status: 429
Retryable: yes, after `Retry-After`

The credential or workspace has used up its request allowance for now. The `RateLimit` and `RateLimit-Policy` headers describe the limit that applied.

## What to do

Wait for the number of seconds in `Retry-After`, then retry; spread requests out to stay under the limit.

## Example

```http
HTTP/1.1 429
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/rate_limited",
  "title": "Too many requests",
  "status": 429,
  "code": "rate_limited",
  "detail": "Write requests are limited to 2 per second.",
  "hint": "Wait for the number of seconds in `Retry-After`, then retry; spread requests out to stay under the limit.",
  "docs_url": "https://kofra.app/docs/errors/rate_limited.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": true
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
