CREATE TABLE `commission_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`minCount` int NOT NULL,
	`maxCount` int,
	`amountPerPerson` int NOT NULL,
	`branch` enum('lamlukka','salaya'),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commission_tiers_id` PRIMARY KEY(`id`)
);
