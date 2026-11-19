# Access can only be widened

Code: `grant_narrowing_refused`
HTTP status: 409
Retryable: no, not without a change

An access key's permission on a bucket can be added or widened (from read to read_write), never narrowed. A narrowed grant could silently become wide again after a recovery, so narrowing is refused.

## What to do

Create a new key with the narrower access, move your tools to it, then revoke the old key.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/grant_narrowing_refused",
  "title": "Access can only be widened",
  "status": 409,
  "code": "grant_narrowing_refused",
  "detail": "The key has read_write on \"photos\"; it cannot be narrowed to read.",
  "hint": "Create a new key with the narrower access, move your tools to it, then revoke the old key.",
  "docs_url": "https://kofra.app/docs/errors/grant_narrowing_refused.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
