# Bucket already exists

Code: `bucket_already_exists`
HTTP status: 409
Retryable: no, not without a change

The workspace already has a bucket with this name.

## What to do

Choose another name, or use the existing bucket.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/bucket_already_exists",
  "title": "Bucket already exists",
  "status": 409,
  "code": "bucket_already_exists",
  "detail": "A bucket named \"photos\" already exists.",
  "hint": "Choose another name, or use the existing bucket.",
  "docs_url": "https://kofra.app/docs/errors/bucket_already_exists.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
