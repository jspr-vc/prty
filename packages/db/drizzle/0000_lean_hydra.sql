CREATE SCHEMA "better_auth";
--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'active', 'paused', 'finished');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('lobby', 'active', 'finished', 'abandoned');--> statement-breakpoint
CREATE TABLE "better_auth"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth"."invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth"."member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth"."organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "better_auth"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "better_auth"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"min_players" integer DEFAULT 2 NOT NULL,
	"max_players" integer DEFAULT 12 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "game_pack" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_pack_slug_unique" UNIQUE("game_id","slug")
);
--> statement-breakpoint
CREATE TABLE "game_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"host_user_id" text,
	"organization_id" text,
	"status" "session_status" DEFAULT 'lobby' NOT NULL,
	"active_match_id" uuid,
	"registration_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_session_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"pack_id" uuid,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"actor_player_id" uuid,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"team_id" uuid,
	"user_id" text,
	"token" uuid NOT NULL,
	"display_name" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"connected" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_player_token_unique" UNIQUE("token"),
	CONSTRAINT "session_player_name_unique" UNIQUE("session_id","display_name")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "team_name_unique" UNIQUE("session_id","name")
);
--> statement-breakpoint
ALTER TABLE "better_auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth"."invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth"."invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth"."member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "better_auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth"."member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_pack" ADD CONSTRAINT "game_pack_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_pack" ADD CONSTRAINT "game_pack_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "better_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session" ADD CONSTRAINT "game_session_host_user_id_user_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "better_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_session_id_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_pack_id_game_pack_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."game_pack"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_event" ADD CONSTRAINT "match_event_actor_player_id_session_player_id_fk" FOREIGN KEY ("actor_player_id") REFERENCES "public"."session_player"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_player" ADD CONSTRAINT "session_player_session_id_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_player" ADD CONSTRAINT "session_player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_player" ADD CONSTRAINT "session_player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_session_id_game_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_session_host_idx" ON "game_session" USING btree ("host_user_id");--> statement-breakpoint
CREATE INDEX "match_session_idx" ON "match" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "match_event_match_created_idx" ON "match_event" USING btree ("match_id","created_at");--> statement-breakpoint
CREATE INDEX "session_player_session_idx" ON "session_player" USING btree ("session_id");