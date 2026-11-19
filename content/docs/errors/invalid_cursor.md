# Cursor is not valid

Code: `invalid_cursor`
HTTP status: 400
Retryable: no, not without a change

The `cursor` value was not returned by this operation, was changed, or has expired.

## What to do

Start again without `cursor`, then pass only the `next_cursor` values the API returns.

## Example

```http
HTTP/1.1 400
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/invalid_cursor",
  "title": "Cursor is not valid",
  "status": 400,
  "code": "invalid_cursor",
  "detail": "The cursor is not valid for this list.",
  "hint": "Start again without `cursor`, then pass only the `next_cursor` values the API returns.",
  "docs_url": "https://kofra.app/docs/errors/invalid_cursor.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
