# Bucket name is not valid

Code: `invalid_bucket_name`
HTTP status: 400
Retryable: no, not without a change

Bucket names are 3 to 63 characters of lowercase letters, digits and hyphens, and start and end with a letter or digit.

## What to do

Choose a name of 3 to 63 lowercase letters, digits or hyphens that starts and ends with a letter or digit.

## Example

```http
HTTP/1.1 400
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/invalid_bucket_name",
  "title": "Bucket name is not valid",
  "status": 400,
  "code": "invalid_bucket_name",
  "detail": "The bucket name \"My_Photos\" contains characters that are not allowed.",
  "hint": "Choose a name of 3 to 63 lowercase letters, digits or hyphens that starts and ends with a letter or digit.",
  "docs_url": "https://kofra.app/docs/errors/invalid_bucket_name.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
