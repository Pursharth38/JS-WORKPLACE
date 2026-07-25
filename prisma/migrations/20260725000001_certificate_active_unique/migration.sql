-- ─────────────────────────────────────────────────────────────────────────────
-- DEV B — the database-level backstop for certificate issuance idempotency.
--
-- Prisma's schema syntax cannot express a PARTIAL unique index, so this must be
-- raw SQL. Without it, two concurrent POSTs to /api/certificate/issue both pass
-- the `findFirst` existence check and both mint a certificate — the read-then-
-- write check in the route handler is necessary but NOT sufficient.
--
-- Scoped to `revokedAt IS NULL` so that after an admin revokes a certificate,
-- a replacement can legitimately be issued for the same (userId, courseId).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "cert_active_unique"
  ON "Certificate" ("userId", "courseId")
  WHERE "revokedAt" IS NULL;
