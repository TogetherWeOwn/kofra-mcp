# No such endpoint

Code: `not_found`
HTTP status: 404
Retryable: no, not without a change

The path does not name an operation of this API version.

## What to do

Check the path against the API reference at https://api.kofra.app/openapi.json.

## Example

```http
HTTP/1.1 404
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/not_found",
  "title": "No such endpoint",
  "status": 404,
  "code": "not_found",
  "detail": "There is no operation at this path.",
  "hint": "Check the path against the API reference at https://api.kofra.app/openapi.json.",
  "docs_url": "https://kofra.app/docs/errors/not_found.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
