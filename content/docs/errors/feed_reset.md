# Event feed was reset

Code: `feed_reset`
HTTP status: 409
Retryable: no, not without a change

The event feed was rebuilt, so cursors issued before the rebuild no longer apply. Some events may not appear in the new feed.

## What to do

Re-read the current state (GET /v1/account, /v1/keys, /v1/usage), then read the feed again without a cursor.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/feed_reset",
  "title": "Event feed was reset",
  "status": 409,
  "code": "feed_reset",
  "detail": "The cursor belongs to an earlier event feed.",
  "hint": "Re-read the current state (GET /v1/account, /v1/keys, /v1/usage), then read the feed again without a cursor.",
  "docs_url": "https://kofra.app/docs/errors/feed_reset.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
