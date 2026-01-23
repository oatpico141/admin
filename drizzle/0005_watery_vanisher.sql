CREATE INDEX `idx_contacts_contactDate` ON `contacts` (`contactDate`);--> statement-breakpoint
CREATE INDEX `idx_contacts_adminStaffId` ON `contacts` (`adminStaffId`);--> statement-breakpoint
CREATE INDEX `idx_contacts_receivingBranch` ON `contacts` (`receivingBranch`);--> statement-breakpoint
CREATE INDEX `idx_contacts_appointmentStatus` ON `contacts` (`appointmentStatus`);--> statement-breakpoint
CREATE INDEX `idx_contacts_date_admin` ON `contacts` (`contactDate`,`adminStaffId`);