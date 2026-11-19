# Cancel a deletion

```sh
curl -sS -X POST 'https://api.kofra.app/v1/account/deletion/cancel' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

Operation `account.cancel_deletion`: `POST /v1/account/deletion/cancel`.

Cancels a deletion that is waiting for confirmation or scheduled, as
long as `erase_at` has not passed. The account, its buckets and its keys
work again at once.

Scopes: `account:delete`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Responses

| Status | Description |
|---|---|
| 200 | The deletion was cancelled; the account as it is now. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `insufficient_scope`, `role_forbidden` |
| 409 | `deletion_final`, `deletion_not_requested`, `idempotency_key_in_use` |
| 422 | `idempotency_key_reused` |
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
| [`deletion_final`](../errors/deletion_final.md) | 409 | no | Deletion can no longer be cancelled |
| [`deletion_not_requested`](../errors/deletion_not_requested.md) | 409 | no | No deletion to cancel |
| [`idempotency_key_in_use`](../errors/idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](../errors/idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`role_forbidden`](../errors/role_forbidden.md) | 403 | no | Your role does not allow this |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
