# Revoke an access key

```sh
curl -sS -X DELETE 'https://api.kofra.app/v1/keys/KF7Q2M8X4T7R5N0B?dry_run=true' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

The example sends `dry_run=true`: the answer shows what would change and nothing changes. Remove it to make the change.

Operation `keys.revoke`: `DELETE /v1/keys/{key_id}`.

Revokes the key. Requests signed with it, presigned URLs included, are
refused from then on. Revocation is final; the key disappears from the
list, so a second revoke answers `key_not_found`.

Scopes: `keys:write`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `key_id` | path | yes | string (AccessKeyId) | The access key ID. |
| `dry_run` | query | no | boolean | When `true`, answer `200` with the plan of what would change, and change nothing. |
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Responses

| Status | Description |
|---|---|
| 200 | Dry run. What the revocation would do; nothing was changed. |
| 204 | The key was revoked. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope`, `role_forbidden` |
| 404 | `key_not_found` |
| 409 | `idempotency_key_in_use` |
| 422 | `idempotency_key_reused` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`idempotency_key_in_use`](../errors/idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](../errors/idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`key_not_found`](../errors/key_not_found.md) | 404 | no | Access key not found |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`role_forbidden`](../errors/role_forbidden.md) | 403 | no | Your role does not allow this |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
