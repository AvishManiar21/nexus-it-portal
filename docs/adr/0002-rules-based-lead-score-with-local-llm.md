# ADR 0002: Rules decide the lead score; a local LLM only writes

- **Status:** Accepted, implemented (`app/services/lead_insights.py`)
- **Date:** 2026-10-11
- **Area:** AI lead insights on the admin lead page

## Context

Admins needed help prioritizing leads and writing follow-ups. The portal already records each visitor's journey (solution pages viewed, demo videos started and completed) and links it to the lead on form submission, which is a strong signal most lead forms don't have.

Constraints:
- **Privacy:** lead data includes names, emails and phone numbers. Sending it to third-party APIs or "free credit" gateways conflicts with the site's privacy policy.
- **Cost:** free or near-free.
- **Hardware:** a laptop GPU (RTX 4050), so only small models (3–4B parameters) run well.

## Experiment

`gemma3:4b` and `llama3.2` (3B) were asked to score a clearly hot synthetic lead: demo video watched to the end, demo requested, $10k+ budget, urgent audit after a phishing incident.

| | gemma3:4b | llama3.2 |
|---|---|---|
| Score given | **warm** | **warm** |
| Text quality | good | ok, invented an upsell |
| Time | 96 s | 35 s |

Both returned valid structured output, but **both mis-rated an obviously hot lead**. Small models are unreliable at calibrated judgments.

## Decision

1. **The score is computed in code** by transparent rules, each shown to the admin with its points:
   demo request (+30) or contact message (+15) · budget (+3 to +25, parsed from both form scales) · solution page views (+2 each, max +10) · demo video completed (+15) or started (+5) · activity in the last 7 / 30 days (+10 / +5). 60+ is **Hot**, 35+ is **Warm**.
2. **The model only writes**: a summary, a next step and a draft follow-up email, given the computed facts and the **fixed** score, with an instruction not to change it or invent facts.
3. **It runs locally** through Ollama's OpenAI-compatible API (any compatible endpoint can be configured).
4. **The prompt omits email and phone** (data minimization).
5. **Output is constrained** by a JSON schema and validated with Pydantic. Failures return 503 instead of partial data.
6. **Results are cached** in `lead_insights` and regenerated on demand. A "stale" flag appears when newer activity exists.

## Consequences

- ✅ The same lead now scores **HOT (80)**, explained line by line, deterministic and unit-tested.
- ✅ With grounded facts, `llama3.2` produces an accurate summary and email in about 5–20 s on the laptop GPU, and the invented upsell disappeared.
- ✅ No lead data leaves the machine; no API cost.
- ➖ Rule weights are hand-tuned. With enough conversion data they could be fitted (for example logistic regression), keeping the same transparent breakdown.
- ➖ Requires Ollama running locally; the UI shows a clear message when it's unavailable.

## Lessons

Use the model for what it's good at (language), and keep decisions that must be consistent and explainable in code.
