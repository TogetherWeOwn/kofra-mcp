# Kofra API errors

Every error is an RFC 9457 `application/problem+json` body with a stable `code`, a one-sentence
`hint` that says what to do next, a `docs_url` to the page for that code, the `request_id`, and
`retryable`. Branch on `code`, never on `title` or `detail`.

| Code | Status | Retryable | Title |
|---|---|---|---|
| [`validation_failed`](validation_failed.md) | 400 | no | Request is not valid |
| [`unknown_field`](unknown_field.md) | 400 | no | Request has a field the API does not know |
| [`invalid_bucket_name`](invalid_bucket_name.md) | 400 | no | Bucket name is not valid |
| [`invalid_cursor`](invalid_cursor.md) | 400 | no | Cursor is not valid |
| [`unauthenticated`](unauthenticated.md) | 401 | no | Authentication required |
| [`token_expired`](token_expired.md) | 401 | no | API token has expired |
| [`insufficient_scope`](insufficient_scope.md) | 403 | no | Token lacks a required scope |
| [`role_forbidden`](role_forbidden.md) | 403 | no | Your role does not allow this |
| [`account_read_only`](account_read_only.md) | 403 | no | Account is read-only |
| [`account_unavailable`](account_unavailable.md) | 403 | no | Account is not available |
| [`not_found`](not_found.md) | 404 | no | No such endpoint |
| [`bucket_not_found`](bucket_not_found.md) | 404 | no | Bucket not found |
| [`key_not_found`](key_not_found.md) | 404 | no | Access key not found |
| [`method_not_allowed`](method_not_allowed.md) | 405 | no | Method not allowed |
| [`payload_too_large`](payload_too_large.md) | 413 | no | Request body is too large |
| [`unsupported_media_type`](unsupported_media_type.md) | 415 | no | Body must be JSON |
| [`bucket_already_exists`](bucket_already_exists.md) | 409 | no | Bucket already exists |
| [`bucket_not_empty`](bucket_not_empty.md) | 409 | no | Bucket is not empty |
| [`key_limit_reached`](key_limit_reached.md) | 409 | no | Too many active access keys |
| [`grant_narrowing_refused`](grant_narrowing_refused.md) | 409 | no | Access can only be widened |
| [`grant_limit_reached`](grant_limit_reached.md) | 409 | no | Too many grants on one key |
| [`deletion_already_requested`](deletion_already_requested.md) | 409 | no | Deletion already requested |
| [`deletion_not_requested`](deletion_not_requested.md) | 409 | no | No deletion to cancel |
| [`deletion_final`](deletion_final.md) | 409 | no | Deletion can no longer be cancelled |
| [`feed_reset`](feed_reset.md) | 409 | no | Event feed was reset |
| [`idempotency_key_in_use`](idempotency_key_in_use.md) | 409 | yes | Same request is still running |
| [`idempotency_key_reused`](idempotency_key_reused.md) | 422 | no | Idempotency key used with another request |
| [`rate_limited`](rate_limited.md) | 429 | yes | Too many requests |
| [`internal_error`](internal_error.md) | 500 | no | Internal error |
| [`service_unavailable`](service_unavailable.md) | 503 | yes | Service is busy |
