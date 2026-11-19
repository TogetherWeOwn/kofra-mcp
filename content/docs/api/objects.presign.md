# Create a presigned URL

```sh
curl -sS -X POST 'https://api.kofra.app/v1/objects/presign' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"bucket":"backups","key":"2026/11/19/db.tar.zst","method":"GET","expires_in_seconds":600}'
```

Operation `objects.presign`: `POST /v1/objects/presign`.

Returns a URL on the S3 endpoint that downloads one object without
further credentials, valid for at most 15 minutes. Anyone who has the
URL can use it until it expires.

Scopes: `objects:read`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `Idempotency-Key` | header | no | string | Makes a retry safe: the same key and the same request within 24 hours return the first answer. The key is bound to the method, the path, the query and the body of its first request: `dry_run=true` and a request without it (or with `dry_run=false`, which is the same request) are different requests and need different keys. 1 to 255 printable ASCII characters; a UUID is a good choice. |

## Request body

`application/json`, required: object (PresignRequest).

```json
{
  "bucket": "backups",
  "key": "2026/11/19/db.tar.zst",
  "method": "GET",
  "expires_in_seconds": 600
}
```

## Responses

| Status | Description |
|---|---|
| 200 | The presigned URL. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope`, `role_forbidden` |
| 404 | `bucket_not_found` |
| 409 | `idempotency_key_in_use` |
| 413 | `payload_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `idempotency_key_reused` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "method": "GET",
  "url": "https://s3.kofra.io/backups/2026/11/19/db.tar.zst?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=600&X-Amz-Signature=EXAMPLE",
  "expires_at": "2026-11-19T10:10:00Z"
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`bucket_not_found`](../errors/bucket_not_found.md) | 404 | no | Bucket not found |
| [`idempotency_key_in_use`](../errors/idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](../errors/idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`payload_too_large`](../errors/payload_too_large.md) | 413 | no | Request body is too large |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`role_forbidden`](../errors/role_forbidden.md) | 403 | no | Your role does not allow this |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`unsupported_media_type`](../errors/unsupported_media_type.md) | 415 | no | Body must be JSON |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
