# Deletion already requested

Code: `deletion_already_requested`
HTTP status: 409
Retryable: no, not without a change

The account already has a deletion in progress or awaiting confirmation.

## What to do

Read GET /v1/account to see the deletion and its dates; cancel it with POST /v1/account/deletion/cancel if it was a mistake.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/deletion_already_requested",
  "title": "Deletion already requested",
  "status": 409,
  "code": "deletion_already_requested",
  "detail": "A deletion of this account was requested at 2026-11-19T10:00:00Z.",
  "hint": "Read GET /v1/account to see the deletion and its dates; cancel it with POST /v1/account/deletion/cancel if it was a mistake.",
  "docs_url": "https://kofra.app/docs/errors/deletion_already_requested.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
