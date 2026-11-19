# No deletion to cancel

Code: `deletion_not_requested`
HTTP status: 409
Retryable: no, not without a change

The account has no deletion in progress, so there is nothing to cancel.

## What to do

No action is needed; the account is not being deleted.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/deletion_not_requested",
  "title": "No deletion to cancel",
  "status": 409,
  "code": "deletion_not_requested",
  "detail": "This account has no deletion in progress.",
  "hint": "No action is needed; the account is not being deleted.",
  "docs_url": "https://kofra.app/docs/errors/deletion_not_requested.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
