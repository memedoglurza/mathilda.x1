# Security Specification: TheMathilda.x1 Firebase Integration

## 1. Data Invariants
- A workspace document must only be read by the authenticated owner (`userId == request.auth.uid`).
- A workspace document must only be created or modified by its authenticated owner.
- The `userId` property within the document must match the document's path ID (`userId == userId`).
- The `updatedAt` property must be verified with `request.time` to prevent temporal spoofing.

## 2. The "Dirty Dozen" (Red Team Attack Vector Matrix)
1. **Unauthenticated Read**: Attempt to read any document without signing in.
2. **Identity Spoofing Read**: User A tries to read User B's workspace document.
3. **Unauthenticated Write**: Attempt to create/update a workspace document without signing in.
4. **Identity Spoofing Write (Create)**: User A tries to create User B's workspace document.
5. **Identity Spoofing Write (Update)**: User A tries to overwrite User B's workspace document.
6. **Malicious ID Attack**: Attempt to create a document with a non-alphanumeric or massive ID (>128 chars).
7. **Bypass Temporal Integrity**: Attempt to set `updatedAt` to a historical or future manual timestamp instead of the server's time (`request.time`).
8. **Malicious Workspace Payload Injection**: Attempt to write arbitrary fields that don't belong to the `Workspace` entity.
9. **Email Spoofing Attack**: Attacking based on non-verified email auth.
10. **Admin Privilege Escalation**: User tries to write to or create a custom admin entry.
11. **Malicious Storage Upload (Indirect)**: Modifying items database array without matching proper formats.
12. **Denial of Wallet Recursion**: Attacking Firestore collections with excessive queries.

## 3. Security Rules Plan
All operations will undergo static validation (`isValidId()`), strict identity authentication matching (`userId == request.auth.uid`), and temporal validation.
