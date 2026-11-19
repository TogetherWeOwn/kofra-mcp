# List access keys

```sh
curl -sS -X GET 'https://api.kofra.app/v1/keys' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

Operation `keys.list`: `GET /v1/keys`.

Lists the workspace's active S3 access keys with their grants. Secrets are never returned.

Scopes: `keys:read`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query | no | integer | Items per page, 1 to 200. |
| `cursor` | query | no | string (Cursor) | The `next_cursor` from the previous page. Omit for the first page. |

## Responses

| Status | Description |
|---|---|
| 200 | One page of access keys. |
| 400 | `invalid_cursor`, `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "data": [
    {
      "id": "KF7Q2M8X4T7R5N0B",
      "name": "nightly-backup",
      "grants": [
        {
          "bucket": "backups",
          "access": "read_write"
        }
      ],
      "created_at": "2026-11-02T08:05:00Z",
      "last_used_at": "2026-11-19T03:00:12Z"
    }
  ],
  "next_cursor": null
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`invalid_cursor`](../errors/invalid_cursor.md) | 400 | no | Cursor is not valid |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
