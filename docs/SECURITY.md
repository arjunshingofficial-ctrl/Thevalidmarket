# SECURITY.md - Security Guidelines

## Authentication & Authorization
- **JWT / Server Sessions:** Secure HTTP-only cookies for session management.
- **RBAC:** Strict Role-Based Access Control verified on the *server-side* for every admin/protected route.
- **Passwords:** Argon2 or bcrypt hashing.

## Data Protection
- **Tenant Isolation:** Users can only access their own orders, downloads, and tickets. Database queries MUST always filter by `user_id` when accessing private data.
- **Paid Files:** Stored in private buckets. Accessible only via short-lived, signed URLs generated after entitlement verification. No public URLs.

## Application Security
- **Input Validation:** Zod schemas for all incoming data (forms, API routes).
- **CSRF & XSS:** Next.js built-in protections, strict React sanitization.
- **Rate Limiting:** Protect login, registration, and checkout endpoints from abuse.

## Payments
- **Webhook Verification:** Cryptographic signature verification for all incoming payment webhooks to prevent spoofing.
- **State Machine:** Orders unlock ONLY when backend payment state transitions to PAID based on verified provider callbacks.

## Auditing
- **Audit Logs:** All admin actions (price changes, product edits, refunds, customer suspensions) are logged to the `audit_logs` table.
