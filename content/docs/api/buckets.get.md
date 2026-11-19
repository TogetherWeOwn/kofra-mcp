# Get a bucket

```sh
curl -sS -X GET 'https://api.kofra.app/v1/buckets/backups' \
  -H "Authorization: Bearer $KOFRA_API_TOKEN"
```

Operation `buckets.get`: `GET /v1/buckets/{bucket}`.

Returns one bucket with its size.

Scopes: `buckets:read`.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `bucket` | path | yes | string (BucketName) | The bucket name. |

## Responses

| Status | Description |
|---|---|
| 200 | The bucket. |
| 400 | `unknown_field`, `validation_failed` |
| 401 | `token_expired`, `unauthenticated` |
| 403 | `account_unavailable`, `insufficient_scope` |
| 404 | `bucket_not_found` |
| 429 | `rate_limited` |
| 500 | `internal_error` |
| 503 | `service_unavailable` |

Example `200` body:

```json
{
  "name": "backups",
  "created_at": "2026-11-02T08:00:00Z",
  "stored_bytes": 322122547200,
  "object_count": 1204
}
```

## Error codes

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`account_unavailable`](../errors/account_unavailable.md) | 403 | no | Account is not available |
| [`bucket_not_found`](../errors/bucket_not_found.md) | 404 | no | Bucket not found |
| [`insufficient_scope`](../errors/insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`internal_error`](../errors/internal_error.md) | 500 | no | Internal error |
| [`rate_limited`](../errors/rate_limited.md) | 429 | yes | Too many requests |
| [`service_unavailable`](../errors/service_unavailable.md) | 503 | yes | Service is busy |
| [`token_expired`](../errors/token_expired.md) | 401 | no | API token has expired |
| [`unauthenticated`](../errors/unauthenticated.md) | 401 | no | Authentication required |
| [`unknown_field`](../errors/unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`validation_failed`](../errors/validation_failed.md) | 400 | no | Request is not valid |
