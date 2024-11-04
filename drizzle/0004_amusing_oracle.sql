CREATE TABLE `novel_favorite` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`user_id` text NOT NULL,
	`novel_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `type` text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `user` ADD `image` text;