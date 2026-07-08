# Playbook: Debugging

Follow these phases in order. Do not skip Phase 1 — a fix without a
reproduction is a guess.

## Phase 1: Reproduce

- Reproduce the failure yourself before theorizing: run the failing test,
  hit the endpoint, execute the script. Capture the exact error output.
- If you cannot reproduce it, that IS the finding — report what you tried
  and what extra information (logs, inputs, environment) would enable a
  reproduction. Do not "fix" what you cannot observe.
- Note the boundary of the failure: which inputs trigger it, which don't;
  when it started (recent commits are prime suspects — check `git log` for
  the affected files).

## Phase 2: Hypothesize

- Write down 2–4 plausible causes and rank them by likelihood given the
  evidence so far. One hypothesis is not an investigation.
- For each, note what evidence would confirm or kill it.
- Pick the CHEAPEST test that discriminates between the top hypotheses —
  not the test most likely to confirm your favorite.

## Phase 3: Localize

- Narrow by bisection: add a log/assertion at the midpoint of the suspect
  data flow, determine which half is broken, repeat. For regressions,
  `git bisect` (or manually checking out suspect commits) is often fastest.
- Keep observations separate from inferences. "The value is already wrong
  at the API boundary" is an observation. "So the frontend must be sending
  it wrong" is an inference — mark it as one.
- If the same approach has failed twice, stop. Re-read the ORIGINAL error
  output from scratch and form a genuinely different hypothesis.

## Phase 4: Fix at the root

- Fix the cause, not the symptom. Deduplicating bad output downstream,
  adding a retry around flaky behavior, or widening a type to silence an
  error are symptom patches — only acceptable if you explicitly say so and
  explain why the root fix is out of reach.
- Ask why the bug was POSSIBLE: missing validation, a misleading API, an
  untested path. Fix within the task's scope; report anything deeper.

## Phase 5: Verify and report

- Show the reproduction now passing, and run the surrounding tests to check
  for collateral damage.
- Add a regression test that fails without the fix, unless tests are
  impractical in this codebase.
- Report: root cause first, then the fix, then the evidence. Include what
  you ruled out if the user is likely to suspect it.
