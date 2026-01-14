DROP TABLE `irpf_forms`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
DROP TABLE `selic_table`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password_hash`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `can_edit`;