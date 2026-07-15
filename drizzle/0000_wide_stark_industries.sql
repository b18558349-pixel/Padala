CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'failed');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_username" text NOT NULL,
	"sender_address" text NOT NULL,
	"recipient_username" text NOT NULL,
	"recipient_address" text NOT NULL,
	"amount_minor" text NOT NULL,
	"memo" text,
	"tx_hash" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"is_new_account" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "federation_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"domain" text DEFAULT 'padala.ph' NOT NULL,
	"stellar_address" text NOT NULL,
	"display_name" text NOT NULL,
	"memo" text,
	"memo_type" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "federation_users_username_unique" UNIQUE("username")
);
