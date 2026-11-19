# Create an access key

```sh
curl -sS -X POST 'https://api.kofra.app/v1/keys' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"nightly-backup","grants":[{"bucket":"backups","access":"read_write"}]}'
```

Operation `keys.create`: `POST /v1/keys`.

Creates an S3 access key pair with access to the listed buckets. The
secret is in this response only; store it at once. A replay of the same
request with the same `Idempotency-Key` returns the key with
`secret_access_key: null`: revoke that key and create a new one if the
secret was lost.

Whoever holds a key with access to a bucket can read its objects, so
`keys:write` is treated as data access. The grants cannot exceed the
caller's own access: a grant on a bucket, or an access level, that the
caller's role does not allow is refused with `role_forbidden`.

Through the MCP tool `keys_create`, the secret is not in the tool
result: the result links to a console page that shows it once.

Scopes: `keys:write`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Request body

`application/json`, required: object (AccessKeyCreate).

```json
{
  "name": "nightly-backup",
  "grants": [
    {
      "bucket": "backups",
      "access": "read_write"
    }
  ]
}
```

## Responses

| Status | Description |
|---|---|
| 201 | The key was created. The secret is shown once. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_read_only`, `account_unavailable`, `insufficient_scope`, `role_forbidden` |
| 404 | `bucket_not_found` |
| 409 | `idempotency_key_in_use`, `key_limit_reached` |
| 413 | `payload_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `idempotency_key_reused` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `201` body:

```json
{
  "id": "KF7Q2M8X4T7R5N0B",
  "name": "nightly-backup",
  "grants": [
    {
      "bucket": "backups",
      "access": "read_write"
    }
  ],
  "created_at": "2026-11-19T10:00:00Z",
  "last_used_at": null,
  "secret_access_key": "EXAMPLEsecretEXAMPLEsecretEXAMPLE0000000",
  "s3_endpoint": "https://s3.kofra.io"
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_read_only`](../errors/account_read_only.md) | 403 | no | Account is read-only |
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`bucket_not_found`](../errors/bucket_not_found.md) | 404 | no | Bucket not found |
| [`idempotency_key_in_use`](../errors/idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](../errors/idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`key_limit_reached`](../errors/key_limit_reached.md) | 409 | no | Too many active access keys |
| [`payload_too_large`](../errors/payload_too_large.md) | 413 | no | Request body is too large |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`role_forbidden`](../errors/role_forbidden.md) | 403 | no | Your role does not allow this |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`unsupported_media_type`](../errors/unsupported_media_type.md) | 415 | no | Body must be JSON |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
