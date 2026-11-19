# Bucket not found

Code: `bucket_not_found`
HTTP status: 404
Retryable: no, not without a change

The workspace has no bucket with this name.

## What to do

List your buckets with GET /v1/buckets and use one of the returned names.

## Example

```http
HTTP/1.1 404
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/bucket_not_found",
  "title": "Bucket not found",
  "status": 404,
  "code": "bucket_not_found",
  "detail": "There is no bucket named \"photos\" in this workspace.",
  "hint": "List your buckets with GET /v1/buckets and use one of the returned names.",
  "docs_url": "https://kofra.app/docs/errors/bucket_not_found.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
