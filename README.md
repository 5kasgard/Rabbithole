# RabbitHole

**The Field: a local-first, truth-grounded substrate for bounded reasoning, evidence, coordination, and action.**

RabbitHole is an experimental open systems project for building software that can investigate a problem, preserve the provenance of what it learns, test claims against declared evidence, expose uncertainty and disagreement, and interact with the outside world without silently turning computation into truth or truth into permission.

> **Core rule:** no claim gains authority merely because the system generated, repeated, stored, or acted on it.

## Repository status

The current product runtime is **The Field `0.18.0rc3.post3`**, built on the immutable `0.18.0rc3` authority baseline.

- **Release class:** internal release candidate
- **Default runtime dependencies:** zero mandatory third-party packages
- **Core mode:** local and offline-first
- **External promotion:** not yet granted
- **GUI/UX:** planned, but gated behind backend and independent-review milestones
- **Product source:** currently staged in [draft PR #1](https://github.com/5kasgard/Rabbithole/pull/1)

Until PR #1 is merged, `main` is the project landing page rather than the complete installable source tree.

## Why RabbitHole exists

Most software can tell you what it calculated. Far less software can tell you:

- where each claim came from;
- which observations support it;
- which tests it survived;
- what would falsify it;
- whether contradictory evidence exists;
- when the evidence became stale;
- whether the system is authorised to act on it;
- whether an external outcome actually occurred.

RabbitHole is an attempt to make those distinctions structural rather than optional. The system treats reasoning, evidence, verification, authority, action permission, and external utility as separate layers.

## What it does

The current runtime includes:

- interval and dimensional constraint propagation;
- provenance-bearing claims and evidence records;
- revocation, staleness, and tamper-evident audit chains;
- bounded acquisition and parsing of local or explicitly permitted remote artifacts;
- verification contracts with explicit abstention and failure states;
- capability-scoped, allow-listed external contact;
- persistent scheduling with leases, retry ceilings, and recovery state;
- reversible acquire-test-act-monitor-replan loops;
- whole-subject profiles that preserve competing identities and disagreement;
- causal DAG and backdoor-adjustment analysis without a mandatory graph dependency;
- an experimental Field Interchange Protocol implementation;
- an authoritative Python propagation oracle and an optional checked native-C candidate;
- product registries and conformance checks that preserve authority boundaries.

## What it does not claim

RabbitHole does not currently claim:

- autonomous scientific discovery;
- general intelligence;
- defect-free or formally complete correctness;
- externally demonstrated superiority over alternative systems;
- permission to take unbounded or consequential action;
- adopted protocol or federation status;
- ordinary-user usability;
- production readiness.

The project is deliberately explicit about those open gates.

## Mental model

A simplified flow looks like this:

```text
Intent
  ↓
Bounded interpretation
  ↓
Acquisition / observation
  ↓
Claim and provenance construction
  ↓
Declared verification contracts
  ↓
Authority-limited state
  ↓
Capability check
  ↓
Optional reversible action
  ↓
Monitoring, audit, revocation, and re-planning
```

The important boundary is that each transition can fail, abstain, or remain unresolved. A generated answer is not automatically promoted into an authoritative claim.

## Quick start

These commands apply to the unpacked product source in PR #1 and will apply to `main` after the PR is merged.

### 1. Clone and create an environment

```bash
git clone https://github.com/5kasgard/Rabbithole.git
cd Rabbithole
python -m venv .venv
```

Activate the environment:

```bash
# Linux / macOS
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

### 2. Install the offline core

```bash
python -m pip install --upgrade pip
python -m pip install -e .
```

The base install has **no mandatory third-party runtime dependencies**.

### 3. Inspect and verify the system

```bash
field-master capabilities
field-master status
field-master verify
```

### 4. Explore the command surfaces

```bash
field --help
field-master --help
field-performance --help
```

### 5. Run the public acceptance suites

```bash
python scripts/run_product_tests.py
python scripts/run_kernel_tests.py
```

Each product module is executed in an isolated workspace and process group with a hard deadline. A hang is treated as a failed gate, not as an implied pass.

## First bounded workflow

The repository includes a reversible file-integrity outward-loop example:

```bash
field-master phase-init examples/master/file_integrity_loop.json ./state/loop
field-master phase-step examples/master/file_integrity_loop.json ./state/loop
field-master phase-status ./state/loop
```

This profile:

1. observes a frozen file;
2. verifies its digest;
3. writes a reversible status artifact;
4. monitors the result;
5. records the audit chain;
6. refuses unsupported utility claims.

Nothing in that workflow grants general action permission.

## Installation profiles

The offline core is intentionally small. Heavier capabilities are opt-in extras:

```bash
python -m pip install -e '.[html]'        # structured HTML metadata
python -m pip install -e '.[pdf]'         # pure-Python PDF parsing
python -m pip install -e '.[pdf-fast]'    # faster compiled PDF backend
python -m pip install -e '.[images]'      # image inspection
python -m pip install -e '.[symbolic]'    # isolated symbolic verification
python -m pip install -e '.[documents]'   # portable document bundle
python -m pip install -e '.[full]'        # every optional product feature
python -m pip install -e '.[full,dev]'    # product plus audit tooling
```

Network access is not required for core operation. Remote acquisition or model faculties activate only when explicitly configured.

## Main command-line tools

| Command | Purpose |
|---|---|
| `field` | Public inquiry, discovery, validation, representation, task, and reporting surface |
| `field-master` | Product status, registries, capability inspection, FIP verification, and bounded outward loops |
| `field-performance` | Bounded heterogeneous performance planning and execution |
| `field-accept` | Acceptance entry point |

Start with `field-master capabilities`, then use `--help` on the relevant command.

## Architecture

```text
CLI / future local UI
        │
        ▼
Intent and contract layer
        │
        ▼
Acquisition ── Parsers ── Content-addressed storage
        │
        ▼
Claims ── Evidence ── Provenance ── Revocation
        │
        ▼
Verification contracts and authority ceilings
        │
        ▼
Constraint propagation and causal analysis
        │
        ▼
Capability waist
        │
        ▼
Bounded contact / reversible action / monitoring
        │
        ▼
WAL, audit, recovery, and external outcome records
```

The optional C engine is treated as a checked acceleration candidate. The Python oracle remains the authority boundary.

## Secure defaults

- Shell interpretation is not used for contact execution.
- Command contact is disabled unless explicitly enabled and allow-listed.
- Subprocesses run with deadlines, output ceilings, a minimal environment, and process-tree termination.
- Shared HTTP contact resolves once, validates and pins the peer, preserves TLS hostname verification, and refuses automatic redirects.
- Remote parsing is bounded by byte, row, cell, page, frame, link, depth, and expansion ceilings.
- JSON and JSONL reject duplicate keys, non-finite values, malformed records, and excessive nesting.
- Durable state uses journaled, same-directory atomic replacement and digest verification.
- Capability grants preserve signed ancestry, constraints, attenuation, and transitive revocation.
- Native code is integrity-checked, sanitizer-tested, and never silently promoted above the Python oracle.
- Propagation budget exhaustion is an explicit unresolved state, not a false success.

Security issues should be reported according to `SECURITY.md` once the product tree is merged.

## Testing and hardening

The current release evidence includes:

- **36/36** product test modules;
- **46/46** kernel gates;
- **59/59** dedicated hardening tests;
- **7/7** dependency-profile tests;
- **8/8** acquisition-boundary tests;
- **6/6** placement-boundary tests;
- randomized Python/native differential testing;
- overflow, NaN, and budget-exhaustion honesty checks;
- crash-recovery, corruption, concurrency, and tamper tests;
- path-traversal, command-injection, SSRF, redirect, and DNS-rebinding tests;
- Ruff, Bandit, and typed authority-boundary checks;
- GCC and Clang warning-clean builds;
- static native analysis and ASan/UBSan harnesses;
- deterministic wheel and source-distribution builds;
- fresh full-feature and fully offline installation tests.

These gates reduce known risk. They do not prove the absence of every defect.

## Repository layout

```text
rabbithole/          Runtime package
rabbithole/native/   Optional audited C engine source
rabbithole/data/     Compact product registries and embedded documents
docs/                Architecture, constitution, threat model, gates, and roadmap
examples/            Bounded runnable examples
scripts/             Test, audit, build, and repository-integrity tooling
tests/               Public correctness, safety, regression, and property tests
experimental/fip/    Experimental interchange protocol implementation
master/              Current authority and product registries
stage3/              Required live runtime contracts
history/             Compact lineage index; not the development vault
```

Generated state, archives, wheels, compiled libraries, credentials, caches, and reconstruction campaigns are excluded from the product repository.

## Documentation guide

After the product source is merged, start with:

1. `docs/GOAL_VISION.md` — purpose and long-term direction
2. `docs/PRODUCT_ARCHITECTURE.md` — current architecture
3. `docs/CONSTITUTION_v6_0.md` — authority and epistemic rules
4. `docs/THREAT_MODEL.md` — security boundaries and adversaries
5. `docs/OFFLINE_AND_DEPENDENCY_PROFILES.md` — local and optional installation profiles
6. `docs/HARDENING_AND_RELEASE_GATES.md` — acceptance criteria
7. `docs/KNOWN_LIMITS_AND_EXTERNAL_GATES.md` — what remains unproven
8. `docs/UI_UX_RFC.md` — planned local-first interface
9. `CHANGELOG.md` — version history

## Roadmap

Near-term work is ordered deliberately:

1. land and independently review the unpacked product repository;
2. complete GitHub CI across supported Python versions and operating systems;
3. close whole-package typing and remaining dependency-audit debt;
4. freeze a localhost, read-only application API;
5. build the first local-first GUI/PWA for inspection and inquiry;
6. keep consequential action disabled until crash-durable reservation and reconciliation semantics are complete;
7. run the external slow-clock, usability, federation, utility, and safety gates.

## Contributing

Contributions should:

- identify the affected invariant or authority boundary;
- include a regression or property test;
- preserve rollback and auditability;
- avoid introducing mandatory dependencies into the offline core without strong justification;
- avoid manufacturing authority through implementation detail.

See `CONTRIBUTING.md` after the product tree is merged.

## Licence

No public software licence has been selected yet. Public visibility alone does not grant permission to copy, modify, or redistribute the source.
