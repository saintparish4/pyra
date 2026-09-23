# Governance

Pyra exists because fire departments keep losing their own records to acquisitions. A vendor
gets bought, the product gets repriced or retired, and a department discovers that forty years
of incident history is in a format it cannot read without paying whoever bought it.

Open-sourcing the code does not, on its own, prevent that. This document is about what does —
and it is honest about which parts are settled and which are not.

**Status:** the licence and the day-to-day process below are in force now. The legal entity is
not yet decided; see "Open question" at the end.

---

## What is already binding

### The licence

Pyra is **[AGPL-3.0-only](./LICENSE)**, and that is not a placeholder.

The AGPL's network clause is the part that matters for this project. A permissive licence would
let a hosting company run a closed fork as a SaaS product and offer departments no way back.
Under the AGPL, anyone who runs a modified Pyra as a service has to offer that modified source
to its users. A department on a hosted instance therefore always has a path to self-hosting the
exact software it is actually using.

**No CLA.** Contributions are accepted under the project's own licence, and no contributor signs
away the right to relicense. That is deliberate: a contributor licence agreement concentrating
relicensing rights in one party is precisely the mechanism that makes a future proprietary
relicense possible. Without it, relicensing Pyra would require the agreement of everyone who has
contributed — which is the point.

### Data sovereignty as a product requirement

Three guarantees are treated as licence-level commitments, not features that could be
deprioritised:

1. **One-click full export** in a published, versioned format — incidents, attachments, and the
   original imported rows.
2. **Imported records preserved verbatim.** What a department gave us stays exactly what they
   gave us, alongside whatever we mapped it to.
3. **No proprietary storage shapes.** Postgres, S3-compatible object storage, JSON. A department
   with a database dump and no Pyra still has its records.

A change that weakens any of these is out of scope regardless of who asks for it.

## How decisions get made today

Pyra is currently maintained by one person. Pretending otherwise would be theatre, so:

- **Code changes** go through pull request and maintainer review. See
  [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- **Decisions that are expensive to reverse** — the data model, the tenancy boundary, the
  deployment footprint — are recorded as ADRs in [`adr/`](./adr), in public, with the argument,
  the cost, and the condition that would reverse them. The record is what lets a contributor
  arriving in two years judge whether the reasoning still holds.
- **Security issues** are reported privately to the maintainer, not as public issues. Tenancy
  bugs are the highest severity class in the project.

As contributors accumulate, maintainership is expected to widen before any of the above changes.
The commitment here is procedural: **new maintainers are added in public, with the reasoning
stated**, and the ADR format is used for that decision like any other.

## Who Pyra answers to

Fire departments, not investors. In practice that means:

- **Roadmap priority follows what departments actually hit**, not what demos well. A bug report
  from the person filing reports at 3am outranks a feature request from anyone who is not.
- **The hosted tier is a convenience, never a lever.** Everything the hosted tier can do,
  a self-hosted instance can do. There is no feature that exists only for paying users, and
  there will not be one. Hosting recovers server costs; it does not gate functionality.
- **Self-hosting stays genuinely viable.** The definition of done for a release is that a
  volunteer admin can install it in under an hour with Docker Compose. If self-hosting quietly
  degrades, the export guarantee becomes theoretical.

## Open question: the legal entity

**This is not decided, and it should not be pretended otherwise.** The AGPL prevents a
proprietary fork of the code. It does not prevent the trademark, the domain, the hosted
infrastructure, or the maintainer's own attention from being acquired — and for a department
choosing an RMS, those are not academic distinctions.

The options under consideration:

| Structure | What it would give | What it costs |
| --- | --- | --- |
| **501(c)(3) nonprofit** | A board with a fiduciary duty to the mission; the clearest "cannot be acquired" story | Slowest and most expensive to set up; ongoing compliance burden on one person |
| **Cooperative owned by member departments** | Governance genuinely held by the people who depend on it — the strongest alignment available | Needs enough member departments to be real; premature before pilots |
| **Steward-ownership / purpose trust** | Locks the mission into the entity's own charter without requiring a member base | Less familiar to US departments and their counsel; harder to explain to a chief |
| **Fiscal sponsorship under an existing foundation** | Fast, cheap, credible while the project is small | Governance is borrowed, not owned; a stepping stone rather than an answer |

Two things have to be settled alongside the entity, and both are as load-bearing as the choice
itself: **who holds the trademark and the domain**, and **what happens to the hosted
infrastructure and its customer data if the maintainer stops**.

This becomes urgent when the first pilot department depends on Pyra for a compliance
obligation — because at that point "we intend not to be acquired" stops being good enough. It
gets an ADR when it is decided, and this file gets rewritten around the answer.

Until then, the honest summary for anyone evaluating Pyra: **the code is protected by the
licence, the data is protected by the export guarantee, and the institution is not built yet.**
