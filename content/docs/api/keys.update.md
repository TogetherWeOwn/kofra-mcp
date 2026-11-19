# Update an access key

```sh
curl -sS -X PATCH 'https://api.kofra.app/v1/keys/KF7Q2M8X4T7R5N0B' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"grants":[{"bucket":"photos","access":"read"}]}'
```

Operation `keys.update`: `PATCH /v1/keys/{key_id}`.

Renames a key, or adds or widens its grants. A grant is never narrowed
(`read_write` to `read`) or removed: create a new key with the narrower
access and revoke this one. Grants not listed are left as they are.

Scopes: `keys:write`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `key_id` | path | yes | string (AccessKeyId) | The access key ID. |
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Request body

`application/json`, required: object (AccessKeyUpdate).

```json
{
  "grants": [
    {
      "bucket": "photos",
      "access": "read"
    }
  ]
}
```

## Responses

| Status | Description |
|---|---|
| 200 | The key as it is now. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_read_only`, `account_unavailable`, `insufficient_scope`, `role_forbidden` |
| 404 | `bucket_not_found`, `key_not_found` |
| 409 | `grant_limit_reached`, `grant_narrowing_refused`, `idempotency_key_in_use` |
| 413 | `payload_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `idempotency_key_reused` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "id": "KF7Q2M8X4T7R5N0B",
  "name": "nightly-backup",
  "grants": [
    {
      "bucket": "backups",
      "access": "read_write"
    },
    {
      "bucket": "photos",
      "access": "read"
    }
  ],
  "created_at": "2026-11-02T08:05:00Z",
  "last_used_at": "2026-11-19T03:00:12Z"
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_read_only`](../errors/account_read_only.md) | 403 | no | Account is read-only |
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`bucket_not_found`](../errors/bucket_not_found.md) | 404 | no | Bucket not found |
| [`grant_limit_reached`](../errors/grant_limit_reached.md) | 409 | no | Too many grants on one key |
| [`grant_narrowing_refused`](../errors/grant_narrowing_refused.md) | 409 | no | Access can only be widened |
| [`idempotency_key_in_use`](../errors/idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](../errors/idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`key_not_found`](../errors/key_not_found.md) | 404 | no | Access key not found |
| [`payload_too_large`](../errors/payload_too_large.md) | 413 | no | Request body is too large |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`role_forbidden`](../errors/role_forbidden.md) | 403 | no | Your role does not allow this |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`unsupported_media_type`](../errors/unsupported_media_type.md) | 415 | no | Body must be JSON |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
