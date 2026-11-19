# Your role does not allow this

Code: `role_forbidden`
HTTP status: 403
Retryable: no, not without a change

The token has the scope, but the member it belongs to has a workspace role that does not allow the operation. Effective permission is the token's scopes limited by the member's role.

## What to do

Ask a workspace Owner or Admin to change your role, or to perform the operation.

## Example

```http
HTTP/1.1 403
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/role_forbidden",
  "title": "Your role does not allow this",
  "status": 403,
  "code": "role_forbidden",
  "detail": "The Viewer role cannot create buckets.",
  "hint": "Ask a workspace Owner or Admin to change your role, or to perform the operation.",
  "docs_url": "https://kofra.app/docs/errors/role_forbidden.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
