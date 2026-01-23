CREATE TABLE `admin_staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`branch` enum('lamlukka','salaya') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientName` varchar(200) NOT NULL,
	`channel` enum('facebook','line','instagram','tiktok') NOT NULL,
	`phoneNumber` varchar(20),
	`appointmentStatus` enum('appointed','not_appointed') NOT NULL,
	`appointmentDate` date,
	`appointmentBranch` enum('lamlukka','salaya'),
	`receivingBranch` enum('lamlukka','salaya') NOT NULL,
	`adminStaffId` int NOT NULL,
	`hasInteraction` boolean NOT NULL DEFAULT true,
	`notes` text,
	`contactDate` date NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
