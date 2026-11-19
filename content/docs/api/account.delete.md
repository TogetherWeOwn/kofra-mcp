# Request deletion of the account

```sh
curl -sS -X DELETE 'https://api.kofra.app/v1/account?dry_run=true' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

The example sends `dry_run=true`: the answer shows what would change and nothing changes. Remove it to make the change.

Operation `account.delete`: `DELETE /v1/account`.

Starts a deletion of the whole workspace. The deletion is not scheduled
until a signed-in Owner confirms it in the console: the answer carries
the `confirm_url` to open. Until it is confirmed, nothing changes.

After confirmation every bucket, object and key stops being reachable,
and the data is cryptographically erased at `erase_at`. Until then the
deletion can be cancelled with `POST /v1/account/deletion/cancel`.

Scopes: `account:delete`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `dry_run` | query | no | boolean | When `true`, answer `200` with the plan of what would change, and change nothing. |
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Responses

| Status | Description |
|---|---|
| 200 | Dry run. What the deletion would do; nothing was changed. |
| 202 | The deletion request was created and waits for confirmation in the console. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope`, `role_forbidden` |
| 409 | `deletion_already_requested`, `idempotency_key_in_use` |
| 422 | `idempotency_key_reused` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `202` body:

```json
{
  "status": "pending_confirmation",
  "reason": "customer",
  "requested_at": "2026-11-19T10:00:00Z",
  "confirm_url": "https://console.kofra.app/confirm/del_01jd3m2b7s9k4x6p8r0t1v3w5y",
  "confirm_by": "2026-11-19T10:15:00Z",
  "erase_at": null
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`deletion_already_requested`](../errors/deletion_already_requested.md) | 409 | no | Deletion already requested |
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
