CREATE TABLE `novel_spotlight` (
	`id` integer PRIMARY KEY NOT NULL,
	`image` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`novel_id` text NOT NULL,
	FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `novel` ADD `last_updated` text DEFAULT (current_timestamp) NOT NULL;