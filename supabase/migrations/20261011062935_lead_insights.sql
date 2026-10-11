-- Cached AI-written lead insights (one row per lead, replaced on regenerate).
-- The lead score is computed live by the backend and is not stored here.

CREATE TABLE IF NOT EXISTS "lead_insights" (
    "lead_id" integer PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
    "summary" text NOT NULL,
    "next_step" text NOT NULL,
    "email_subject" text NOT NULL,
    "email_body" text NOT NULL,
    "model" character varying(100) NOT NULL,
    "generated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Same policy as every other table: no anon/authenticated access; the backend
-- uses the service-role key, which bypasses RLS.
ALTER TABLE "lead_insights" ENABLE ROW LEVEL SECURITY;
