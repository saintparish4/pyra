# Pyra — Future Roadmap

**As of:** 2026-09-22 · **Horizon:** through 2028 and the bets past it
**Companions:** [`current-state.md`](./current-state.md) · [`next-steps.md`](./next-steps.md) · [`base/BUILD_PLAN.md`](../base/BUILD_PLAN.md)
**Upstream of all of it:** `PYRA_PRD.md` (product requirements stand; its Part 2 phase plan is superseded)

---

## How to read this

- **Horizons are ordered by dependency, not by calendar.** The dates are indicative at the PRD's
  ~15–20 focused hrs/week solo pace and they will slip. What actually moves an item is its entry
  condition in §7, not the month next to it.
- **Horizon 0 is not restated here.** It is planned step by step in `next-steps.md`.
- **The PRD §3 non-goals list is law** until an item's entry condition is met. This document is
  where each non-goal gets a written condition, so "later" stops being a place things go to die.
- Every item that starts becomes an ADR before it ships.

---

## 1. The thesis

Pyra does not win by having more features than ESO. It wins by being the system a department
can **own**, **leave**, and **trust** — and by being correct about NERIS on the first attempt.

That produces one rule that every horizon below is tested against:

> Each horizon must increase the cost of staying with an incumbent, and leave the cost of leaving
> Pyra at approximately zero.

Export-everything, a public schema, AGPL, and nonprofit ownership are not marketing. They are the
product. A roadmap item that quietly raises switching costs *away from Pyra* — a proprietary
extension, an export that omits a module, a hosted-only feature — is off-strategy no matter how
much revenue it promises.

**The window:** the January 2026 NFIRS→NERIS transition forcibly rearchitected every department's
reporting pipeline. Switching costs are at a historic low and closing. Horizon 0 and 1 are a race
against departments re-settling onto whatever their incumbent shipped.

---

## 2. Horizon 0 — the core exists · *now → ~Q1 2027*

Detailed in `next-steps.md`; summarized here only so the arc reads straight.

Generate `@pyra/neris` → tenancy, roles, audit → the incident domain and form → NERIS submission
with the differential validation harness → the NFIRS importer.

**Outcome:** a fire department can complete a routine incident on a phone in under five minutes,
submit it to NERIS, and import forty years of its own history.

**This horizon is the whole product.** Everything below is expansion; nothing below matters if
this does not land.

**Success:** median routine report <5 min · ≥95% NERIS submissions accepted first attempt · one
real department's full history imported with <1% unresolved records.

---

## 3. Horizon 1 — v1.0: adoptable without you in the room · *~Q1 → Q3 2027*

Horizon 0 produces software that works when its author is present. Horizon 1 produces software a
stranger adopts. This is PRD Phases 4–5 (build plan Phases 6–7) plus the things that make adoption
survivable.

**Product hardening**
- Dexie offline draft queue + background sync. Late on purpose: sync bugs are expensive and the
  core has to be stable first.
- One-click full export — JSON canonical + CSV human + attachments, streamed to S3/MinIO.
- Attachments via presigned URLs. The env vars have existed since day one with no code behind them.
- TOTP 2FA + magic link (the `TODO(phase-h)` markers). Magic link is not a nicety — it is how the
  62-year-old volunteer captain logs in at all.
- Automated backups and a **rehearsed** restore drill. Rate limiting, ASVS L2 pass, dependency audit.
- WCAG 2.1 AA on the report form, verified rather than asserted.

**Adoption infrastructure — the part that is easy to skip and fatal to skip**
- Deploy docs tested by someone who has never seen the repo. The metric is literal: a volunteer
  admin installs in under an hour, unaided, and you watch without helping.
- **Publish the OpenAPI surface and the versioned export spec.** ADR-0001 already names this as a
  revisit trigger. It is also the proof of the anti-lock-in claim: a department can verify that
  leaving is possible without taking our word for it, and integrators get a contract.
- Public roadmap, public postmortems, contributor on-ramp, good-first-issues. Trust is the moat,
  and the moat is built in public or not at all.

**Commercial and institutional**
- FSRI/UL V1 compatibility badge secured.
- **Hosted co-op tier stands up** — multi-department on proven RLS, backups, per-department
  restore, a status page. Hard-gated on entity formation (§6): do not take money before there is
  an entity to take it.
- First case study: "Department X left [incumbent], saved $Y, kept 20 years of records." One real
  number beats a page of positioning.

**Definition of v1.0:** a department you have never met deploys it, imports its history, reports
for 90 consecutive days, and could walk away with one click and lose nothing.

**Success:** 5 pilot departments live · ≥3 at 90 consecutive production days · 1 department
self-hosts with zero hand-holding · badge secured · zero data-loss incidents.

---

## 4. Horizon 2 — the RMS beyond incidents · *~Q3 2027 → 2028*

### The finding that reorders this entire horizon

The PRD parks inspections, pre-plans, hydrant management, and health/safety tracking as vague
"later modules." **They are not speculative product ideas — they are already federal schema.**
`NERIS/SECONDARY/` in the checked-out framework contains three schema families in active
development upstream:

| NERIS secondary family | Module files present | The PRD called this |
|---|---|---|
| `community_risk_reduction` | `mod_structure_inspection`, `mod_commercial_inspection`, `mod_outdoor_inspection`, `mod_hydrant_inspection`, `mod_home_visit`, `mod_parcel_data_collection`, `mod_community_event`, `mod_core_CRR` | "inspections/pre-plans, hydrant management — later modules" |
| `health_and_safety` | `core_mod_health_safety`, `mod_personnel_injury`, `mod_personnel_spec`, `mod_incident` | not in the PRD at all |
| `incident_analysis` | `mod_structure_fire`, `mod_outdoor_fire`, `mod_transportation_fire`, `mod_casualty_ff`, `mod_casualty_nonff`, `mod_battery_incident`, `mod_dins_structure`, `mod_hazsit`, `mod_consumer_products` | not in the PRD at all |

Three consequences:

1. **We do not invent these data models.** They regenerate through the Phase 1 generator
   (ADR-0004). The generator built for incidents pays for itself a second time, and a module that
   would have been a quarter of schema design becomes a regeneration plus a UI.
2. **Departments will face these as obligations, not preferences.** That is adoption pull we do
   not have to manufacture — the same dynamic that makes Horizon 0 viable at all.
3. **Incumbents will be slow here.** Secondary schemas are unfinished and unglamorous. A generated
   pipeline that tracks upstream is precisely where a small, disciplined project beats a PE-owned
   roadmap committee.

**The gate:** upstream states the secondary schemas are still in development and may not align
with core; the API remains the source of truth. So this horizon starts when the schemas stabilize,
and it starts with the drift check from Phase 1 already watching them. Do not hand-model them
early to get ahead — that is exactly the mistake `packages/neris/README.md` was written to prevent.

### Module order, and why

**1 · The chief's reporting pack** — ISO/PPC evidence, AFG/SAFER grant exports, the annual report.
No new schema at all; it is query and presentation over data we already hold. It is also the job
the chief persona actually named (compliance sign-off, grant reporting, ISO reviews) and the one
thing that makes a *chief* rather than a report writer care. Forces the ADR-0002 promotion work —
fields we filter and aggregate on move out of JSONB into real columns. First, because it is
cheapest and buys the most goodwill.

**2 · Training and certifications** — the Training Officer is already a named fast-follow persona.
Certification tracking feeds the ISO review directly, so it compounds with item 1.

**3 · Apparatus, SCBA, and roster checks** — the Quartermaster persona. Daily/weekly checklists are
the ideal second consumer of the offline queue built in Horizon 1, and the roster already has to
carry `neris_id` on stations and units because every incident's `unit_responses[]` references them.
The data plumbing is a Horizon 0 byproduct.

**4 · Community Risk Reduction** — inspections, pre-plans, home visits, hydrant inspections, parcel
data. Generated from the CRR secondary schema. This is where "later modules" stops being a list
and starts being a regeneration. Note `mod_risk_reduction.yml` already exists in the *core*
incident schema, so there is a seam into CRR before the secondary work even begins.

**5 · Health and safety** — personnel injury and exposure tracking. The firefighter-cancer
presumption angle makes this the module with the most meaning per line of code. **Handle with care:**
injury and exposure data sits next to health information without being PHI, and the PRD's "no HIPAA
scope" boundary is load-bearing. Scope it explicitly, write the boundary into the ADR, and get it
reviewed before it ships.

**6 · Incident analysis** — structure fire, outdoor fire, transportation fire, casualty detail,
lithium-ion battery incidents, DINS damage inspection, hazmat situations. Deep fire-investigation
data. Last because it is the deepest and the least universal, and because it is worth nothing
until items 1–3 have made the department a daily user.

**Success:** ≥2 modules in production use at pilot departments · at least one department reports
that Pyra replaced a second vendor product, not just the RMS.

---

## 5. Horizon 3 — the bets · *2028+*

Each of these is a real expansion and a real risk. Listed with its honest cost so that saying
"not yet" stays a decision rather than a drift.

### EMS ePCR / NEMSIS — *the biggest, and a different company*

The largest expansion available: most fire departments run EMS, and ePCR is where their software
spend actually goes. It is also where the PRD's most protective boundary sits.

**Cost, plainly:** HIPAA scope arrives in full — BAAs, encryption posture, breach notification,
audit depth, training. Then per-state EMS certification, state by state, each with its own process.
The PRD calls this "a HIPAA + state certification swamp," and that is accurate, not timid.

**Entry condition:** v1.0 shipped and stable, an entity that can sign a BAA, sustained funding for
compliance work that produces no features, and someone other than the founder owning it. Until all
four are true, the answer is no — and a clear no is worth more than a vague someday.

### CAD integration — *closer than it looks*

Two facts from the spec change the shape of this. NERIS treats CAD integrations as a **distinct
class of integration** — a single `UNDETERMINED` incident type can only be submitted by one — and
`NERIS/MAPPINGS/template__dispatch_code_to_incidenty_type.csv` defines the dispatch-code seam,
which Phase 5 already builds and exports for departments. The data path exists before the feature does.

**Cost:** per-jurisdiction politics, dispatch centers that answer to counties rather than
departments, and a long tail of CAD vendors with no incentive to help. This is relationship work
priced as engineering work.

**Entry condition:** a pilot department whose dispatch center will actually cooperate. One willing
county is worth more than any amount of design.

### Regional, state, and mutual-aid surfaces

Some states layer requirements on top of NERIS, and their fire marshal offices are the source of
truth. County and regional rollups across departments on one hosted instance are a natural
extension of the tenancy model built in Phase 2 — and a natural revenue path that does not violate
§1, because the underlying department data stays exportable and owned.

**Entry condition:** a state or county asks. Do not build a state module speculatively.

### Public transparency surface

A public incident map or department transparency page is a separate product, explicitly. It also
trips ADR-0001's revisit trigger: it is the first SEO-relevant surface, and it argues for SSR or a
separate site rather than bolting rendering onto an authenticated SPA.

**Entry condition:** a department asks for it publicly and will be the reference customer.

### Native mobile

**Entry condition:** the PWA measurably fails the five-minute phone metric in real use, with
numbers. Not before. "Native feels better" is not an entry condition.

### Scheduling and shift management

Commodity, well served, and a retention feature rather than an acquisition one. The right outcome
is a community contribution or an integration, not founder time.

---

## 6. The tracks that are not code

These run in parallel with every horizon and at least two of them can block shipping outright.

**Governance and entity** — 501(c)(3) vs. co-op vs. fiscal sponsorship is still an open PRD
question, and it is a **hard gate on the hosted tier**: no entity, no money, no co-op. It is also
the structural claim the whole pitch rests on — "governed so it cannot be acquired" is either a
filed document or it is a slogan. `GOVERNANCE.md` is currently a zero-byte file. Decide in
Horizon 0, file in Horizon 1.

**Funding and sustainability** — hosted-tier fees at cost, co-op dues, grants, and sponsorship, in
roughly that order of legitimacy. The test for any funding source: does accepting it create
pressure to make leaving harder? If yes, decline it. Solo burnout is named in the PRD's own risk
table; funding that buys contributor time is the mitigation that actually works.

**Compliance and standards** — the FSRI/UL badge (Horizon 1), state-level requirements as pilots
expand, and the NERIS helpdesk relationship. The differential validation harness from Phase 4 is
the technical half of this track; the human half is being a known, cooperative integrator before
you need a favor.

**Community** — DCO, contributor docs, and 2–3 contributors recruited from the
firefighter-developer community. The PRD names solo burnout as a top risk and this as its
mitigation. Recruiting starts in Horizon 1, not when you are already exhausted.

**Market and adoption** — pilot pipeline, case studies, the NTARI/COER relationship (collaborate,
merge, or differentiate — still an open question), and conference presence where chiefs actually
are. Departments adopt software their neighbours adopted; mutual-aid networks are the distribution
channel, which is also why the multi-department hosted tier matters more than its revenue.

---

## 7. Gates — what must be true before an item starts

| Item | Entry condition |
|---|---|
| NERIS submission (H0) | Credential type, entity NERIS ID, and base URLs confirmed — `BUILD_PLAN.md` §3 A/B/C |
| Hosted co-op tier (H1) | Legal entity formed and able to receive money; restore drill rehearsed |
| OpenAPI surface (H1) | v1.0 contract stable enough that publishing it is a promise we can keep |
| Any NERIS secondary module (H2) | Upstream schema stabilized; regenerates cleanly through the Phase 1 generator; drift check green |
| Health and safety module (H2) | Written data-sensitivity boundary, reviewed, in the ADR |
| ePCR / NEMSIS (H3) | v1.0 stable · entity can sign a BAA · funded compliance capacity · a named owner who is not the founder |
| CAD integration (H3) | A dispatch center that has agreed to cooperate |
| State/regional surfaces (H3) | A state or county has asked |
| Public transparency surface (H3) | A department will be the public reference customer |
| Native mobile (H3) | Measured PWA failure against the 5-minute phone metric |

---

## 8. What Pyra will not do — ever

Not "not yet." These are the commitments that make the rest credible, and the ones a PE acquirer
would need reversed:

- **No proprietary extensions.** Hosted and self-hosted run the same AGPL code. No feature is
  withheld from self-hosters to drive hosting revenue.
- **No partial export.** Every module ships with its export path in the same release. An export
  that omits a module is a broken promise, not a backlog item.
- **No closed schema.** The schema and export format stay documented, versioned, and public, so
  forks and competitors can read them. That is the point.
- **No acquisition path.** Nonprofit/co-op ownership with the trademark held by the entity. There
  is nothing to buy and nothing to lock.
- **No data hostage-taking, in any form**, including the soft forms: degraded exports, deprecated
  formats, migration fees, or support that ends the moment a department announces it is leaving.

The incumbents' playbook is acquire, sunset, raise prices. Every item above is chosen to make each
of those three moves structurally unavailable against Pyra.

---

## 9. Keeping this honest

- Revisit at each horizon boundary and whenever a gate in §7 flips. A gate that has been open for
  a quarter with no work started is a signal the item was never real — delete it.
- Any item that starts gets an ADR first, with its revisit trigger written in, the way ADR-0001
  through 0005 do.
- Track the PRD's success metrics continuously rather than at milestones: median report time,
  first-attempt acceptance rate, unaided self-host installs, data-loss incidents (target: zero,
  measured, not assumed).
- **Horizon 0 is allowed to eat this entire document.** If shipping the core takes until 2028,
  that is the correct outcome. A roadmap is not a commitment to do everything on it; the non-goals
  list is what protects the one thing that matters, and it stays law.
