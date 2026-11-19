# Kofra API reference

One page per operation. Every page opens with a runnable `curl` example; set `KOFRA_API_TOKEN` to an API token first. Base URL: `https://api.kofra.app`. The contract itself is the `kofra://openapi` resource of this server.

## Account

| Operation | Method and path | Summary |
|---|---|---|
| [`account.get`](account.get.md) | `GET /v1/account` | Get the account |
| [`account.delete`](account.delete.md) | `DELETE /v1/account` | Request deletion of the account |
| [`account.cancel_deletion`](account.cancel_deletion.md) | `POST /v1/account/deletion/cancel` | Cancel a deletion |

## Buckets

| Operation | Method and path | Summary |
|---|---|---|
| [`buckets.list`](buckets.list.md) | `GET /v1/buckets` | List buckets |
| [`buckets.create`](buckets.create.md) | `POST /v1/buckets` | Create a bucket |
| [`buckets.get`](buckets.get.md) | `GET /v1/buckets/{bucket}` | Get a bucket |
| [`buckets.delete`](buckets.delete.md) | `DELETE /v1/buckets/{bucket}` | Delete a bucket |

## Access keys

| Operation | Method and path | Summary |
|---|---|---|
| [`keys.list`](keys.list.md) | `GET /v1/keys` | List access keys |
| [`keys.create`](keys.create.md) | `POST /v1/keys` | Create an access key |
| [`keys.update`](keys.update.md) | `PATCH /v1/keys/{key_id}` | Update an access key |
| [`keys.revoke`](keys.revoke.md) | `DELETE /v1/keys/{key_id}` | Revoke an access key |

## Usage

| Operation | Method and path | Summary |
|---|---|---|
| [`usage.get`](usage.get.md) | `GET /v1/usage` | Get current usage |
| [`usage.days`](usage.days.md) | `GET /v1/usage/days` | List daily usage |
| [`usage.buckets`](usage.buckets.md) | `GET /v1/usage/buckets` | List usage per bucket |

## Events

| Operation | Method and path | Summary |
|---|---|---|
| [`events.list`](events.list.md) | `GET /v1/events` | Read the event feed |

## Objects

| Operation | Method and path | Summary |
|---|---|---|
| [`objects.presign`](objects.presign.md) | `POST /v1/objects/presign` | Create a presigned URL |
