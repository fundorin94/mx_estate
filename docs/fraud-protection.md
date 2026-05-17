# Lead Tracking & Fraud Protection — Design

> Status: design draft. Not yet implemented. Phasing below.

## Problem

MX Estate makes money on referral commissions (20–25% of the realtor's commission). The biggest existential risk: a realtor receives a lead from the platform, closes the deal off-platform, and reports "buyer ghosted me" to avoid paying the referral. Without an attribution and verification system, the business model is unprotected.

## Goal

Every deal that started from a MX Estate lead must end up in the system with confirmation from **at least two independent sources**. If realtor and buyer both say "no deal", but the public registry says "yes" — we have evidence. And vice-versa.

## The four defensive layers

| Layer | What it does | Protects against | When to build |
|---|---|---|---|
| 1. Attribution | Unique public `MX-XXXX-XXXX` ID on every lead, surfaced everywhere | "I never heard of this buyer" | Phase A |
| 2. Contract | One-page referral agreement signed before realtor receives leads | Everything (legal recourse) | Phase B |
| 3. Buyer follow-up | Automated 60/90/180-day email asking buyer if they closed | "Buyer ghosted me" / silent close | Phase C |
| 4. Registry cross-check | Scraper of Mexican RPP (per-state public property registry) | Total deception | Phase E |

Each layer alone is bypassable. Bypassing all four simultaneously requires the realtor to:
- Convince the buyer to lie to us
- Hide the transaction from the public registry (impossible — every Mexican property sale goes through a notario and is recorded)
- Leave no trace in WhatsApp/email tagged with the lead ID

Probability of getting away with this for a single deal: very low. After we catch one realtor, word spreads in a market of 3 cities.

## Data model

### `leads` (extend existing)

| Field | Purpose |
|---|---|
| `public_id` | `MX-A4F2-7B3D` — short, human-readable, unique. Used in every communication. |
| `status` | enum: `new`, `delivered`, `contacted`, `viewing`, `negotiating`, `closed_won`, `closed_lost`, `stale` |
| `assigned_realtor_at` | timestamp when the lead was forwarded to a realtor |

### `lead_events` (new — append-only audit log)

| Field | Example |
|---|---|
| `lead_id` | FK |
| `event_type` | `submitted`, `email_sent_to_operator`, `delivered_to_realtor`, `realtor_marked_contacted`, `viewing_scheduled`, `realtor_marked_lost`, `buyer_confirmed_purchase`, `registry_match_found` |
| `actor` | `system`, `buyer`, `realtor:<id>`, `operator` |
| `metadata` | JSON, e.g. `{closing_date, sale_price_usd}` |
| `created_at` | auto |

**Append-only:** Postgres trigger rejects UPDATE/DELETE. This is the source of truth for disputes.

### `deals` (new — confirmed transactions)

| Field | Purpose |
|---|---|
| `lead_id` | FK to source lead |
| `buyer_name` | for registry matching |
| `closing_date` | actual close |
| `sale_price_usd` | final price |
| `realtor_commission_usd` | what realtor earned |
| `platform_referral_usd` | what realtor owes us |
| `confirmation_source` | enum: `realtor_reported`, `buyer_confirmed`, `registry_match`, `multi_source` |
| `status` | enum: `pending`, `confirmed`, `paid`, `disputed` |

**Rule:** `confirmed` requires `multi_source` (≥2 independent sources) or operator override. Until then `pending`, no commission billed.

### `buyer_confirmations` (new — survey responses)

| Field | Purpose |
|---|---|
| `lead_id` | FK |
| `survey_sent_at` | when follow-up was sent |
| `survey_token` | random token used in URL `/confirm/<token>` |
| `response` | `bought_via_us`, `bought_elsewhere`, `still_searching`, `not_buying`, `no_response` |
| `response_at` | when buyer answered |
| `details` | JSON: what they bought, when, through whom |

### `registry_matches` (new — RPP scraper results)

| Field | Purpose |
|---|---|
| `lead_id` | candidate match |
| `registry_state` | `jalisco`, `bcs`, `guanajuato` |
| `match_confidence` | 0.0–1.0 |
| `registered_name` | name from registry |
| `registered_property` | property description |
| `registered_date` | recording date |
| `reviewed_by_operator` | bool |

### `realtors` (extend existing)

| Field | Purpose |
|---|---|
| `contract_signed_at` | gate: no contract → no leads delivered |
| `contract_version` | which template was signed |
| `contract_pdf_url` | storage link to signed PDF |
| `referral_pct` | platform's share (15–25%) |

## User roles & UI

### Buyer
- Submits the existing lead form
- Sees `public_id` on the success state ("Your reference: MX-A4F2-7B3D — keep this number")
- Receives confirmation email immediately
- Receives follow-up email at day 60 → clicks unique link → answers one question

### Realtor (build in Phase D)
- Authenticated via Supabase Auth
- Dashboard at `/agent` shows their leads and status
- Buttons: Mark contacted / viewing / closed / lost
- Each click writes a `lead_events` row
- On Mark closed: must enter `closing_date`, `sale_price_usd`, upload closing docs
- Sees their `referral_pct` and outstanding balance

### Operator (you, build in Phase E)
- Dashboard at `/admin`
- Funnel view: counts per status, time in status, conversion rates
- Anomaly queues:
  - Leads stuck >30 days without status change
  - Disputed deals (realtor says lost, buyer says bought)
  - Unreviewed registry matches
  - Realtors with >40% lost rate (suspicious)

## Email communication

| To | When | Subject/content | Purpose |
|---|---|---|---|
| Operator (you) | On lead submit | Lead details + `public_id` | Real-time pipeline visibility |
| Operator | Weekly | Funnel digest: new X, in-progress Y, conversion Z | Metrics |
| Realtor | After operator approval | "New lead MX-A4F2: Bob, $500k budget" | Lead delivery |
| Buyer | On submit | Confirmation + reference ID | Trust signal |
| Buyer | +60 days | "Did you close? Need help with fideicomiso?" | **Layer 3 — reverse confirmation** |
| Buyer | +180 days | Follow-up if no day-60 response | Last chance |
| Realtor | Lead idle >14 days | "Please update status of lead MX-A4F2" | Force reporting |

## Anti-fraud auto-alerts (to you)

| Trigger | Action |
|---|---|
| Realtor has lead "contacted" for 90+ days without progress | Email Maria + cc you |
| Buyer answered "bought via us", realtor said "lost" | Dispute queue → operator investigation |
| Registry match found, no `deal` recorded | Alert: possible hidden close |
| One realtor loses >40% of leads in a quarter | Investigate — try a pilot with another realtor |
| Lead with large budget closes as "lost" fast | Investigate |

## Phasing

### Phase A — This sprint
- `leads.public_id` generation (DB function or app code) on insert
- `lead_events` table + trigger to auto-log on lead insert
- Resend → email to operator with all lead details and `public_id`
- Success state on the form shows the `public_id` to buyer
- WhatsApp deep-link includes `public_id` in the message body

### Phase B — Next 1–2 weeks (mostly offline)
- Find expat-property lawyer in Mexico, get one-page referral contract template ($300–500 one-time)
- Sign with 1–2 real pilot realtors
- In code: `realtor.contract_signed_at` required before lead routing

### Phase C — Month 1–2
- Vercel Cron Jobs (daily, free tier)
- 60-day follow-up email to buyer
- `/confirm/<token>` single-question page
- `buyer_confirmations` table
- `deals` table — initially populated by operator manually via Supabase Table Editor

### Phase D — Month 2–3
- Supabase Auth for realtors
- Realtor dashboard `/agent`
- Status-update buttons writing to `lead_events`
- Email reminders to inactive realtors via cron

### Phase E — Month 4–6
- Operator dashboard `/admin` (funnel, anomalies, disputes)
- RPP scraper, one state at a time (Jalisco and Guanajuato online; BCS limited)
- Match candidates → operator review queue
- Auto-flag suspicious patterns

### Phase F — 6+ months
- API for realtors who want to integrate
- Buyer-facing "your documents" / "deal status"
- Payment flow for commission collection (Stripe Connect or Wise)

## Things to internalize

1. **Real protection requires ≥20–30 leads of data.** Below that, statistical signals are too noisy to confidently say "Maria's conversion is anomalous". So Phase A+B give *weak* protection — that's normal for the first 6 months. Strength scales with volume.

2. **The contract is the foundation.** Every technical layer is meaningless without a legal agreement. With a contract, even partial evidence is enforceable; without one, even perfect evidence isn't.

3. **Transparency works both ways.** Good realtors *want* a transparent system — it protects them from accusations by competitors and from buyer disputes. Bad realtors self-select out. The system functions as a quality filter.

4. **Don't try to build everything at once.** Realistic order: Phase A this week → Phase B+C by month-end → rest as real deal volume justifies. Building Phase E before there's data to detect anomalies in is pure waste.
