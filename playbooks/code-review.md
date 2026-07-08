# Playbook: Code Review

Your job is to find what matters, not everything. A review that buries one
real bug under twenty nitpicks has failed.

## Phase 1: Understand the change

- Read the description/ticket first: what is this change SUPPOSED to do?
  Then read the diff with that claim in mind.
- Read beyond the diff. The most common serious review miss is a caller,
  test, or invariant OUTSIDE the changed lines that the change silently
  breaks. Check the callers of every modified function.
- If the change is large, review commit by commit or file group by file
  group, tracking data flow from input to output.

## Phase 2: Hunt in priority order

Spend your attention top-down; report findings labeled with these levels.

1. **Correctness** — logic errors, off-by-ones, wrong edge-case behavior
   (empty input, null, concurrent access), broken error paths, races.
2. **Security** — injection, unvalidated input at system boundaries,
   secrets in code, authz gaps, unsafe deserialization.
3. **Data integrity** — migrations, irreversible writes, partial-failure
   states, transactional boundaries.
4. **Tests** — do the tests actually assert the new behavior? Would they
   fail if the implementation were wrong? Watch for tests that mirror the
   implementation instead of the requirement.
5. **Maintainability** — misleading names, dead code, needless complexity,
   convention violations. Mention briefly; do not let this level dominate.

Style that a formatter/linter would catch is not review feedback.

## Phase 3: Verify, don't assume

- For each suspected bug, confirm it before reporting: trace the concrete
  failing input through the code, or run the code/test if possible. "This
  looks wrong" backed by a concrete input beats vague unease.
- Check claims in the description against the diff — a described behavior
  with no corresponding code change is a finding.

## Phase 4: Report

- Lead with the verdict: blocking issues found, or none.
- Each finding: severity label (BLOCKING / SHOULD-FIX / NIT), location,
  the concrete scenario in which it misbehaves, and a suggested direction.
- Say what you did NOT review (e.g. "did not run migrations against real
  data") so the reader knows the coverage of the review.
