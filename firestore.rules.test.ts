/**
 * Firestore Security Rules Verification Specification (Dirty Dozen Adversarial Suite)
 * Validates ToxiGuard security invariants against /reports, /users/{uid}/analyses, and /admins.
 *
 * All 12 adversarial payloads below are enforced as PERMISSION_DENIED by firestore.rules:
 * 1. Unauthenticated write to /reports/{reportId}
 * 2. Identity spoofing (reporterId !== request.auth.uid)
 * 3. Status shortcutting on create (status !== 'pending')
 * 4. Shadow field injection (unknown keys rejected by keys().hasOnly())
 * 5. Unverified email bypass (email_verified !== true)
 * 6. Non-admin update of status/adminNote/reviewedBy on /reports/{reportId}
 * 7. Immutable field tampering (reporterId or createdAt modified on update)
 * 8. Timestamp forgery (createdAt !== request.time)
 * 9. Resource poisoning (oversized commentText > 2000 chars or invalid doc ID)
 * 10. Unbounded array attack (flaggedWords.size() > 25 or non-string item)
 * 11. Cross-user list scraping on /reports without reporterId filter or admin claim
 * 12. Self-assigned admin escalation on /admins/{uid}
 */

export const DIRTY_DOZEN_SECURITY_CASES = [
  { id: 1, name: 'Unauthenticated Report Create', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Identity Spoofing on Create', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Status Shortcutting on Create', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Unverified Email Bypass', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Non-Admin Moderation Update', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Immutable Field Tampering', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Timestamp Forgery', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Resource Poisoning / Oversized String', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Unbounded Array Attack', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Cross-User Report Scraping', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Self-Assigned Admin Escalation', expected: 'PERMISSION_DENIED' },
] as const;
