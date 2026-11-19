# Bucket is not empty

Code: `bucket_not_empty`
HTTP status: 409
Retryable: no, not without a change

A bucket can be deleted only when it holds no objects. Objects are deleted through the S3 endpoint.

## What to do

Delete every object in the bucket with your S3 tool, then delete the bucket again.

## Example

```http
HTTP/1.1 409
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/bucket_not_empty",
  "title": "Bucket is not empty",
  "status": 409,
  "code": "bucket_not_empty",
  "detail": "Bucket \"photos\" still holds 1,204 objects.",
  "hint": "Delete every object in the bucket with your S3 tool, then delete the bucket again.",
  "docs_url": "https://kofra.app/docs/errors/bucket_not_empty.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
