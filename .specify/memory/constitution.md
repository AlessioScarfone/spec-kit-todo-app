<!--
SYNC IMPACT REPORT — Constitution v1.0.0
Generated: 2026-03-02

VERSION CHANGE
  [template/unversioned] -> 1.0.0
  Bump type: MINOR (initial population from blank template — all sections newly authored)

PRINCIPLES
  Status: All new (first fill — no prior principles existed)
  I.   Spec-First Development         (new)
  II.  Test-First (NON-NEGOTIABLE)    (new)
  III. Simplicity & YAGNI             (new)
  IV.  Data Integrity                 (new)
  V.   Observability & Debuggability  (new)

SECTIONS ADDED
  - Core Principles (I-V)
  - Technology Constraints (section 2)
  - Development Workflow (section 3)
  - Governance

SECTIONS REMOVED
  None.

TEMPLATES REVIEWED
  OK .specify/templates/plan-template.md   — "Constitution Check" gate present; compatible with all 5 principles.
  OK .specify/templates/spec-template.md   — User stories & requirements align with Spec-First principle.
  OK .specify/templates/tasks-template.md  — Phase-based TDD task structure aligns with Test-First principle.
  OK .github/agents/speckit.*.agent.md     — Agent files use generic language; no outdated references found.

DEFERRED / TODO ITEMS
  - TODO(RATIFICATION_DATE): Project launch/adoption date unknown. Update when project formally launches.
  - TODO(TECH_STACK): Language, framework, and storage not yet defined. Fill during first /speckit.plan.

FOLLOW-UP ACTIONS
  1. Set RATIFICATION_DATE once the project is formally launched.
  2. Populate the Technology Constraints section during the first /speckit.plan session.
  3. Confirm each future plan.md Constitution Check validates against the 5 principles defined here.
-->

# Spec-Kit Todo App Constitution

## Core Principles

### I. Spec-First Development

Every feature MUST begin with a written specification before any implementation work starts.
Specifications are the authoritative source of truth for scope, behaviour, and acceptance criteria.

- A spec.md produced by /speckit.specify MUST exist and be approved before any code is written.
- An implementation plan (plan.md) MUST be reviewed and pass the Constitution Check before
  Phase 1 work begins.
- Scope changes during implementation MUST be reflected back in the spec before code is updated.

Rationale: Prevents scope creep and misaligned features; keeps the team aligned on what the
todo app must do before debating how.

### II. Test-First (NON-NEGOTIABLE)

Test-Driven Development is mandatory. Tests MUST be written, reviewed, and confirmed failing
before any implementation code is written.

- Red -> Green -> Refactor cycle is strictly enforced for every implementation task.
- No task is considered complete until all associated tests pass.
- Tests MUST target the appropriate level (unit, integration, contract) as defined in tasks.md.

Rationale: Ensures correctness of todo data operations and prevents regressions as the
feature set grows.

### III. Simplicity & YAGNI

The simplest solution that satisfies the spec MUST be chosen. Complexity MUST be explicitly
justified before introduction.

- Abstractions, patterns, or additional dependencies are only introduced when a second confirmed
  use case exists.
- No feature is implemented before it is specified.
- Complexity violations MUST be logged in the Complexity Tracking table in plan.md.

Rationale: Todo apps are inherently simple; premature complexity is the primary failure mode
for such projects.

### IV. Data Integrity

Todo items MUST be persisted reliably. All write operations MUST be atomic where the storage
layer permits, and failure MUST never result in silent data loss.

- All persistence errors MUST surface to the user with a clear, actionable message.
- Partial writes or inconsistent states MUST be detected and handled explicitly.
- Data migrations MUST be backward compatible or include an explicit rollback path.

Rationale: The core value proposition of a todo app is reliable data management; silent loss
of user data is a critical failure under any circumstance.

### V. Observability & Debuggability

All system operations MUST produce meaningful, structured output. Errors MUST never be silently
swallowed.

- Structured logging is required for all service-layer operations (create, update, delete, read).
- User-facing errors MUST be specific and actionable. Generic messages are not acceptable.
- Debug output MUST be separable from normal output (e.g., via log levels or stderr/stdout).

Rationale: Structured, transparent I/O keeps the system observable and reduces debugging time
during development and production incidents.

## Technology Constraints

Decided during first `/speckit.plan` session (feature `001-tui-todo-app`).

- **Language/Runtime**: TypeScript 5.x / Node.js >= 22, `"type": "module"` (ES imports throughout)
- **TUI Framework**: `ink` v6 + `@inkjs/ui` v2 + `react` — React-based CLI renderer
- **Storage**: SQLite via `better-sqlite3` v9 — **raw SQL only; no ORM, no query builder is ever permitted**
- **Data directory**: `env-paths` (sindresorhus) — resolves OS-standard user data dir per platform
- **Testing tools**: `vitest` + `ink-testing-library`; in-memory SQLite (`:memory:`) for DB unit tests
- **Dev runner**: `tsx` for development; `tsc` for production builds
- **Target platform**: macOS, Linux, Windows terminal (CLI / TUI application)

## Development Workflow

All development MUST follow the spec-kit command sequence:

1. /speckit.specify — Write and approve the feature spec.
2. /speckit.plan — Produce the implementation plan; pass Constitution Check.
3. /speckit.tasks — Generate task list organized by user story.
4. /speckit.implement — Implement tasks following TDD (Principle II).
5. /speckit.checklist — Verify completion against spec acceptance criteria.

Additional rules:

- Feature branches MUST follow the ###-feature-name naming convention.
- Every PR MUST link to its corresponding spec.md and pass the Constitution Check gate.
- All new dependencies MUST be justified against Principle III before introduction.
- Changes to shared data contracts MUST be reviewed for backward compatibility (Principle IV).

## Governance

This constitution supersedes all other development practices and guidelines for this project.

Amendment procedure:
1. Identify the change and classify it: MAJOR (principle removal/redefinition), MINOR (new
   principle or section), or PATCH (clarification, wording fix, typo).
2. Update constitution.md with the new content and increment CONSTITUTION_VERSION.
3. Update LAST_AMENDED_DATE to today's date (ISO format: YYYY-MM-DD).
4. Propagate changes to all affected templates and agent files.
5. Record the amendment in the Sync Impact Report at the top of this file.
6. Reference the amendment in the corresponding PR description.

Compliance: All PRs and spec reviews MUST verify compliance with the five core principles.
The Constitution Check gate in plan-template.md MUST pass before Phase 1 work begins.
Complexity violations MUST be logged in the Complexity Tracking table in plan.md.

Versioning policy: MAJOR.MINOR.PATCH as defined by the amendment procedure above.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-03-02
