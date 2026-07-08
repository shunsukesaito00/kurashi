# Playbook: New Feature

## Phase 1: Define done

- Before writing code, state (to yourself, or in `PROGRESS.md` for large
  work): what observable behavior exists after this feature that does not
  exist now? How will you demonstrate it works — which test, which command,
  which screen?
- Identify what the user did NOT specify and choose defaults: existing
  codebase convention first, ecosystem standard second, most reversible
  option third. Record the assumptions; report them at the end.

## Phase 2: Survey before building

- Find how this codebase already solves similar problems: an existing
  feature to imitate is worth more than a plan from scratch. Copy its
  structure, naming, error handling, and test style.
- Check what already exists: half of "new" features overlap with an
  existing utility, endpoint, or component. Extend before duplicating.
- Identify the integration points your feature must touch (routes, DI
  registration, schema, config, exports) — forgetting one of these is the
  most common cause of "it compiles but doesn't work".

## Phase 3: Build riskiest-first

- Implement the part most likely to invalidate the design FIRST (the
  unfamiliar API, the performance-sensitive query, the tricky data model)
  — as a thin end-to-end slice if possible. Discover "this approach can't
  work" in the first tenth of the effort, not the last.
- Keep the feature minimal: build what was asked, not the configurable
  general-purpose version of it. No feature flags, fallbacks, or options
  nobody requested.
- Wire it fully. A feature that is implemented but not reachable (missing
  route, unregistered handler, unexported symbol) is not implemented.

## Phase 4: Verify like a user

- Test the feature the way it will actually be used — call the real
  endpoint, run the real command, load the real page — not only via unit
  tests of internal functions.
- Cover the ordinary case, the empty/zero case, and the first realistic
  failure (bad input at the boundary, dependency error). Skip defensive
  handling for impossible cases.
- Run the existing test suite: new features break old behavior more often
  through shared code than anyone expects.

## Phase 5: Report

- Lead with what now works and how you verified it.
- List the assumptions you chose in Phase 1 so the user can override them.
- Note anything deliberately left out of scope.
