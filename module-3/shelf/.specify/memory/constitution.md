<!--
Sync Impact Report (temporary; remove before committing)
- Version change: (unfilled template) → 1.0.0
- Modified principles: none (initial ratification)
- Added principles: I. Localhost Only; II. Test-First (NON-NEGOTIABLE);
  III. Minimal Dependencies
- Added sections: Technology & Runtime Constraints; Development Workflow & Quality Gates
  (both derived from CLAUDE.md); Governance
- Removed sections: unused template slots for Principles 4 and 5 (the template allows fewer
  than its default five principles)
- Interpretation to confirm: "localhost only" is read as both "no outbound calls" (stated by
  the user) and "server binds to loopback only" (inferred). The second reading is stricter.
- Maintainer approval in Principle III comes from the CLAUDE.md prohibition "Do not add
  dependencies without my approval", combined with the user's "without justification".
- Known non-compliance in existing code (not fixed here): src/server.ts calls app.listen
  without a host (binds to all interfaces); src/server.ts and src/storage.ts use console.log
  (backlog B-6).
- Deferred TODOs: none
- Templates read the constitution at runtime and were not modified. specs/001-library-export/
  plan.md was checked against the user's three rules before ratification; re-run
  /speckit-plan to refresh its Constitution Check against this document.
-->
# Shelf Constitution

## Core Principles

### I. Localhost Only

Shelf MUST run entirely on the developer's machine, with no external services and no network
calls beyond its own local HTTP server.

- The HTTP server MUST bind to the loopback interface (`127.0.0.1`) only.
- Code MUST NOT make outbound network calls: no HTTP clients, third-party APIs, hosted
  databases, telemetry, or remote logging.
- Storage MUST stay in-process (`src/storage.ts`); no external data store may be introduced.
- Tests MUST run offline and MUST NOT depend on any service outside the local machine.

Rationale: a local-only service has no credentials, no data egress, and no environment
dependencies, so every behaviour is reproducible from a clean checkout.

### II. Test-First (NON-NEGOTIABLE)

Every behaviour change MUST begin with a failing test, and production code MUST be written
only to make that test pass.

- The failing test MUST be run and seen to fail for the expected reason before any
  implementation is written.
- Implementation MUST be the minimum needed to pass; refactoring happens only while tests
  are green.
- A bug fix MUST start with a test that reproduces the bug.
- Tests live in `tests/` as `<module>.test.ts`.
- A change with no accompanying test MUST NOT be merged.

Rationale: the failing run proves the test can detect the defect; writing it afterwards
only proves the code agrees with itself.

### III. Minimal Dependencies

A new runtime or development dependency MUST NOT be added without a written justification
and the maintainer's approval.

- The justification MUST state what is needed, why the standard library or existing
  dependencies cannot provide it, and what the dependency costs (size, transitive packages,
  licence, maintenance state).
- The justification MUST be recorded in the feature plan or the change description before
  `package.json` is edited.
- A dependency that makes network calls or requires an external service is prohibited by
  Principle I regardless of justification.

Rationale: each dependency widens the attack surface and the maintenance burden of a
deliberately small project.

## Technology & Runtime Constraints

- Language and runtime: TypeScript (strict mode), Node.js 20+, run via `tsx` with no build
  step.
- Framework and tooling: Express 5, Vitest with supertest, ESLint.
- `any` and the non-null assertion (`!`) MUST NOT be used.
- Logging MUST go through `getLogger()` from `src/log.ts`, never `console.log`. Log message
  names MUST be lower-case and dot-separated (for example `book.read`).
- API errors MUST be returned as `{ detail }` with an appropriate status code (404, 422).

## Development Workflow & Quality Gates

- `npm run check` (`tsc --noEmit`, `eslint`, `vitest`) MUST pass after every change.
- Changes MUST be limited to files related to the task at hand.
- Each plan MUST pass a Constitution Check against Principles I–III before design work and
  again after it.
- Automated agents MUST NOT push or merge; a human decides after review.

## Governance

This constitution supersedes other practices and conventions for this project. Where
`CLAUDE.md` and this document conflict, this document prevails and `CLAUDE.md` MUST be
corrected.

- **Amendments**: proposed as a change to this file with a stated rationale, approved by
  the maintainer, and accompanied by an updated Sync Impact Report and version bump.
- **Versioning**: semantic. MAJOR for removing or redefining a principle in a backward
  incompatible way; MINOR for adding a principle or section or materially expanding
  guidance; PATCH for clarifications and wording fixes.
- **Compliance review**: every spec, plan, and change review MUST verify compliance with
  Principles I–III. Any deviation MUST be justified in writing in the plan's Complexity
  Tracking; unjustified deviations block the merge.
- **Runtime guidance**: day-to-day conventions are kept in `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
