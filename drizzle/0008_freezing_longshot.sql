DROP INDEX IF EXISTS `user_email_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `emailUniqueIndex` ON `user` (lower("email"));