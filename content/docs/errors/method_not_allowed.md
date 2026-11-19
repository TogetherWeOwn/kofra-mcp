# Method not allowed

Code: `method_not_allowed`
HTTP status: 405
Retryable: no, not without a change

The path exists, but not with this HTTP method. The `Allow` header lists the methods it accepts.

## What to do

Use one of the methods in the `Allow` header.

## Example

```http
HTTP/1.1 405
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/method_not_allowed",
  "title": "Method not allowed",
  "status": 405,
  "code": "method_not_allowed",
  "detail": "PUT is not allowed on /v1/buckets.",
  "hint": "Use one of the methods in the `Allow` header.",
  "docs_url": "https://kofra.app/docs/errors/method_not_allowed.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
