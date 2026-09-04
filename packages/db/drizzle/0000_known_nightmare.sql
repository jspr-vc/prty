CREATE TABLE `app_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `buzzer_binding` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`key` text NOT NULL,
	`kind` text NOT NULL,
	`player_id` text,
	`team_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `session_player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `buzzer_binding_key_unique` ON `buzzer_binding` (`session_id`,`key`);--> statement-breakpoint
CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`min_players` integer DEFAULT 2 NOT NULL,
	`max_players` integer DEFAULT 12 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_slug_unique` ON `game` (`slug`);--> statement-breakpoint
CREATE TABLE `game_pack` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_pack_slug_unique` ON `game_pack` (`game_id`,`slug`);--> statement-breakpoint
CREATE TABLE `game_session` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`active_match_id` text,
	`registration_open` integer DEFAULT true NOT NULL,
	`narration_mode` text DEFAULT 'off' NOT NULL,
	`narration_rate` integer DEFAULT 95 NOT NULL,
	`narration_voice` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_session_code_unique` ON `game_session` (`code`);--> statement-breakpoint
CREATE TABLE `match` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`game_id` text NOT NULL,
	`pack_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`state` text DEFAULT '{}' NOT NULL,
	`rev` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`pack_id`) REFERENCES `game_pack`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `match_session_idx` ON `match` (`session_id`);--> statement-breakpoint
CREATE TABLE `match_event` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`actor_player_id` text,
	`type` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `match`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_player_id`) REFERENCES `session_player`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `match_event_match_created_idx` ON `match_event` (`match_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `narration_clip` (
	`id` text PRIMARY KEY NOT NULL,
	`engine` text NOT NULL,
	`voice` text,
	`text` text NOT NULL,
	`mime_type` text NOT NULL,
	`audio` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_player` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`team_id` text,
	`token` text NOT NULL,
	`display_name` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`connected` integer DEFAULT true NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_player_token_unique` ON `session_player` (`token`);--> statement-breakpoint
CREATE INDEX `session_player_session_idx` ON `session_player` (`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_player_name_unique` ON `session_player` (`session_id`,`display_name`);--> statement-breakpoint
CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_name_unique` ON `team` (`session_id`,`name`);