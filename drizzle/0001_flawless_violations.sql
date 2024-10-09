CREATE TABLE `novel_rating` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`novel_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` real NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `novel_chapter` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_number` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`content` text NOT NULL,
	`novel_id` text NOT NULL,
	FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `novel` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`genres` text DEFAULT (json_array()),
	`synopsis` text NOT NULL,
	`cover` text,
	`banner` text,
	`total_views` integer DEFAULT 0,
	`published_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `novel_rating_novel_id_user_id_unique` ON `novel_rating` (`novel_id`,`user_id`);