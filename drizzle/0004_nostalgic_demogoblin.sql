ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','staff') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `users` ADD `linkedAdminStaffId` int;