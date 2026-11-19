# Too many active access keys

Code: `key_limit_reached`
HTTP status: 409
Retryable: no, not without a change

A workspace can have at most 20 active access keys at once.

## What to do

Revoke an access key you no longer use with DELETE /v1/keys/{key_id}, then create the new one.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/key_limit_reached",
  "title": "Too many active access keys",
  "status": 409,
  "code": "key_limit_reached",
  "detail": "The workspace already has 20 active access keys.",
  "hint": "Revoke an access key you no longer use with DELETE /v1/keys/{key_id}, then create the new one.",
  "docs_url": "https://kofra.app/docs/errors/key_limit_reached.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
