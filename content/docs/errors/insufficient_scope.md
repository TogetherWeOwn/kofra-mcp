# Token lacks a required scope

Code: `insufficient_scope`
HTTP status: 403
Retryable: no, not without a change

The API token is valid but does not carry the scope this operation needs. The scopes needed are listed in the operation's description.

## What to do

Use a token that has the scope named in `detail`, or create one with that scope in the console.

## Example

```http
HTTP/1.1 403
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/insufficient_scope",
  "title": "Token lacks a required scope",
  "status": 403,
  "code": "insufficient_scope",
  "detail": "This operation needs the scope \"buckets:write\".",
  "hint": "Use a token that has the scope named in `detail`, or create one with that scope in the console.",
  "docs_url": "https://kofra.app/docs/errors/insufficient_scope.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
