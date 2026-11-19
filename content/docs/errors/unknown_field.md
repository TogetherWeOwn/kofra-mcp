# Request has a field the API does not know

Code: `unknown_field`
HTTP status: 400
Retryable: no, not without a change

The request body has a field, or the query has a parameter, that the operation does not accept. Unknown fields and parameters are refused so that a misspelt one never silently does nothing.

## What to do

Remove or correct the field or parameter named by `errors[].pointer`; the API reference lists what each operation accepts.

## Example

```http
HTTP/1.1 400
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/unknown_field",
  "title": "Request has a field the API does not know",
  "status": 400,
  "code": "unknown_field",
  "detail": "The field \"/nmae\" is not accepted by this operation.",
  "hint": "Remove or correct the field or parameter named by `errors[].pointer`; the API reference lists what each operation accepts.",
  "docs_url": "https://kofra.app/docs/errors/unknown_field.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
