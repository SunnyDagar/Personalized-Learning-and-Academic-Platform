## Tenant Licence Control

The server-edge licence component acts as the commercial control point on the customer's side.

Every protected request uses the tenant key configured in `TENANT_KEY`. The edge checks that a key is present before traffic leaves the customer environment. It can also check whether the key follows the expected format.

The upstream service remains the authoritative licence checker because a key may be suspended, expired, revoked, or unrecognized at any time.

### Licence Key Format

A well-formed tenant key:

- starts with `ck_`
- contains 16 to 32 characters after the prefix
- uses only lowercase hexadecimal characters: `0-9` and `a-f`

Valid example:

```text
ck_0123456789abcdef

