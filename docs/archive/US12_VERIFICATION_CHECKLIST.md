# US12 Verification Checklist

## Story
As an Identified Lead, I want the contact and business details I submitted to be stored exactly as I entered them, so that the Nexus-IT sales team reaches out to the right person with the correct information without any confusion.

## Branch / Commit Under Test
- Branch: `US-12-submission-data-integrity`
- Commit: `df8d7df`

## Preconditions
1. Checkout branch:
   - `git checkout US-12-submission-data-integrity`
2. Ensure backend and frontend are running.
3. Ensure Supabase has latest schema (including `leads.budget` and `leads.session_id`).
4. Set env vars for API endpoints.

## Acceptance Criteria Mapping

### AC1: Lead profile stores all five fields exactly as submitted
Fields:
- company name
- contact person
- email
- phone
- budget range

Verification:
1. Submit RFD form with unique values:
   - company: `ACME   Holdings` (include intentional spacing if testing exactness)
   - contact person: `Jamie Carter`
   - email: `jamie.us12+rfd@example.com`
   - phone: `+1 (555) 010-7777`
   - budget: `$10,000 - $25,000`
2. Open admin lead profile for created lead.
3. Confirm all fields match input exactly.

SQL spot-check:
```sql
select id, name, email, company, phone, budget, source, created_at
from leads
where email = 'jamie.us12+rfd@example.com'
order by created_at desc;
```

Expected:
- `name = Jamie Carter`
- `company = ACME   Holdings`
- `phone = +1 (555) 010-7777`
- `budget = $10,000 - $25,000`

---

### AC2: All RFD and Contact Us submissions accessible from lead profile
Verification:
1. For same email, submit Contact Us form:
   - name: `Jamie Carter`
   - email: `jamie.us12+rfd@example.com`
   - company: `ACME   Holdings`
   - phone: `+1 (555) 010-7777`
   - budget: `$10,000 - $25,000`
   - subject/message: any unique text
2. Open admin lead profile.
3. Confirm:
   - RFD submission appears in RFD panel.
   - Contact submission appears in Contact Messages panel.
   - No missing required fields in header details.

SQL spot-check:
```sql
select l.id as lead_id, l.email, r.id as rfd_id, c.id as contact_id
from leads l
left join rfd_submissions r on r.lead_id = l.id
left join contact_messages c on c.lead_id = l.id
where l.email = 'jamie.us12+rfd@example.com';
```

Expected:
- At least one `rfd_id` and one `contact_id` present for same lead.

---

### AC3: Profile created correctly under simultaneous submissions
Verification method A (UI):
1. Open two browser windows (or window + incognito).
2. Prepare two different emails and submit both forms at the same time.
3. Confirm both lead profiles exist and each has complete fields.

Verification method B (API / quick concurrency):
```powershell
$body1 = @{name='A One'; email='a.one.us12@example.com'; company='Comp A'; phone='111-111-1111'; budget='$1,000 - $5,000'; subject='S1'; message='M1'} | ConvertTo-Json
$body2 = @{name='B Two'; email='b.two.us12@example.com'; company='Comp B'; phone='222-222-2222'; budget='$5,000 - $10,000'; subject='S2'; message='M2'} | ConvertTo-Json

$job1 = Start-Job { param($b) Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/contact/submit' -ContentType 'application/json' -Body $b } -ArgumentList $body1
$job2 = Start-Job { param($b) Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/contact/submit' -ContentType 'application/json' -Body $b } -ArgumentList $body2

Receive-Job -Wait -AutoRemoveJob $job1
Receive-Job -Wait -AutoRemoveJob $job2
```

Expected:
- Both submissions succeed.
- Two complete lead profiles are created.

---

### AC4: No submitted data is altered, truncated, or lost
Verification:
1. Submit edge-format values (long company name, punctuation in phone, plus-tagged email).
2. Compare form payload values against DB row and admin UI values.

SQL spot-check:
```sql
select id, name, email, company, phone, budget
from leads
where email in ('jamie.us12+rfd@example.com', 'a.one.us12@example.com', 'b.two.us12@example.com')
order by id desc;
```

Expected:
- Stored values match submitted values exactly.

---

### AC5: Lead profile immediately retrievable and accurate after submission
Verification:
1. Submit form.
2. Immediately navigate to Admin > Leads > target lead.
3. Confirm profile loads and fields + submissions are visible without delay.

Expected:
- Lead profile API and admin page show newly submitted data right away.

## Suggested Evidence to Capture
1. Screenshot of submitted form values.
2. Screenshot of corresponding admin lead profile.
3. SQL result screenshot for lead row.
4. SQL result screenshot for linked RFD/contact rows.
5. Output from concurrency run (jobs completed successfully).

## Pass/Fail Record
| Check | Result | Evidence |
|---|---|---|
| AC1 exact 5-field storage | Pass | Lead #1 profile values matched submitted payload: name/email/company/phone/budget |
| AC2 RFD + Contact visible on profile | Pass | Lead #1 shows `contact_messages_count=1` and `rfd_submissions_count=1` |
| AC3 concurrent submissions complete | Pass | Two concurrent contact submissions succeeded with distinct `lead_id` values (1 and 2) |
| AC4 no alteration/truncation/loss | Pass | Retrieved lead values exactly matched submitted strings for both concurrent leads |
| AC5 immediate admin retrieval | Pass | `GET /leads/{id}/profile` succeeded immediately after submissions |

## Live Evidence (2026-04-23)
1. Concurrent Contact submissions:
   - `us12.a.20260423193024@example.com` -> `lead_id: 1`
   - `us12.b.20260423193024@example.com` -> `lead_id: 2`
2. Lead #1 profile after RFD submit:
   - `contact_messages_count: 1`
   - `rfd_submissions_count: 1`
   - `latest_rfd_product: Cloud Services`
3. Integrity checks:
   - `ac1_exact_fields: true`
   - `ac2_rfd_and_contact: true`
   - `ac3_concurrent_profiles_created: true`
   - `ac5_immediate_retrieval: true`
