# Access key not found

Code: `key_not_found`
HTTP status: 404
Retryable: no, not without a change

The workspace has no active access key with this ID. Revoked keys are removed, so a second revoke of the same key also answers this code.

## What to do

List your access keys with GET /v1/keys and use one of the returned IDs.

## Example

```http
HTTP/1.1 404
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/key_not_found",
  "title": "Access key not found",
  "status": 404,
  "code": "key_not_found",
  "detail": "There is no active access key with this ID.",
  "hint": "List your access keys with GET /v1/keys and use one of the returned IDs.",
  "docs_url": "https://kofra.app/docs/errors/key_not_found.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
