# Playbook: Refactoring

The iron rule: a refactor changes structure, never behavior. If behavior
must also change, split the work — refactor first, change behavior second,
in separate steps (ideally separate commits).

## Phase 1: Pin down current behavior

- Find the tests covering the code you will touch. Run them and record the
  result BEFORE changing anything — you need to know which failures are
  pre-existing.
- If coverage is thin, write characterization tests first: tests that
  assert what the code CURRENTLY does (even if the current behavior is
  ugly). These are your safety net.
- Enumerate all callers of everything you plan to change (`grep` for the
  symbol, check exports). Each caller is a compatibility decision you must
  make explicitly, not "probably fine".

## Phase 2: Plan the smallest safe steps

- Decompose into steps that each keep the code compiling and the tests
  green. "Rename, run tests, move, run tests, extract, run tests" beats one
  big-bang rewrite.
- Sequence by risk: if one step might be impossible (e.g. two callers need
  incompatible signatures), do the investigation for that step FIRST.
- Resist widening the scope. Every "while I'm here" impulse gets written
  down for the final report instead of acted on.

## Phase 3: Execute step by step

- After every step, run the affected tests. When a step breaks them, fix or
  revert THAT step before proceeding — do not stack broken steps and hope
  to reconcile at the end.
- Preserve public API and observable behavior: same outputs, same errors,
  same side-effect ordering where anything could depend on it.
- Update everything that names the old structure: imports, tests, docs,
  string references (logging, reflection, config keys). Half-renamed code
  is worse than unrenamed code.

## Phase 4: Verify and report

- Run the full relevant test suite plus type checker/linter at the end,
  and compare against the Phase 1 baseline: no new failures.
- Report: what changed structurally, what is guaranteed unchanged (and how
  you know — tests, baseline comparison), plus the deferred "while I'm
  here" list for the user to decide on.
