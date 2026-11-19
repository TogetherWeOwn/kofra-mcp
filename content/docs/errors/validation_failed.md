# Request is not valid

Code: `validation_failed`
HTTP status: 400
Retryable: no, not without a change

One or more request fields, path parameters or query parameters do not match the API description. The `errors` list names each field with a JSON pointer.

## What to do

Fix each field listed in `errors` (the `pointer` names it), then send the request again.

## Example

```http
HTTP/1.1 400
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/validation_failed",
  "title": "Request is not valid",
  "status": 400,
  "code": "validation_failed",
  "detail": "The request has 1 invalid field.",
  "hint": "Fix each field listed in `errors` (the `pointer` names it), then send the request again.",
  "docs_url": "https://kofra.app/docs/errors/validation_failed.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
