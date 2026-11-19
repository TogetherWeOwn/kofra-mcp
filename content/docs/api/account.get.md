# Get the account

```sh
curl -sS -X GET 'https://api.kofra.app/v1/account' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

Operation `account.get`: `GET /v1/account`.

Returns the workspace's state, limits, S3 endpoint and any deletion in progress.

Scopes: `account:read`.

## Parameters

None.

## Responses

| Status | Description |
|---|---|
| 200 | The account. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `insufficient_scope` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "id": "ws_01jd3k9v6q2m8x4t7r5n0b1c2d",
  "state": "active",
  "access": "full",
  "s3_endpoint": "https://s3.kofra.io",
  "limits": {
    "storage_bytes": 1099511627776,
    "upload_24h_bytes": 214748364800,
    "download_allowance_bytes": 1099511627776,
    "active_keys": 20
  },
  "suspension": null,
  "deletion": null,
  "created_at": "2026-11-01T09:30:00Z"
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
