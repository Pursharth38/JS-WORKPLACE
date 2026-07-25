# Branch protection

> Part of P1-08. These settings live in GitHub, not in the repo, so they cannot be
> committed — this file records what to configure so the setup is reproducible and
> reviewable rather than living in one person's memory.

Apply to `main`, in **Settings → Branches → Add branch protection rule**.

## Required

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | on | Three developers on one branch is how the merge conflicts in `MERGE-NOTES.md` happened. |
| Required approvals | 1 | Nobody reviews their own slice — `review-agent.md`. |
| Dismiss stale approvals on new commits | on | An approval of an older diff is not an approval of this one. |
| Require status checks to pass | on | |
| → required check | `verify` | The single CI job: typecheck · lint · test · build · forbidden-claims · leak · envelope · consent. |
| Require branches to be up to date | on | Stops a green PR merging into a `main` it was never tested against. |
| Require conversation resolution | on | |
| Do not allow bypassing the above | on | Including admins. The forbidden-claims gate is a legal control; an admin override defeats it. |

## Deliberately off

| Setting | Why |
|---|---|
| Require signed commits | Adds GPG setup friction for a three-person team with no supply-chain threat model. Revisit if the team grows. |
| Require linear history | Merge commits carry the integration story (see the A+B merge). Squashing would lose it. |
| Restrict who can push | Redundant once PRs are required and bypass is disabled. |

## Also configure

- **Settings → General → Pull Requests:** enable "Allow squash merging" and
  "Allow merge commits". Disable rebase merging — it rewrites hashes that
  `MERGE-NOTES.md` and the decisions log refer to by SHA.
- **Settings → General → Danger Zone:** disable branch deletion on `main`.
- **Secrets → Actions:** CI runs on placeholder env values by design and needs no
  secrets today. If a future job audits a deployed preview (Lighthouse, P12-04),
  add only what that job needs.

## Verifying it works

Open a throwaway PR that adds a forbidden claim string to any file under `app/`.
The `verify` job must fail on "Forbidden claims check" and the merge button must
be blocked. If it merges, the protection is not configured correctly.
