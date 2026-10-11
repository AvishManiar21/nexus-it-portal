-- Baseline schema, generated from the live Supabase database (public schema).
-- Represents everything the old database/*.sql scripts produced, in its final state.
-- New schema changes go in new, later-timestamped files in this folder.

-- Tables
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" serial,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "admin_users_pkey" PRIMARY KEY (id),
    CONSTRAINT "admin_users_email_key" UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" serial,
    "lead_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "subject" character varying(500) NOT NULL,
    "message" text NOT NULL,
    "status" character varying(50) DEFAULT 'new'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "engagement_logs" (
    "id" serial,
    "lead_id" integer NOT NULL,
    "action" character varying(255) NOT NULL,
    "details" text,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "engagement_logs_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "lead_notes" (
    "id" serial,
    "lead_id" integer NOT NULL,
    "admin_id" integer NOT NULL,
    "note" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "lead_notes_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "lead_status_audit" (
    "id" serial,
    "lead_id" integer NOT NULL,
    "admin_id" integer NOT NULL,
    "old_status" character varying(50) NOT NULL,
    "new_status" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "lead_status_audit_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "leads" (
    "id" serial,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "company" character varying(255),
    "phone" character varying(50),
    "source" character varying(100),
    "status" character varying(50) DEFAULT 'new'::character varying,
    "budget" character varying(100),
    "session_id" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "leads_pkey" PRIMARY KEY (id),
    CONSTRAINT "leads_email_key" UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" serial,
    "name" character varying(255) NOT NULL,
    "description" text,
    "category" character varying(100),
    "price" double precision,
    "image_url" character varying(500),
    "demo_video" character varying(500),
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "products_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "rfd_submissions" (
    "id" serial,
    "lead_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "message" text,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "rfd_submissions_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "video_engagement_events" (
    "id" serial,
    "session_id" uuid NOT NULL,
    "product_id" integer NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "watch_duration_seconds" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "lead_id" integer,
    CONSTRAINT "video_engagement_events_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "visitor_page_views" (
    "id" serial,
    "session_id" uuid NOT NULL,
    "product_id" integer NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT now(),
    "lead_id" integer,
    CONSTRAINT "visitor_page_views_pkey" PRIMARY KEY (id)
);

-- Foreign keys
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id);
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id);
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES admin_users(id);
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id);
ALTER TABLE "lead_status_audit" ADD CONSTRAINT "lead_status_audit_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES admin_users(id);
ALTER TABLE "lead_status_audit" ADD CONSTRAINT "lead_status_audit_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id);
ALTER TABLE "rfd_submissions" ADD CONSTRAINT "rfd_submissions_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id);
ALTER TABLE "rfd_submissions" ADD CONSTRAINT "rfd_submissions_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE "video_engagement_events" ADD CONSTRAINT "video_engagement_events_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE "video_engagement_events" ADD CONSTRAINT "video_engagement_events_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE "visitor_page_views" ADD CONSTRAINT "visitor_page_views_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE "visitor_page_views" ADD CONSTRAINT "visitor_page_views_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_id ON contact_messages USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_engagement_logs_lead_id ON engagement_logs USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_admin_id ON lead_notes USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_admin_id ON lead_status_audit USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_created_at ON lead_status_audit USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_lead_id ON lead_status_audit USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_rfd_submissions_lead_id ON rfd_submissions USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_rfd_submissions_product_id ON rfd_submissions USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_video_engagement_created_at ON video_engagement_events USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_video_engagement_events_lead_id ON video_engagement_events USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_video_engagement_product_id ON video_engagement_events USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_video_engagement_session_id ON video_engagement_events USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_lead_id ON visitor_page_views USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_product_id ON visitor_page_views USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_session_id ON visitor_page_views USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_viewed_at ON visitor_page_views USING btree (viewed_at);

-- Row Level Security (no policies: anon/authenticated are denied; the backend
-- uses the service-role key and the table-owner role, which bypass RLS)
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "engagement_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_status_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rfd_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "video_engagement_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visitor_page_views" ENABLE ROW LEVEL SECURITY;
