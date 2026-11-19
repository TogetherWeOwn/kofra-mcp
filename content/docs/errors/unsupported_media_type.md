# Body must be JSON

Code: `unsupported_media_type`
HTTP status: 415
Retryable: no, not without a change

Request bodies must be sent as `application/json`.

## What to do

Send the body as JSON with the header `Content-Type: application/json`.

## Example

```http
HTTP/1.1 415
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/unsupported_media_type",
  "title": "Body must be JSON",
  "status": 415,
  "code": "unsupported_media_type",
  "detail": "The body was sent as text/plain.",
  "hint": "Send the body as JSON with the header `Content-Type: application/json`.",
  "docs_url": "https://kofra.app/docs/errors/unsupported_media_type.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
