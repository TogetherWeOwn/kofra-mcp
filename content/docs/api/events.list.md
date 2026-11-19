# Read the event feed

```sh
curl -sS -X GET 'https://api.kofra.app/v1/events' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

Operation `events.list`: `GET /v1/events`.

Events for this workspace, oldest first, kept 30 days. Start without a
cursor, then pass each `next_cursor`. At the end of the feed
`next_cursor` is the position to poll from next, not `null`. If the
feed was rebuilt, an old cursor answers `feed_reset`.

Event types use `resource.verb_past` names, for example `key.created`,
`key.revoked`, `usage.limit_reached`, `account.suspended`. New types
may be added within `/v1`; ignore types you do not know.

Scopes: `events:read`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query | no | integer | Items per page, 1 to 200. |
| `cursor` | query | no | string (Cursor) | The `next_cursor` from the previous page. Omit for the first page. |

## Responses

| Status | Description |
|---|---|
| 200 | One page of events. |
| 400 | `invalid_cursor`, `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope` |
| 409 | `feed_reset` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "data": [
    {
      "id": "evt_01jd3n4c8t0m5y7q9s1u3w5x7z",
      "type": "key.created",
      "created_at": "2026-11-19T10:00:00Z",
      "data": {
        "key_id": "KF7Q2M8X4T7R5N0B"
      }
    }
  ],
  "next_cursor": "ec_7Hq2Lk9P"
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`feed_reset`](../errors/feed_reset.md) | 409 | no | Event feed was reset |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`invalid_cursor`](../errors/invalid_cursor.md) | 400 | no | Cursor is not valid |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
