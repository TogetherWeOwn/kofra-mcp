# Account is not available

Code: `account_unavailable`
HTTP status: 403
Retryable: no, not without a change

The account is blocked or is being deleted, so only reading the account itself and cancelling a deletion are possible.

## What to do

Open Account in the console to see the reason; a deletion can be cancelled there or with POST /v1/account/deletion/cancel.

## Example

```http
HTTP/1.1 403
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/account_unavailable",
  "title": "Account is not available",
  "status": 403,
  "code": "account_unavailable",
  "detail": "The account is being deleted.",
  "hint": "Open Account in the console to see the reason; a deletion can be cancelled there or with POST /v1/account/deletion/cancel.",
  "docs_url": "https://kofra.app/docs/errors/account_unavailable.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
