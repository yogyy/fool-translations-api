ALTER TABLE `novel` ADD `status` text DEFAULT 'ongoing';--> statement-breakpoint
CREATE UNIQUE INDEX `novel_chapter_novel_id_chapter_number_unique` ON `novel_chapter` (`novel_id`,`chapter_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `novel_author_title_unique` ON `novel` (`author`,`title`);