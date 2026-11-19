# Service is busy

Code: `service_unavailable`
HTTP status: 503
Retryable: yes, after `Retry-After`

The service is temporarily busy or a dependency is briefly unavailable. Nothing was changed.

## What to do

Wait for the number of seconds in `Retry-After`, then send the same request again.

## Example

```http
HTTP/1.1 503
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/service_unavailable",
  "title": "Service is busy",
  "status": 503,
  "code": "service_unavailable",
  "detail": "The service is busy; try again shortly.",
  "hint": "Wait for the number of seconds in `Retry-After`, then send the same request again.",
  "docs_url": "https://kofra.app/docs/errors/service_unavailable.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": true
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
