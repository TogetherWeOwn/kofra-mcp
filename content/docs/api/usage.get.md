# Get current usage

```sh
curl -sS -X GET 'https://api.kofra.app/v1/usage' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

Operation `usage.get`: `GET /v1/usage`.

Current stored bytes, upload and download totals, and how close they are to the account's limits.

Scopes: `usage:read`.

## Parameters

None.

## Responses

| Status | Description |
|---|---|
| 200 | Current usage. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "as_of": "2026-11-19T10:00:00Z",
  "stored_bytes": 442381631488,
  "object_count": 18342,
  "storage_limit_bytes": 1099511627776,
  "over_limit": null,
  "upload_24h": {
    "limit_bytes": 214748364800,
    "used_bytes": 5368709120,
    "remaining_bytes": 209379655680,
    "resets_at": "2026-11-20T00:00:00Z"
  },
  "downloads": {
    "period_start": "2026-11-01T00:00:00Z",
    "allowance_bytes": 1099511627776,
    "used_bytes": 21474836480,
    "over_bytes": 0
  },
  "open_uploads": {
    "count": 2,
    "limit": 1000
  }
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
