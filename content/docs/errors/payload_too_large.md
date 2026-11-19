# Request body is too large

Code: `payload_too_large`
HTTP status: 413
Retryable: no, not without a change

Management requests carry small JSON bodies. Object data is never sent to this API; it goes to the S3 endpoint.

## What to do

Send a smaller body; upload object data through the S3 endpoint or a presigned URL instead.

## Example

```http
HTTP/1.1 413
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/payload_too_large",
  "title": "Request body is too large",
  "status": 413,
  "code": "payload_too_large",
  "detail": "The request body is larger than 64 KiB.",
  "hint": "Send a smaller body; upload object data through the S3 endpoint or a presigned URL instead.",
  "docs_url": "https://kofra.app/docs/errors/payload_too_large.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
