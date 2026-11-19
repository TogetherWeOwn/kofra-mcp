# Deletion can no longer be cancelled

Code: `deletion_final`
HTTP status: 409
Retryable: no, not without a change

The deletion has passed its last cancellation time. Deleted data is cryptographically erased (its encryption key is destroyed), so it can never be read again.

## What to do

No action can restore this data; contact support with the `request_id` if you believe this is wrong.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/deletion_final",
  "title": "Deletion can no longer be cancelled",
  "status": 409,
  "code": "deletion_final",
  "detail": "The deletion became final at 2026-12-19T10:00:00Z.",
  "hint": "No action can restore this data; contact support with the `request_id` if you believe this is wrong.",
  "docs_url": "https://kofra.app/docs/errors/deletion_final.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
