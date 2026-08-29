ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint

UPDATE "account" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential';

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

ALTER TABLE "account" ADD CONSTRAINT "account_issuer_account_id_key" UNIQUE("issuer","account_id");