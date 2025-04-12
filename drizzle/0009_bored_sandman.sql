ALTER TABLE `user` RENAME COLUMN `image` TO `avatar`;--> statement-breakpoint
ALTER TABLE `user` RENAME COLUMN `password_hash` TO `password`;--> statement-breakpoint
/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `user` ADD `provider` text NOT NULL default('credentials');--> statement-breakpoint
ALTER TABLE `user` ADD `provider_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_provider_id_unique` ON `user` (`provider_id`);