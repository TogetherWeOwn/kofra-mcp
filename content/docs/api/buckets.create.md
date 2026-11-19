# Create a bucket

```sh
curl -sS -X POST 'https://api.kofra.app/v1/buckets' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"backups"}'
```

Operation `buckets.create`: `POST /v1/buckets`.

Creates an empty bucket. Bucket names are unique within the workspace.

Scopes: `buckets:write`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Request body

`application/json`, required: object (BucketCreate).

```json
{
  "name": "backups"
}
```

## Responses

| Status | Description |
|---|---|
| 201 | The bucket was created. |
| 400 | `invalid_bucket_name`, `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_read_only`, `account_unavailable`, `insufficient_scope`, `role_forbidden` |
| 409 | `bucket_already_exists`, `idempotency_key_in_use` |
| 413 | `payload_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `idempotency_key_reused` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `201` body:

```json
{
  "name": "backups",
  "created_at": "2026-11-19T10:00:00Z",
  "stored_bytes": 0,
  "object_count": 0
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_read_only`](../errors/account_read_only.md) | 403 | no | Account is read-only |
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`bucket_already_exists`](../errors/bucket_already_exists.md) | 409 | no | Bucket already exists |
| [`idempotency_key_in_use`](../errors/idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](../errors/idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`invalid_bucket_name`](../errors/invalid_bucket_name.md) | 400 | no | Bucket name is not valid |
| [`payload_too_large`](../errors/payload_too_large.md) | 413 | no | Request body is too large |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`role_forbidden`](../errors/role_forbidden.md) | 403 | no | Your role does not allow this |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`unsupported_media_type`](../errors/unsupported_media_type.md) | 415 | no | Body must be JSON |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
