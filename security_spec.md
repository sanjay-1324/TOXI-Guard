# ToxiGuard Firestore Security Specification

## 1. Data Invariants
1. **Report Ownership & Workflow Integrity**: Every document in `/reports/{reportId}` must originate from a verified signed-in user (`request.auth.uid == incoming().reporterId` and `email_verified == true`), start in `"pending"` status with empty `adminNote` and `reviewedBy`, and carry server-enforced `createdAt == request.time` and `updatedAt == request.time`.
2. **Moderation Privilege Separation**: Standard users may only create `"pending"` reports for themselves, read/list their own reports, and delete their own `"pending"` reports. Only verified Administrators (`kumarasanjay1324@gmail.com` with `email_verified == true`, or a verified record in `/admins/{uid}`) may review, update status (`confirmed_toxic`, `dismissed`, `escalated`), or delete any report.
3. **Terminal State Locking**: Once a report moves out of `"pending"` (to `"confirmed_toxic"`, `"dismissed"`, or `"escalated"`), non-admin users cannot alter it, and admins may still correct moderation states with `updatedAt == request.time`.
4. **Private Analysis Isolation**: Documents under `/users/{userId}/analyses/{analysisId}` are strictly owned by `{userId}` (`request.auth.uid == userId`), immutable after creation, and never listable by other non-admin users.
5. **Anti-Spoofing & Anti-Exhaustion**: Every string field enforces strict `.size()` bounds, IDs match `^[a-zA-Z0-9_\\-]+$`, arrays are capped (`flaggedWords.size() <= 25`), and `keys().hasOnly(...)` rejects shadow fields.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Report Create**: Anonymous client posts a report to `/reports/r1` without `request.auth`.
2. **Identity Spoofing on Create**: User `alice` tries to create `/reports/r2` with `reporterId: "bob"`.
3. **Status Shortcutting on Create**: User `alice` creates `/reports/r3` with `status: "confirmed_toxic"` instead of `"pending"`.
4. **Shadow Field Injection**: User `alice` creates `/reports/r4` including an undocumented ghost key `isPriorityOverride: true`.
5. **Unverified Email Bypass**: User with `email_verified: false` attempts to create `/reports/r5` or spoof admin email.
6. **Non-Admin Moderation Update**: Regular user `alice` tries to update `/reports/r1` to `status: "dismissed"`.
7. **Immutable Field Tampering**: Admin or user tries to change `reporterId` or `createdAt` during an update on `/reports/r1`.
8. **Timestamp Forgery**: Client sends a past or future `createdAt` instead of `serverTimestamp()` (`request.time`).
9. **Resource Poisoning / Oversized String**: Client sends a 5,000-character `commentText` or 500-character document ID `{reportId}`.
10. **Unbounded Array Attack**: Client sends 100 items in `flaggedWords` or a non-string element `[123]` in `flaggedWords`.
11. **Cross-User PII / Report Scraping (`list`)**: Regular user `alice` queries `/reports` without `where("reporterId", "==", alice.uid)`.
12. **Self-Assigned Admin Escalation**: Regular user `alice` tries to write `/admins/alice` with `role: "admin"`.
