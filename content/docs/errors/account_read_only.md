# Account is read-only

Code: `account_read_only`
HTTP status: 403
Retryable: no, not without a change

The account is suspended in read-only mode. Reads, lists and deletes work; anything that adds data or credentials is refused.

## What to do

Resolve the reason shown under Account in the console (often a payment); writes work again as soon as the account is active.

## Example

```http
HTTP/1.1 403
Content-Type: application/problem+json
Kofra-Request-Id: req_01jd3examplerequestid0000
```

```json
{
  "type": "https://kofra.app/docs/errors/account_read_only",
  "title": "Account is read-only",
  "status": 403,
  "code": "account_read_only",
  "detail": "The account is read-only, so new buckets cannot be created.",
  "hint": "Resolve the reason shown under Account in the console (often a payment); writes work again as soon as the account is active.",
  "docs_url": "https://kofra.app/docs/errors/account_read_only.md",
  "request_id": "req_01jd3examplerequestid0000",
  "retryable": false
}
```

The `code` field is stable within `/v1`; `title` and `detail` may be reworded.
